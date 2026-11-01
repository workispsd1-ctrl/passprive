import { RestaurantRail } from './RestaurantRail'
import type { FeaturedRestaurant } from '@/lib/types/dining'

/**
 * "Offers You'll love" — Figma Dining Page_Web, between "Now trending" and
 * "Popular Chains": restaurants with a live offer, best rated first
 * (getOfferRestaurants).
 */
export function OffersYoullLoveSection({
  restaurants,
}: {
  restaurants: FeaturedRestaurant[]
}) {
  return <RestaurantRail title={"Offers You’ll love"} restaurants={restaurants} />
}
