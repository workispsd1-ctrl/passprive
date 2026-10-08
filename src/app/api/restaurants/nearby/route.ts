import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scopeToRadius } from '@/lib/nearby'
import type { FeaturedRestaurant } from '@/lib/types/dining'


/**
 * Location-scoped feed (PopularChains / InYourPassPrive), nearest first and
 * trimmed to the shared 3–5 km radius (lib/nearby). Without coordinates there
 * is nothing to trim against, so this returns the plain feed.
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
    // over-fetch so the radius trim below still has enough to fill `limit`
    in_limit: hasCoords ? Math.max(limit, 60) : limit,
    in_offset: 0,
    in_sort: 'distance',
  })
  let rows = (data ?? []) as (FeaturedRestaurant & { distance_km: number | null })[]
  rows = scopeToRadius(rows, (r) => r.distance_km, hasCoords).slice(0, limit)
  return NextResponse.json({ rows })
}
