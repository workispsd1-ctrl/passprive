'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { BadgeCheck, CalendarDays, MapPin, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DealsCategory, DealsMode, DealsModeItem } from '@/lib/services/dealsMode'
import { HuntSpot } from '@/components/hunt/HuntSpot'
import { CHIP, GROUP_ICON, OfferCard, TITLE, chipState } from '@/components/greatDeals/GreatDeals'
import { GD_PAGE } from '@/components/greatDeals/unit'

/*
 * Deals Mode / Use Cashback — app parity: screens/DealsCashbackScreen.jsx
 * (title, category chips, filter chips, "<Category> / Your … discovery",
 * merchant cards, paged list). Laid out in the Great Deals website language:
 * the same design unit, banner, icon tabs, chips and offer cards.
 */

const CATEGORIES: { key: DealsCategory; label: string; noun: string; w: number; h: number }[] = [
  { key: 'dining', label: 'Dining', noun: 'dining', w: 44.5, h: 49.6 },
  { key: 'shopping', label: 'Shopping', noun: 'shopping', w: 37.3, h: 49.2 },
  { key: 'wellness', label: 'Wellness', noun: 'wellness', w: 38, h: 50.4 },
]

type FilterKey = 'near' | 'booking' | 'deals' | 'cashback'

/** app parity: FILTERS — the current mode's chip stays on. */
const FILTERS: { key: FilterKey; label: string; Icon: typeof MapPin }[] = [
  { key: 'near', label: 'Near me', Icon: MapPin },
  { key: 'booking', label: 'Booking available', Icon: CalendarDays },
  { key: 'deals', label: 'Deals', Icon: Tag },
  { key: 'cashback', label: 'Cashback', Icon: BadgeCheck },
]

// app parity: locationScope.js NEARBY_RADIUS_KM, PAGE_SIZE, BOOKING_CATEGORIES
const NEARBY_RADIUS_KM = 15
const PAGE_SIZE = 12
const BOOKING_CATEGORIES = new Set<DealsCategory>(['dining', 'wellness'])

/** Banner text, set like the Great Deals lettering: a plain first line over a serif italic word. */
const BANNER = {
  cashback: { top: 'Use', word: 'Cashback' },
  deals: { top: 'Deals', word: 'Mode' },
} as const

/** The Great Deals hero (same artwork, minus its baked-in lettering) with this page's title on top. */
function Banner({ mode }: { mode: DealsMode }) {
  const b = BANNER[mode]
  return (
    <section className='relative flex h-420 flex-col items-center justify-center overflow-hidden rounded-b-[calc(24*var(--u))] bg-[#FF4800] text-white max-lg:h-[200px] max-lg:rounded-b-[20px]'>
      <Image src='/assets/deals/deals-hero-blank.webp' alt='' fill priority sizes='100vw' className='object-cover' />
      <h1 className='relative flex flex-col items-center'>
        <span className='text-[calc(80*var(--u))] leading-[calc(84*var(--u))] font-medium tracking-[-0.02em] max-lg:text-[38px] max-lg:leading-[40px]'>{b.top}</span>
        <span className='-mt-4 font-(family-name:--font-libre-baskerville) text-[calc(112*var(--u))] leading-[calc(120*var(--u))] font-bold italic [text-shadow:0_calc(6*var(--u))_calc(14*var(--u))_rgba(0,0,0,0.18)] max-lg:mt-[-2px] max-lg:text-[52px] max-lg:leading-[58px]'>
          {b.word}
        </span>
      </h1>
    </section>
  )
}

/** Category tabs — the Great Deals "All offers" tab bar. */
function CategoryTabs({ category, onPick }: { category: DealsCategory; onPick: (c: DealsCategory) => void }) {
  return (
    <div role='tablist' aria-label='Categories' className='relative flex gap-[calc(55*var(--u))] border-b border-[#FF4901] max-lg:justify-around max-lg:gap-0'>
      {CATEGORIES.map(c => {
        const active = c.key === category
        return (
          <button
            key={c.key}
            type='button'
            role='tab'
            aria-selected={active}
            onClick={() => onPick(c.key)}
            className='relative flex w-78 flex-col items-center pb-6 max-lg:w-auto max-lg:min-w-[72px]'
          >
            <span className='flex h-58 items-end max-lg:h-[44px]'>
              <Image
                src={GROUP_ICON[c.key]}
                alt=''
                width={58}
                height={58}
                className='object-contain'
                style={{ width: `calc(${c.w} * var(--u))`, height: `calc(${c.h} * var(--u))` }}
              />
            </span>
            <span className={cn('mt-3 text-[calc(14.4*var(--u))] leading-[calc(19*var(--u))] text-[#454040] max-lg:text-[12px] max-lg:leading-[16px]', active ? 'font-bold' : 'font-medium')}>
              {c.label}
            </span>
            {active && <span aria-hidden className='absolute -bottom-[calc(1.5*var(--u))] left-1/2 h-3 w-78 -translate-x-1/2 rounded-full bg-[#FF4901] max-lg:h-[3px] max-lg:w-[56px]' />}
          </button>
        )
      })}
    </div>
  )
}

export function DealsModeClient({
  mode,
  initialCategory,
  items,
}: {
  mode: DealsMode
  /** preferred category; an empty one falls through to the first with places */
  initialCategory: DealsCategory
  items: DealsModeItem[]
}) {
  const [category, setCategory] = useState<DealsCategory>(() =>
    items.some(i => i.group === initialCategory)
      ? initialCategory
      : (CATEGORIES.find(c => items.some(i => i.group === c.key))?.key ?? initialCategory),
  )
  const [filters, setFilters] = useState<Set<FilterKey>>(() => new Set())
  const [pages, setPages] = useState(1)

  function pickCategory(next: DealsCategory) {
    setCategory(next)
    setPages(1)
    window.history.replaceState(null, '', `/deals?mode=${mode}&category=${next}`)
  }

  // app parity: toggleFilter — the mode's own chip can't be switched off
  function toggle(key: FilterKey) {
    if (key === mode) return
    setFilters(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setPages(1)
  }

  const list = useMemo(
    () =>
      items.filter(m => {
        if (m.group !== category) return false
        if (BOOKING_CATEGORIES.has(category) && filters.has('booking') && !m.bookable) return false
        if (filters.has('deals') && m.offers.length === 0) return false
        if (filters.has('cashback') && !m.acceptsCashback) return false
        if (filters.has('near') && !(m.distanceKm != null && m.distanceKm <= NEARBY_RADIUS_KM)) return false
        return true
      }),
    [items, category, filters],
  )
  const shown = list.slice(0, pages * PAGE_SIZE)
  const hasMore = shown.length < list.length
  const active = CATEGORIES.find(c => c.key === category)!

  // app parity: FlatList onEndReached — the next page loads as the end comes into view
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el || !hasMore) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setPages(p => p + 1), { rootMargin: '600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, shown.length])

  return (
    <div className={GD_PAGE}>
      <Banner mode={mode} />

      <div className='relative flex flex-col px-172 pt-48 max-lg:px-16 max-lg:pt-24'>
        {/* web hunt spot for this page */}
        <HuntSpot slot='deals' />

        {/* stays at hand while scrolling the grid */}
        <div className='sticky top-0 z-30 -mx-172 bg-white/95 px-172 pt-8 pb-16 backdrop-blur max-lg:-mx-16 max-lg:px-16 max-lg:pb-[12px]'>
          <CategoryTabs category={category} onPick={pickCategory} />
          <div className='scrollbar-hide mt-20 flex gap-12 overflow-x-auto pb-4 [scrollbar-width:none] max-lg:mt-[14px] max-lg:gap-[8px] [&::-webkit-scrollbar]:hidden'>
            {FILTERS.filter(f => f.key !== 'booking' || BOOKING_CATEGORIES.has(category)).map(f => {
              const on = f.key === mode || filters.has(f.key)
              return (
                <button
                  key={f.key}
                  type='button'
                  aria-pressed={on}
                  aria-disabled={f.key === mode || undefined}
                  onClick={() => toggle(f.key)}
                  className={cn(CHIP, chipState(on), f.key === mode && 'cursor-default')}
                >
                  <f.Icon className='size-[calc(18*var(--u))] max-lg:size-[14px]' strokeWidth={2} />
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className='mt-16 flex flex-col gap-4 max-lg:mt-[8px] max-lg:gap-[2px]'>
          <h2 className={TITLE}>{active.label}</h2>
          <p className='text-[calc(16*var(--u))] leading-[calc(22*var(--u))] text-[#717171] max-lg:text-[13px] max-lg:leading-[18px]'>
            Your {active.noun} discovery
          </p>
        </div>

        {shown.length > 0 ? (
          <div className='mt-24 grid grid-cols-3 gap-24 max-lg:mt-[14px] max-lg:grid-cols-1 max-lg:gap-[16px] max-lg:sm:grid-cols-2'>
            {shown.map(item => (
              <OfferCard key={item.key} card={item} variant='grid' />
            ))}
          </div>
        ) : (
          <p className='mt-40 py-40 text-center text-[calc(16*var(--u))] text-[#717171] max-lg:mt-[24px] max-lg:py-[24px] max-lg:text-[14px]'>
            {mode === 'cashback' ? `No ${active.noun} places accept Privé Credits yet` : `No ${active.noun} deals right now`}
          </p>
        )}

        {hasMore && <div ref={sentinel} aria-hidden className='h-1' />}
      </div>
    </div>
  )
}
