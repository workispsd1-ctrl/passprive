'use client'

import { FeedRestaurantCard } from '@/components/sections/dining/FeedRestaurantCard'
import type { FeaturedRestaurant } from '@/lib/types/dining'
import { HScroll } from './HScroll'

/**
 * A home rail of restaurant cards — app parity: Home/FreshSpots.jsx ("New
 * Dining Spots": bare TrendingCards — photo + offer strip, no badges or chips)
 * and Home/FamilyFeast.jsx (white TrendingCards with chips). Location first,
 * then cuisines • cost for two, as both pass `locationFirst`.
 */
export function HomeRestaurantRail({
  title,
  restaurants,
  variant,
}: {
  title: string
  restaurants: FeaturedRestaurant[]
  variant: 'card' | 'bare'
}) {
  const items = restaurants.filter(r => r.cover_image)
  if (!items.length) return null
  return (
    <HScroll title={title}>
      {items.map(r => (
        <FeedRestaurantCard key={r.id} r={r} variant={variant} withCost />
      ))}
    </HScroll>
  )
}
