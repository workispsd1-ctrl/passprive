import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { YourReviewsClient, type UserReview } from './YourReviewsClient'

export const metadata: Metadata = {
  title: 'Your Reviews | PassPrivé',
}

/** app parity: screens/YourReviewsScreen.jsx — the user's own restaurant reviews. */
export default async function YourReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: rows } = await supabase
    .from('restaurant_reviews')
    .select('id, restaurant_id, rating, review_text, food_rating, service_rating, ambience_rating, is_approved, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const restaurantIds = [...new Set((rows ?? []).map(r => r.restaurant_id).filter(Boolean))]
  const { data: restaurants } = restaurantIds.length
    ? await supabase.from('restaurants').select('id, name, slug, area, city, cover_image').in('id', restaurantIds)
    : { data: [] }
  const byId = new Map((restaurants ?? []).map(r => [r.id, r]))

  const reviews: UserReview[] = (rows ?? []).map(r => {
    const restaurant = byId.get(r.restaurant_id)
    return {
      id: r.id,
      rating: Number(r.rating ?? 0),
      text: r.review_text ?? '',
      food: r.food_rating,
      service: r.service_rating,
      ambience: r.ambience_rating,
      approved: r.is_approved === true,
      createdAt: r.created_at,
      restaurant: restaurant
        ? {
            name: restaurant.name,
            href: `/dining/${restaurant.slug ?? restaurant.id}`,
            area: [restaurant.area, restaurant.city].filter(Boolean).join(', '),
            image: restaurant.cover_image,
          }
        : null,
    }
  })

  return (
    <main className="min-h-screen">
      <SetPageTitle title="Your reviews" />
      <YourReviewsClient reviews={reviews} />
    </main>
  )
}
