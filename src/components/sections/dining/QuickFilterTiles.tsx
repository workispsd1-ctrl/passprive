'use client'

import { useState } from 'react'
import Image from 'next/image'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'

/**
 * "All restaurants" header — app parity: DineFilters.jsx (Filter / quick-filter
 * chip row) + AllRestaurantBadges.jsx (5 tap-to-select badge tiles: cashback,
 * booking, instant, stamps, exclusive). The app renders these as plain
 * pre-baked images (no icon/label overlay — the text is baked into the art)
 * that dim to a greyscale variant when a different badge is selected.
 * Same real assets and 106:120 aspect ratio as the app, scaled up to the
 * Figma web spec (280×316.98 at 2xl, 48px radius).
 *
 * TODO(design): the app's Filter/Sort/quick-filter chips open a filter sheet
 * and toggle server-side RPC params (cashbackOnly/bookingOnly/instantOnly/
 * repeatRewardsOnly/exclusiveOnly); selecting a badge here only tracks local
 * UI state — /dining doesn't read it yet, so nothing actually filters.
 */
const BADGES = [
  { key: 'cashback', source: '/dinein/cashback.webp', gray: '/dinein/cashback-gray.png' },
  { key: 'booking', source: '/dinein/booking.webp', gray: '/dinein/booking-gray.png' },
  { key: 'instant', source: '/dinein/instant.webp', gray: '/dinein/instant-gray.png' },
  { key: 'stamps', source: '/dinein/stamps.webp', gray: '/dinein/stamps-gray.png' },
  { key: 'exclusive', source: '/dinein/exclusive.webp', gray: '/dinein/exclusive-gray.png' },
] as const

const CHIPS = ['Available today', 'Serves alcohol'] as const

export function QuickFilterTiles() {
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null)

  return (
    <section className="py-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 md:px-8 2xl:max-w-394">
        <h2 className="font-(family-name:--font-dm-sans) text-[19px] font-bold leading-none tracking-normal text-[#0D141C] md:text-[20px]">
          All restaurants
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Sort By <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              className="hidden rounded-full border border-gray-200 px-3 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50 md:block"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-5 flex max-w-7xl gap-6.75 overflow-x-auto px-4 pb-2 md:px-8 [&::-webkit-scrollbar]:hidden scrollbar-none 2xl:max-w-394">
        {BADGES.map((badge) => {
          const dim = !!selectedBadge && selectedBadge !== badge.key
          return (
            <button
              key={badge.key}
              type="button"
              onClick={() =>
                setSelectedBadge((prev) => (prev === badge.key ? null : badge.key))
              }
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
    </section>
  )
}
