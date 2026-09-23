'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SORT_OPTIONS, parseFilters, countActive } from '@/lib/restaurantFilters'
import { FilterDialog } from './FilterDialog'

/**
 * "All restaurants" header — app parity: DineFilters.jsx (Filter / Sort /
 * quick-filter chips) + AllRestaurantBadges.jsx (5 tap-to-select badge tiles:
 * cashback, booking, instant, stamps, exclusive). The app renders the badges
 * as plain pre-baked images that dim to a greyscale variant when a different
 * badge is selected. Every control writes to the URL query string, which the
 * /dining page reads to render the filtered feed (see restaurantFilters.ts).
 */
const BADGES = [
  { key: 'cashback', source: '/dinein/cashback.webp', gray: '/dinein/cashback-gray.png' },
  { key: 'booking', source: '/dinein/booking.webp', gray: '/dinein/booking-gray.png' },
  { key: 'instant', source: '/dinein/instant.webp', gray: '/dinein/instant-gray.png' },
  { key: 'stamps', source: '/dinein/stamps.webp', gray: '/dinein/stamps-gray.png' },
  { key: 'exclusive', source: '/dinein/exclusive.webp', gray: '/dinein/exclusive-gray.png' },
] as const

/** quick-filter chips — app parity: QUICK_FILTER_OPTIONS (subset the RPC supports) */
const CHIPS = [
  { label: 'Open now', param: 'open', value: '1' },
  { label: 'Top rated', param: 'sort', value: 'rating' },
  { label: 'Veg', param: 'veg', value: '1' },
  { label: 'Has offers', param: 'offer', value: '1' },
] as const

const chipBase =
  'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors'
const chipOn = 'border-[#FF6A19] bg-[#FFF1EA] text-[#FF6A19]'
const chipOff = 'border-gray-200 text-gray-700 hover:bg-gray-50'

export function QuickFilterTiles({ cuisineOptions }: { cuisineOptions: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filters = parseFilters(Object.fromEntries(searchParams))
  // badge / sort / mood have their own controls, so they don't count toward "Filter (n)"
  const activeCount = countActive({
    ...filters,
    badge: undefined,
    moodSlug: undefined,
    sort: undefined,
  })

  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(changes)) {
      if (v == null || v === '') next.delete(k)
      else next.set(k, v)
    }
    const qs = next.toString()
    router.push(qs ? `/dining?${qs}` : '/dining', { scroll: false })
  }

  const currentSort = SORT_OPTIONS.find((s) => s.key === filters.sort)

  return (
    <section className="py-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 md:px-8 2xl:max-w-394">
        <h2 className="font-(family-name:--font-dm-sans) text-[19px] font-bold leading-none tracking-normal text-[#0D141C] md:text-[20px]">
          All restaurants
        </h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className={cn(chipBase, activeCount ? chipOn : chipOff)}
          >
            <SlidersHorizontal className="h-3 w-3" /> Filter{activeCount ? ` (${activeCount})` : ''}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((o) => !o)}
              aria-expanded={sortOpen}
              className={cn(chipBase, currentSort ? chipOn : chipOff)}
            >
              {currentSort ? currentSort.label : 'Sort By'} <ChevronDown className="h-3 w-3" />
            </button>
            {sortOpen && (
              <ul className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 text-xs shadow-lg">
                {SORT_OPTIONS.map((s) => (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setSortOpen(false)
                        update({ sort: filters.sort === s.key ? null : s.key })
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-left hover:bg-gray-50',
                        filters.sort === s.key && 'font-bold text-[#FF6A19]',
                      )}
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {CHIPS.map((c) => {
            const active = searchParams.get(c.param) === c.value
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => update({ [c.param]: active ? null : c.value })}
                aria-pressed={active}
                className={cn(chipBase, 'hidden md:flex', active ? chipOn : chipOff)}
              >
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mx-auto mt-5 flex max-w-7xl gap-6.75 overflow-x-auto px-4 pb-2 md:px-8 [&::-webkit-scrollbar]:hidden scrollbar-none 2xl:max-w-394">
        {BADGES.map((badge) => {
          const dim = !!filters.badge && filters.badge !== badge.key
          return (
            <button
              key={badge.key}
              type="button"
              aria-pressed={filters.badge === badge.key}
              onClick={() => update({ badge: filters.badge === badge.key ? null : badge.key })}
              className="relative aspect-106/120 w-38 shrink-0 overflow-hidden rounded-[24px] 2xl:w-52.5 2xl:rounded-[32px]"
            >
              <Image
                src={dim ? badge.gray : badge.source}
                alt={badge.key}
                fill
                className="object-cover"
                sizes="210px"
              />
            </button>
          )
        })}
      </div>

      {/* keyed on the URL so the draft re-seeds from the applied filters each time it opens */}
      {filterOpen && (
        <FilterDialog
          key={searchParams.toString()}
          open
          onClose={() => setFilterOpen(false)}
          cuisineOptions={cuisineOptions}
          initial={{
            cuisines: filters.cuisines,
            minRating: filters.minRating,
            cost: filters.cost,
            veg: filters.veg,
            openNow: filters.openNow,
            openLate: filters.openLate,
            hasOffer: filters.hasOffer,
            vibes: filters.vibes,
          }}
          onApply={(d) => {
            setFilterOpen(false)
            update({
              cuisines: d.cuisines?.length ? d.cuisines.join(',') : null,
              rating: d.minRating ? String(d.minRating) : null,
              cost: d.cost ?? null,
              veg: d.veg ? '1' : null,
              open: d.openNow ? '1' : null,
              late: d.openLate ? '1' : null,
              offer: d.hasOffer ? '1' : null,
              vibe: d.vibes?.length ? d.vibes.join(',') : null,
            })
          }}
        />
      )}
    </section>
  )
}
