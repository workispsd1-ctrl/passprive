import { createClient } from '@/lib/supabase/server'
import { nearbyOrAll } from '@/lib/services/dining'
import type { Coords } from '@/lib/restaurantFilters'
import type { FeaturedRestaurant } from '@/lib/types/dining'

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/**
 * app parity: RestaurantDetails FigmaDiscoverSections — other restaurants for
 * the bottom of a restaurant page: "Explore more restaurants" (feed order) and,
 * when distances are known, "Nearest restaurants" (nearest first); 12 each.
 */
export async function getExploreMoreRestaurants(excludeId: string, coords?: Coords | null) {
  const supabase = await createClient()
  const { data } = await supabase.rpc('restaurant_feed', {
    in_lat: coords?.lat ?? null,
    in_lng: coords?.lng ?? null,
    in_limit: 60,
    in_offset: 0,
    in_sort: coords ? 'distance' : 'rating_desc',
  })
  const all = ((data ?? []) as FeaturedRestaurant[]).filter(r => r.id !== excludeId)
  // the shared 3–5 km rule, only once there's a location to measure from
  const rows = coords ? nearbyOrAll(all) : all
  const withDistance = rows.filter(r => num(r.distance_km) != null)
  return {
    explore: rows.slice(0, 12),
    nearest: withDistance.length ? [...rows].sort((a, b) => (num(a.distance_km) ?? Infinity) - (num(b.distance_km) ?? Infinity)).slice(0, 12) : [],
  }
}
