import { RestaurantRail } from './RestaurantRail'
import type { FeaturedRestaurant } from '@/lib/types/dining'

export function DiningDiscoverSection({
  restaurants,
}: {
  restaurants: FeaturedRestaurant[]
}) {
  return (
    <RestaurantRail
      title="Discover best restaurants on Dineout"
      restaurants={restaurants}
      className="relative left-1/2 w-screen -translate-x-1/2 bg-[#FFF7F2]"
    />
  )
}
