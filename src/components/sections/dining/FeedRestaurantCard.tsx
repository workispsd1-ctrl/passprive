'use client'

import { useLocation } from '@/lib/context/LocationContext'
import { useUserPlan } from '@/lib/context/PlanContext'
import { formatDistanceKm, haversineKm } from '@/lib/utils'
import { getCardBadge } from '@/lib/cashback'
import { getCardChips } from '@/lib/cardChips'
import { DiningMerchantCard } from './DiningMerchantCard'
import type { FeaturedRestaurant } from '@/lib/types/dining'

/** A `restaurant_feed` row rendered as the shared dining card (distance from the user's location). */
export function FeedRestaurantCard({ r }: { r: FeaturedRestaurant }) {
  const { location } = useLocation()
  const plan = useUserPlan()
  // Measured from the location selected right now; the feed's own distance
  // (from the last saved location) is the fallback. Null = unknown, show nothing.
  const dist =
    location.lat != null && location.lng != null && r.latitude != null && r.longitude != null
      ? haversineKm(location.lat, location.lng, Number(r.latitude), Number(r.longitude))
      : (r.distance_km ?? null)

  const meta = [formatDistanceKm(dist), r.area ?? r.city].filter(Boolean).join(' • ')
  const stampSheet =
    r.repeat_rewards_enabled || r.mood.some((m) => m.toLowerCase().includes('stamp'))

  return (
    <DiningMerchantCard
      id={r.id}
      slug={r.slug}
      name={r.name}
      image={r.cover_image}
      cardBadge={getCardBadge(r, plan)}
      offerLabel={r.offer_badge ?? undefined}
      trending={r.is_advertised}
      stampSheet={stampSheet}
      rating={r.rating}
      ratingCount={r.rating_count}
      meta={meta || undefined}
      tagline={r.cuisines.length ? r.cuisines.join(', ') : undefined}
      chips={getCardChips(r)}
    />
  )
}
