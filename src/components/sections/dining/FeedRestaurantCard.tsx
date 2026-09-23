'use client'

import { useLocation } from '@/lib/context/LocationContext'
import { useUserPlan } from '@/lib/context/PlanContext'
import { formatDistanceKm, haversineKm } from '@/lib/utils'
import { getCashbackBadgeArt } from '@/lib/cashback'
import { DiningMerchantCard } from './DiningMerchantCard'
import type { FeaturedRestaurant } from '@/lib/types/dining'

/** A `restaurant_feed` row rendered as the shared dining card (distance from the user's location). */
export function FeedRestaurantCard({ r }: { r: FeaturedRestaurant }) {
  const { location } = useLocation()
  const plan = useUserPlan()
  const dist =
    r.distance_km ??
    (location.lat != null && location.lng != null && r.latitude != null && r.longitude != null
      ? haversineKm(location.lat, location.lng, r.latitude, r.longitude)
      : null)

  const meta = [formatDistanceKm(dist), r.area ?? r.city].filter(Boolean).join(' • ')
  const stampSheet =
    r.repeat_rewards_enabled || r.mood.some((m) => m.toLowerCase().includes('stamp'))

  return (
    <DiningMerchantCard
      id={r.id}
      slug={r.slug}
      name={r.name}
      image={r.cover_image}
      cashbackArt={getCashbackBadgeArt(r, plan)}
      offerLabel={r.offer_badge ?? undefined}
      trending={r.is_advertised}
      stampSheet={stampSheet}
      rating={r.rating}
      ratingCount={r.rating_count}
      meta={meta || undefined}
      tagline={r.cuisines.length ? r.cuisines.join(', ') : undefined}
    />
  )
}
