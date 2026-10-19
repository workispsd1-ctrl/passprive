import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { RestaurantResults } from '@/components/sections/dining/RestaurantResults'
import { PageBackTitle } from '@/components/shared/PolicyPage'
import { getHeaderLocation, getUserCoords } from '@/lib/location'
import { getMoodCategories, getRestaurantFeed } from '@/lib/services/dining'
import { FEED_PAGE_SIZE } from '@/lib/restaurantFilters'
import { MAX_NEARBY_KM } from '@/lib/nearby'
import { cn } from '@/lib/utils'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const mood = (await getMoodCategories()).find((m) => m.slug === slug)
  if (!mood) return {}
  const title = mood.title.replace(/\s+/g, ' ')
  return {
    title: `${title} restaurants`,
    description: `Restaurants for ${title.toLowerCase()} near you on PassPrivé.`,
  }
}

/**
 * Mood results — app parity: DineinHome's `handleSelectMood` opens
 * OfferRestaurantsScreen with `filterType: 'mood_tag'`: a list titled with
 * the mood, scoped to restaurants near the user (within MAX_NEARBY_KM here).
 */
export default async function MoodPage({ params }: Props) {
  const { slug } = await params
  const [moods, coords, headerLocation] = await Promise.all([getMoodCategories(), getUserCoords(), getHeaderLocation()])
  // the place named in the header — every distance here is measured from it
  const place = headerLocation?.city || 'you'
  const mood = moods.find((m) => m.slug === slug)
  if (!mood) notFound()

  const rows = await getRestaurantFeed({ moodTitle: mood.title }, 0, FEED_PAGE_SIZE, coords, { radiusKm: MAX_NEARBY_KM })
  const title = mood.title.replace(/\s+/g, ' ')

  return (
    <main className="pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-6 md:px-8 2xl:max-w-394">
        <PageBackTitle title={title} />
        <p className="mt-2 text-[13px] text-[#605D64] md:text-[14px]">
          {coords
            ? `Restaurants within ${MAX_NEARBY_KM} km of ${place} for ${title.toLowerCase()}`
            : `Restaurants for ${title.toLowerCase()} — set your location to see the ones within ${MAX_NEARBY_KM} km`}
        </p>

        {/* switch mood without going back — web addition */}
        <nav aria-label="Moods" className="scrollbar-hide -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {moods.map((m) => {
            const active = m.slug === slug
            return (
              <Link
                key={m.key}
                href={`/dining/mood/${encodeURIComponent(m.slug)}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-full border py-1 pr-4 pl-1 text-[13px] font-semibold transition-colors',
                  active
                    ? 'border-brand bg-brand-tint text-brand'
                    : 'border-gray-200 bg-white text-[#2C2D32] hover:border-brand/40',
                )}
              >
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100">
                  {m.image_url && <Image src={m.image_url} alt="" fill className="object-cover" sizes="32px" />}
                </span>
                {m.title.replace(/\s+/g, ' ')}
              </Link>
            )
          })}
        </nav>
      </div>

      <RestaurantResults
        // remount when the header location changes — the grid holds its own rows
        key={`${slug}:${coords?.lat ?? ''},${coords?.lng ?? ''}`}
        initialRows={rows}
        initialHasMore={rows.length >= FEED_PAGE_SIZE}
        queryString={`mood=${encodeURIComponent(slug)}&radius=${MAX_NEARBY_KM}`}
        emptyTitle={`No ${title.toLowerCase()} restaurants within ${MAX_NEARBY_KM} km of ${place} yet`}
        emptyAction={{ label: 'Explore all restaurants', href: '/dining' }}
      />
    </main>
  )
}
