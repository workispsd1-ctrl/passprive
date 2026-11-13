import { NextResponse } from 'next/server'
import { getMoodCategories, getRestaurantFeed } from '@/lib/services/dining'
import { getUserCoords } from '@/lib/location'
import { FEED_PAGE_SIZE, distanceKm, parseFilters } from '@/lib/restaurantFilters'
import { MAX_NEARBY_KM } from '@/lib/nearby'

/** "Load more" for the filtered dining feed — same params as the /dining URL, plus `offset`. Nearby-only, like the page. */
export async function GET(req: Request) {
  const sp = Object.fromEntries(new URL(req.url).searchParams)
  const { moodSlug, ...filters } = parseFilters(sp)
  const offset = Math.max(0, Number(sp.offset) || 0)

  let moodTitle: string | undefined
  if (moodSlug) {
    const moods = await getMoodCategories()
    moodTitle = moods.find((m) => m.slug === moodSlug)?.title
  }

  // `radius` (results pages) = everything within that many km, capped at the shared maximum
  const radius = Number(sp.radius)
  // the filter dialog's Distance choice (`km`) is the visitor's explicit radius, so it isn't capped
  const radiusKm =
    distanceKm(filters.distance) ??
    (Number.isFinite(radius) && radius > 0 ? Math.min(radius, MAX_NEARBY_KM) : undefined)

  const rows = await getRestaurantFeed({ ...filters, moodTitle }, offset, FEED_PAGE_SIZE, await getUserCoords(), { nearbyOnly: true, radiusKm })
  return NextResponse.json({ rows, hasMore: rows.length >= FEED_PAGE_SIZE })
}
