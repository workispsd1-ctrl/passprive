import { RestaurantRail } from './RestaurantRail'
import type { FeaturedRestaurant } from '@/lib/types/dining'

/**
 * "Offers You'll love" — app parity: PromotionalCards.jsx (a CMS-driven
 * `promotional_collections` banner whose restaurant rail is matched by mood
 * tag via an RPC not ported to web). Approximated here with the
 * highest-discount restaurants from the general feed.
 *
 * TODO(design): wire the real `promotional_collections` banner + mood-tag
 * matched restaurant rail once that RPC exists on the web.
 */
export function OffersYoullLoveSection({
  restaurants,
}: {
  restaurants: FeaturedRestaurant[]
}) {
  return <RestaurantRail title={"Offers You’ll love"} restaurants={restaurants} />
}
