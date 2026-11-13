import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { REVIEW_CONFIG, REVIEW_MAX_TEXT, isReviewKind, overallRating, usesAspectRatings } from '@/lib/reviews'
import { REVIEW_PHOTO_BUCKET, REVIEW_PHOTO_MAX, REVIEW_PHOTO_MAX_BYTES, REVIEW_PHOTO_TYPES } from '@/lib/reviewPhotos'

function star(v: unknown): number | null {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null
}

type Ctx = { params: Promise<{ kind: string }> }

/**
 * Whether the viewer is logged in, and their own review of this place (any
 * approval state) so it can be edited — app parity: restaurantReviews.js fetchMyReview.
 */
export async function GET(request: Request, { params }: Ctx) {
  const { kind } = await params
  const entityId = new URL(request.url).searchParams.get('entityId') ?? ''
  if (!isReviewKind(kind) || !entityId) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ loggedIn: false, reviewed: false, mine: null })

  const config = REVIEW_CONFIG[kind]
  const columns = config.steps.map(step => step.column).filter(Boolean)
  // includes reviews still awaiting approval
  const { data } = await supabase
    .from(config.table)
    .select(['id', 'rating', 'review_text', ...columns].join(', '))
    .eq(config.entityColumn, entityId)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const row = data as Record<string, unknown> | null
  // each aspect's stars, falling back to the overall rating (app: fetchMyReview prefill)
  const overall = Math.round(Number(row?.rating) || 0)
  const ratings = row
    ? Object.fromEntries(
        usesAspectRatings(kind)
          ? config.steps.map(step => [step.key, Math.round(Number(row[step.column as string]) || overall)])
          : [['rating', overall]],
      )
    : null
  return NextResponse.json({
    loggedIn: true,
    reviewed: !!row,
    mine: row ? { ratings, text: String(row.review_text ?? '') } : null,
  })
}

/**
 * Submit a review: a star rating for each aspect (app parity: LeaveReviewModal —
 * Food / Service / Ambience, relabelled for stores; the overall `rating` is
 * their average), optional text and up to five photos. Tourist places rate once. Runs
 * server-side so it uses the (httpOnly) auth cookies. A photo that can't be
 * stored doesn't cost the member their review — `photosSaved` says so.
 */
export async function POST(request: Request, { params }: Ctx) {
  const { kind } = await params
  if (!isReviewKind(kind)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  const config = REVIEW_CONFIG[kind]

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Please log in to submit a review.' }, { status: 401 })
  }

  const form = await request.formData().catch(() => null)
  const entityId = String(form?.get('entityId') ?? '')
  // each aspect's stars go to its column; the overall rating is their average
  const aspects = usesAspectRatings(kind)
    ? config.steps.map(step => ({ column: step.column as string, value: star(form?.get(step.key)) }))
    : []
  const rating = aspects.length
    ? (aspects.every(a => a.value != null) ? overallRating(aspects.map(a => a.value as number)) : null)
    : star(form?.get('rating'))
  if (!entityId || rating == null) {
    return NextResponse.json({ error: aspects.length ? 'Please rate every part of your visit.' : 'Please choose a star rating.' }, { status: 400 })
  }
  const text = String(form?.get('text') ?? '').trim().slice(0, REVIEW_MAX_TEXT)
  const photos = (form?.getAll('photos') ?? []).filter((f): f is File => f instanceof File && f.size > 0)
  if (photos.length > REVIEW_PHOTO_MAX) {
    return NextResponse.json({ error: `You can add up to ${REVIEW_PHOTO_MAX} images.` }, { status: 400 })
  }
  if (photos.some(f => !REVIEW_PHOTO_TYPES[f.type])) {
    return NextResponse.json({ error: 'Please add JPG, PNG, WEBP or HEIC images.' }, { status: 400 })
  }
  if (photos.some(f => f.size > REVIEW_PHOTO_MAX_BYTES)) {
    return NextResponse.json({ error: 'Each image must be under 10 MB.' }, { status: 400 })
  }

  const { data: existing, error: existingErr } = await supabase
    .from(config.table)
    .select('id')
    .eq(config.entityColumn, entityId)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 })
  }
  // app parity (fbaf070): a second review updates the member's existing one
  const existingId = existing?.[0]?.id as string | number | undefined

  const { data: userRow } = await supabase
    .from('users')
    .select('full_name, profile_image')
    .eq('id', user.id)
    .maybeSingle()

  const photoUrls: string[] = []
  for (const [i, photo] of photos.entries()) {
    const path = `${user.id}/${Date.now()}-${i}.${REVIEW_PHOTO_TYPES[photo.type]}`
    const { error: uploadError } = await supabase.storage
      .from(REVIEW_PHOTO_BUCKET)
      .upload(path, await photo.arrayBuffer(), { contentType: photo.type, upsert: false })
    if (uploadError) {
      console.error('[reviews] photo upload failed:', uploadError.message)
      continue
    }
    photoUrls.push(supabase.storage.from(REVIEW_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl)
  }

  const payload = {
    [config.entityColumn]: entityId,
    user_id: user.id,
    rating,
    ...Object.fromEntries(aspects.map(a => [a.column, a.value])),
    review_text: text || null,
    // an edit without new images keeps the ones already on the review
    ...(existingId == null || photos.length ? { photo_urls: photoUrls } : {}),
    username_snapshot: userRow?.full_name || (user.user_metadata?.full_name as string | undefined) || null,
    avatar_snapshot: userRow?.profile_image || null,
  }
  const { data, error } = existingId != null
    ? await supabase.from(config.table).update(payload).eq('id', existingId).eq('user_id', user.id).select('id, is_approved').single()
    : await supabase.from(config.table).insert({ ...payload, liked_tags: [] }).select('id, is_approved').single()
  if (error) {
    // 42501 = blocked by the table's row-level security policy
    const message =
      error.code === '42501'
        ? 'Reviews can’t be saved here yet. Please try again later.'
        : error.message
    console.error(`[reviews] ${existingId != null ? 'update' : 'insert'} of ${config.table} failed:`, error.code, error.message)
    return NextResponse.json({ error: message }, { status: error.code === '42501' ? 403 : 500 })
  }

  revalidatePath(config.path, 'page')
  if (kind === 'store') revalidatePath('/wellness/[id]', 'page')
  return NextResponse.json({ id: data.id, approved: data.is_approved === true, photosSaved: photoUrls.length === photos.length })
}
