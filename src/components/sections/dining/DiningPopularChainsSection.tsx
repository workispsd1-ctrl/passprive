import { RestaurantRail } from './RestaurantRail'
import type { FeaturedRestaurant } from '@/lib/types/dining'

/**
 * "Popular Chains" (dining-specific) — app parity: DininHome/PopularChains.jsx
 * → `loadPopularChains()`, a location-scoped `fetchScopedFeed` RPC sorted by
 * distance and capped to a nearby radius. That RPC isn't ported to web, so
 * this is approximated with the general restaurant feed.
 *
 * Distinct from the home page's `PopularChainsSection` (store logos).
 *
 * TODO(design): wire the real distance-scoped feed RPC once it's ported.
 */
export function DiningPopularChainsSection({
  restaurants,
}: {
  restaurants: FeaturedRestaurant[]
}) {
  return <RestaurantRail title="Popular Chains" restaurants={restaurants} />
}
