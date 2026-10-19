import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { REVIEW_CONFIG, REVIEW_MAX_TEXT, isReviewKind } from '@/lib/reviews'

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
 * Submit a review — ported from the app's `submitRestaurantReview` /
 * `submitTouristReview`: one star rating per step, overall = their average
 * unless a step is the overall rating itself. Runs server-side so it uses
 * the (httpOnly) auth cookies.
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

  const body = (await request.json().catch(() => ({}))) as {
    entityId?: string
    ratings?: Record<string, unknown>
    text?: string
  }
  const entityId = typeof body.entityId === 'string' ? body.entityId : ''
  const stars = config.steps.map(step => star(body.ratings?.[step.key]))
  if (!entityId || stars.some(s => s == null)) {
    return NextResponse.json({ error: 'Please complete every rating.' }, { status: 400 })
  }
  const values = stars as number[]
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, REVIEW_MAX_TEXT) : ''

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

  const overallIndex = config.steps.findIndex(step => step.column == null)
  const rating =
    overallIndex >= 0
      ? values[overallIndex]
      : Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))

  const subRatings: Record<string, number> = {}
  config.steps.forEach((step, i) => {
    if (step.column) subRatings[step.column] = values[i]
  })

  const { data, error } = await supabase
    .from(config.table)
    .insert({
      [config.entityColumn]: entityId,
      user_id: user.id,
      rating,
      ...subRatings,
      review_text: text || null,
      liked_tags: [],
      photo_urls: [],
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
  return NextResponse.json({ id: data.id, approved: data.is_approved === true })
}
