import { NextResponse } from 'next/server'
import { getMoodCategories, getRestaurantFeed } from '@/lib/services/dining'
import { getUserCoords } from '@/lib/location'
import { FEED_PAGE_SIZE, parseFilters } from '@/lib/restaurantFilters'

/** "Load more" for the filtered dining feed — same params as the /dining URL, plus `offset`. */
export async function GET(req: Request) {
  const sp = Object.fromEntries(new URL(req.url).searchParams)
  const { moodSlug, ...filters } = parseFilters(sp)
  const offset = Math.max(0, Number(sp.offset) || 0)

  let moodTitle: string | undefined
  if (moodSlug) {
    const moods = await getMoodCategories()
    moodTitle = moods.find((m) => m.slug === moodSlug)?.title
  }

  const rows = await getRestaurantFeed({ ...filters, moodTitle }, offset, FEED_PAGE_SIZE, await getUserCoords())
  return NextResponse.json({ rows, hasMore: rows.length >= FEED_PAGE_SIZE })
}
