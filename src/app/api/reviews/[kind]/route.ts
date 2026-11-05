import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { REVIEW_CONFIG, REVIEW_MAX_TEXT, isReviewKind } from '@/lib/reviews'
import { REVIEW_PHOTO_BUCKET, REVIEW_PHOTO_MAX, REVIEW_PHOTO_MAX_BYTES, REVIEW_PHOTO_TYPES } from '@/lib/reviewPhotos'

function star(v: unknown): number | null {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null
}

type Ctx = { params: Promise<{ kind: string }> }

/** Whether the viewer is logged in and has already reviewed this place. */
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
  if (!user) return NextResponse.json({ loggedIn: false, reviewed: false })

  const config = REVIEW_CONFIG[kind]
  // includes reviews still awaiting approval
  const { data } = await supabase
    .from(config.table)
    .select('id')
    .eq(config.entityColumn, entityId)
    .eq('user_id', user.id)
    .limit(1)
  return NextResponse.json({ loggedIn: true, reviewed: !!data?.length })
}

/**
 * Submit a review: one star rating, optional text and up to five photos. Runs
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
  const rating = star(form?.get('rating'))
  if (!entityId || rating == null) {
    return NextResponse.json({ error: 'Please choose a star rating.' }, { status: 400 })
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
    .limit(1)
  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 })
  }
  if (existing?.length) {
    return NextResponse.json({ error: 'You have already left a review here.' }, { status: 409 })
  }

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

  const { data, error } = await supabase
    .from(config.table)
    .insert({
      [config.entityColumn]: entityId,
      user_id: user.id,
      rating,
      review_text: text || null,
      liked_tags: [],
      photo_urls: photoUrls,
      username_snapshot: userRow?.full_name || (user.user_metadata?.full_name as string | undefined) || null,
      avatar_snapshot: userRow?.profile_image || null,
    })
    .select('id, is_approved')
    .single()
  if (error) {
    // 42501 = blocked by the table's row-level security policy
    const message =
      error.code === '42501'
        ? 'Reviews can’t be saved here yet. Please try again later.'
        : error.message
    console.error(`[reviews] insert into ${config.table} failed:`, error.code, error.message)
    return NextResponse.json({ error: message }, { status: error.code === '42501' ? 403 : 500 })
  }

  revalidatePath(config.path, 'page')
  if (kind === 'store') revalidatePath('/wellness/[id]', 'page')
  return NextResponse.json({ id: data.id, approved: data.is_approved === true, photosSaved: photoUrls.length === photos.length })
}
