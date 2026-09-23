import type { Metadata } from 'next'
import { RestaurantResults } from '@/components/sections/dining/RestaurantResults'
import { getUserCoords } from '@/lib/location'
import { getRestaurantFeed } from '@/lib/services/dining'
import { FEED_PAGE_SIZE } from '@/lib/restaurantFilters'

export const metadata: Metadata = {
  title: 'Instant Book',
  description: 'Restaurants you can book instantly on PassPrivé.',
}

/** Instant Book — app parity: InstantBookScreen (bookable restaurants trimmed to instant booking). */
export default async function InstantBookPage() {
  const rows = await getRestaurantFeed({ badge: 'instant' }, 0, FEED_PAGE_SIZE, await getUserCoords())
  return (
    <main className="pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-6 md:px-8 2xl:max-w-394">
        <h1 className="font-(family-name:--font-dm-sans) text-2xl font-bold text-[#0D141C]">
          Instant Book
        </h1>
      </div>
      <RestaurantResults
        initialRows={rows}
        initialHasMore={rows.length >= FEED_PAGE_SIZE}
        queryString="badge=instant"
      />
    </main>
  )
}
