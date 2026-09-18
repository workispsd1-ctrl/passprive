'use client'

import { useLocation } from '@/lib/context/LocationContext'
import { formatDistanceKm, haversineKm } from '@/lib/utils'
import { showsCashbackBadge } from '@/lib/cashback'
import { HScroll } from '@/components/sections/home/HScroll'
import { CARD_FRAME_COLORS } from '@/components/sections/home/MerchantCard'
import { DiningMerchantCard } from './DiningMerchantCard'
import type { FeaturedRestaurant } from '@/lib/types/dining'

/**
 * Shared restaurant-card carousel — used by "Discover best restaurants on
 * Dineout", "Offers You'll love" and "Popular Chains" on /dining, which the
 * app backs with different queries (newest / highest-discount / a
 * location-scoped feed RPC) but renders with the same restaurant card.
 */
export function RestaurantRail({
  title,
  restaurants,
  className,
}: {
  title: string
  restaurants: FeaturedRestaurant[]
  className?: string
}) {
  const { location } = useLocation()
  const { lat: userLat, lng: userLng } = location

  if (!restaurants.length) return null

  return (
    <HScroll title={title} className={className}>
      {restaurants.map((r, i) => {
        const dist =
          userLat != null &&
          userLng != null &&
          r.latitude != null &&
          r.longitude != null
            ? haversineKm(userLat, userLng, r.latitude, r.longitude)
            : null

        const meta = [formatDistanceKm(dist), r.area ?? r.city]
          .filter(Boolean)
          .join(' • ')

        const stampSheet =
          r.repeat_rewards_enabled ||
          r.mood.some((m) => m.toLowerCase().includes('stamp'))

        return (
          <DiningMerchantCard
            key={r.id}
            id={r.id}
            slug={r.slug}
            name={r.name}
            image={r.cover_image}
            cashback={showsCashbackBadge(r)}
            offerLabel={r.offer_badge ?? undefined}
            trending={r.is_advertised}
            stampSheet={stampSheet}
            rating={r.rating}
            ratingCount={r.rating_count}
            meta={meta || undefined}
            tagline={r.cuisines.length ? r.cuisines.join(', ') : undefined}
            frameColor={CARD_FRAME_COLORS[i % CARD_FRAME_COLORS.length]}
          />
        )
      })}
    </HScroll>
  )
}
