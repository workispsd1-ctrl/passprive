import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NEARBY_RADIUS_KM } from '@/lib/restaurantFilters'
import type { FeaturedRestaurant } from '@/lib/types/dining'


/**
 * Location-scoped feed — app parity: fetchScopedFeed({ coords, sort: 'distance' })
 * trimmed to NEARBY_RADIUS_KM (PopularChains / InYourPassPrive). Without
 * coordinates the app skips the radius trim, so this returns the plain feed.
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const lat = Number(sp.get('lat'))
  const lng = Number(sp.get('lng'))
  const hasCoords = sp.has('lat') && sp.has('lng') && Number.isFinite(lat) && Number.isFinite(lng)
  const limit = Math.min(60, Math.max(1, Number(sp.get('limit')) || 15))

  const supabase = await createClient()
  const { data } = await supabase.rpc('restaurant_feed', {
    in_lat: hasCoords ? lat : null,
    in_lng: hasCoords ? lng : null,
    in_limit: limit,
    in_offset: 0,
    in_sort: 'distance',
  })
  let rows = (data ?? []) as (FeaturedRestaurant & { distance_km: number | null })[]
  if (hasCoords) {
    rows = rows.filter((r) => r.distance_km != null && r.distance_km <= NEARBY_RADIUS_KM)
  }
  return NextResponse.json({ rows })
}
