'use client'

import { HScroll } from '@/components/sections/home/HScroll'
import { FeedRestaurantCard } from './FeedRestaurantCard'
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
  if (!restaurants.length) return null

  return (
    <HScroll title={title} className={className}>
      {restaurants.map((r) => (
        <FeedRestaurantCard key={r.id} r={r} />
      ))}
    </HScroll>
  )
}
