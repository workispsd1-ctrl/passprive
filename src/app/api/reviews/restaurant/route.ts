import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const MAX_TEXT = 1000

function star(v: unknown): number | null {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null
}

/**
 * Submit a restaurant review — ported from the app's `submitRestaurantReview`
 * (utils/restaurantReviews.js) as called by LeaveReviewModal: food, service
 * and ambience stars, overall = their average. Runs server-side so it uses
 * the (httpOnly) auth cookies.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Please log in to submit a review.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    restaurantId?: string
    food?: number
    service?: number
    ambience?: number
    text?: string
  }
  const food = star(body.food)
  const service = star(body.service)
  const ambience = star(body.ambience)
  const restaurantId = typeof body.restaurantId === 'string' ? body.restaurantId : ''
  if (!restaurantId || !food || !service || !ambience) {
    return NextResponse.json({ error: 'Please rate food, service and ambience.' }, { status: 400 })
  }
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, MAX_TEXT) : ''

  const { data: existing, error: existingErr } = await supabase
    .from('restaurant_reviews')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('user_id', user.id)
    .limit(1)
  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 })
  }
  if (existing?.length) {
    return NextResponse.json({ error: 'You have already reviewed this restaurant.' }, { status: 409 })
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('full_name, profile_image')
    .eq('id', user.id)
    .maybeSingle()

  const { data, error } = await supabase
    .from('restaurant_reviews')
    .insert({
      restaurant_id: restaurantId,
      user_id: user.id,
      rating: Number(((food + service + ambience) / 3).toFixed(1)),
      food_rating: food,
      service_rating: service,
      ambience_rating: ambience,
      review_text: text || null,
      liked_tags: [],
      photo_urls: [],
      username_snapshot: userRow?.full_name || (user.user_metadata?.full_name as string | undefined) || null,
      avatar_snapshot: userRow?.profile_image || null,
    })
    .select('id, is_approved')
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidatePath('/dining/[id]', 'page')
  return NextResponse.json({ id: data.id, approved: data.is_approved === true })
}
