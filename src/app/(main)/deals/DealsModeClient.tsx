'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BadgeCheck,
  CalendarDays,
  Coins,
  MapPin,
  Navigation,
  Receipt,
  ShoppingBag,
  Sparkles,
  Tag,
  Ticket,
  Unlock,
  Utensils,
  X,
} from 'lucide-react'
import { useLocation } from '@/lib/context/LocationContext'
import { cn, formatDistanceKm } from '@/lib/utils'
import type { DealsCategory, DealsMode, DealsModeItem } from '@/lib/services/dealsMode'

const CATEGORIES: { key: DealsCategory; label: string; Icon: typeof Utensils }[] = [
  { key: 'dining', label: 'Dining', Icon: Utensils },
  { key: 'shopping', label: 'Shopping', Icon: ShoppingBag },
  { key: 'wellness', label: 'Wellness', Icon: Sparkles },
]

type FilterKey = 'near' | 'booking' | 'deals' | 'cashback'

// app parity: locationScope.js NEARBY_RADIUS_KM
const NEARBY_RADIUS_KM = 15
const PAGE_SIZE = 12

/** What each mode is, in the member's words — app parity: DealsCashbackScreen's two modes. */
const MODES = {
  deals: {
    eyebrow: 'Deals Mode',
    title: 'Member-only deals near you',
    body: 'Unlock a deal on the merchant’s page, then redeem it at the counter — the saving comes straight off your bill.',
    steps: [
      { Icon: Unlock, text: 'Reveal a deal on the place’s page' },
      { Icon: Ticket, text: 'Redeem at the counter with the staff PIN' },
      { Icon: Receipt, text: 'The discount comes off your bill' },
    ],
    hero: 'bg-[linear-gradient(115deg,#FF4800_0%,#FF6A30_45%,#FF9A5C_100%)]',
    accent: 'text-[#FFEC8B]',
  },
  cashback: {
    eyebrow: 'Use Cashback',
    title: 'Pay with your Privé Credits',
    body: 'These places take Privé Credits on the bill. 1 Privé Credit = MUR 1, and you keep earning cashback as you pay.',
    steps: [
      { Icon: MapPin, text: 'Pick a place that accepts credits' },
      { Icon: Coins, text: 'Pay the bill with Privé Credits' },
      { Icon: BadgeCheck, text: 'Earn cashback on the rest' },
    ],
    hero: 'bg-[linear-gradient(115deg,#2A0C63_0%,#4B1A9E_55%,#6D3BD1_100%)]',
    accent: 'text-[#DFBEFF]',
  },
} as const

function ModeSwitch({ mode, category }: { mode: DealsMode; category: DealsCategory }) {
  return (
    <div role='tablist' aria-label='Mode' className='inline-flex rounded-full bg-white/15 p-1 backdrop-blur'>
      {(['deals', 'cashback'] as const).map(m => (
        <Link
          key={m}
          role='tab'
          aria-selected={m === mode}
          href={`/deals?mode=${m}&category=${category}`}
          className={cn(
            'rounded-full px-4 py-2 text-[13px] font-bold transition-colors',
            m === mode ? 'bg-white text-[#141414] shadow-sm' : 'text-white/85 hover:text-white',
          )}
        >
          {m === 'deals' ? 'Deals Mode' : 'Use Cashback'}
        </Link>
      ))}
    </div>
  )
}

function Hero({ mode, category, total }: { mode: DealsMode; category: DealsCategory; total: number }) {
  const m = MODES[mode]
  return (
    <section className={cn('relative overflow-hidden rounded-3xl px-5 py-5 text-white md:px-10 md:py-9', m.hero)}>
      <span className='pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/10 blur-2xl' />
      <span className='pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-black/10 blur-2xl' />
      {mode === 'deals' ? (
        <Image
          src='/deals/deal-ticket.png'
          alt=''
          width={420}
          height={168}
          className='pointer-events-none absolute top-1/2 right-10 hidden w-80 -translate-y-1/2 rotate-[-8deg] drop-shadow-xl lg:block'
        />
      ) : (
        <Image
          src='/membership/Wallet.webp'
          alt=''
          width={220}
          height={220}
          className='pointer-events-none absolute top-6 right-10 hidden w-48 drop-shadow-xl lg:block'
        />
      )}

      <div className='relative max-w-2xl'>
        <ModeSwitch mode={mode} category={category} />
        <p className={cn('mt-5 text-[12px] font-bold tracking-[0.14em] uppercase', m.accent)}>{m.eyebrow}</p>
        <h1 className='mt-1 text-[26px] leading-tight font-bold tracking-[-0.6px] md:text-[36px]'>{m.title}</h1>
        <p className='mt-2 max-w-xl text-[13.5px] leading-6 text-white/85 md:text-[15px]'>{m.body}</p>

        <ol className='mt-5 hidden gap-3 sm:grid sm:grid-cols-3'>
          {m.steps.map((s, i) => (
            <li key={s.text} className='flex items-center gap-2.5 rounded-2xl bg-white/12 px-3 py-2.5 text-[12.5px] leading-snug font-medium backdrop-blur-sm'>
              <span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-bold text-[#141414]'>
                {i + 1}
              </span>
              {s.text}
            </li>
          ))}
        </ol>
        <p className='mt-4 text-[12.5px] text-white/75'>
          {total} {total === 1 ? 'place' : 'places'} across dining, shopping and wellness
        </p>
      </div>
    </section>
  )
}

function Chip({
  label,
  Icon,
  active,
  onClick,
  count,
  disabled,
}: {
  label: string
  Icon: typeof Utensils
  active: boolean
  onClick: () => void
  count?: number
  disabled?: boolean
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      className={cn(
        'flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[13.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        active ? 'border-[#141414] bg-[#141414] text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400',
      )}
    >
      <Icon className='size-4' />
      {label}
      {count != null && (
        <span className={cn('rounded-full px-1.5 text-[11.5px] tabular-nums', active ? 'bg-white/20' : 'bg-gray-100 text-gray-500')}>
          {count}
        </span>
      )}
    </button>
  )
}

function FilterChip({ label, Icon, active, onClick }: { label: string; Icon: typeof Utensils; active: boolean; onClick: () => void }) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors',
        active ? 'border-brand bg-brand-tint text-brand-dark' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400',
      )}
    >
      <Icon className='size-3.5' /> {label}
      {active && <X className='size-3.5' />}
    </button>
  )
}

/** One place — photo first, then the deal or how to pay. */
function PlaceCard({ item, mode }: { item: DealsModeItem; mode: DealsMode }) {
  const distance = formatDistanceKm(item.distanceKm)
  const cost = Number(item.costForTwo)
  const [first, ...rest] = item.offers

  return (
    // a compact row on phones (scannable like the app's list), photo-on-top cards from tablet up
    <article className='group relative flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_14px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] sm:flex-col sm:rounded-3xl'>
      <Link href={item.href} aria-label={item.title} className='absolute inset-0 z-10' />
      <div className='relative w-30 shrink-0 overflow-hidden bg-gray-100 sm:aspect-16/10 sm:w-auto'>
        {item.media ? (
          <Image
            src={item.media}
            alt=''
            fill
            sizes='(min-width: 1024px) 400px, (min-width: 640px) 50vw, 120px'
            className='object-cover transition-transform duration-500 group-hover:scale-[1.04]'
          />
        ) : (
          <div className='flex h-full items-center justify-center bg-linear-to-br from-[#FFE3D6] via-[#FFF1EB] to-[#F3E8FF]'>
            <span className='text-[44px] font-bold text-[#141414]/25'>{item.title.charAt(0)}</span>
          </div>
        )}
        {item.rating > 0 && (
          <span className='absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg bg-[#1F8A3B] px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm sm:top-3 sm:right-3 sm:px-2 sm:text-[12px]'>
            {item.rating.toFixed(1)} ★
          </span>
        )}
        {distance && (
          <span className='absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10.5px] font-semibold text-gray-800 shadow-sm sm:bottom-3 sm:left-3 sm:px-2.5 sm:py-1 sm:text-[11.5px]'>
            <Navigation className='size-3' /> {distance}
          </span>
        )}
      </div>

      <div className='flex min-w-0 flex-1 flex-col p-3.5 sm:p-4'>
        <p className='truncate text-[15px] font-bold text-[#141414] sm:text-[16px]'>{item.title}</p>
        <p className='mt-0.5 truncate text-[13px] text-gray-500'>
          {[item.subtitle, Number.isFinite(cost) && cost > 0 ? `MUR ${cost.toLocaleString('en-US')} for two` : null]
            .filter(Boolean)
            .join(' · ')}
        </p>

        <div className='mt-auto pt-3'>
          {mode === 'deals' && first && (
            <p className='flex items-center gap-2 rounded-xl border border-dashed border-[#FFB899] bg-[#FFF6F1] px-3 py-2 text-[13px]'>
              <Tag className='size-4 shrink-0 text-brand' />
              <span className='min-w-0 flex-1 truncate font-semibold text-[#B33A00]'>{first}</span>
              {rest.length > 0 && <span className='shrink-0 text-[12px] font-bold text-brand'>+{rest.length}</span>}
            </p>
          )}
          {mode === 'cashback' && (
            <div className='flex items-center justify-between gap-3'>
              <p className='flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-[#167C3B]'>
                <BadgeCheck className='size-4 shrink-0' />
                <span className='truncate'>Pay with Privé Credits</span>
              </p>
              {item.bookHref && item.bookLabel && (
                <Link
                  href={item.bookHref}
                  className='relative z-20 shrink-0 rounded-full border border-[#FFCA6D] bg-[#FFEEC4] px-3 py-1.5 text-[12px] font-bold text-[#762900] transition-colors hover:bg-[#FFE4A3]'
                >
                  {item.bookLabel}
                </Link>
              )}
            </div>
          )}
          {mode === 'cashback' && first && (
            <p className='mt-2 flex items-center gap-1.5 truncate text-[12px] text-gray-500'>
              <Tag className='size-3.5 shrink-0 text-brand' /> Also: {first}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className='flex flex-col items-center rounded-3xl border border-dashed border-gray-200 bg-[#FCFCFD] px-6 py-14 text-center'>
      <span className='flex size-14 items-center justify-center rounded-full bg-brand-tint'>
        <Tag className='size-6 text-brand' />
      </span>
      <p className='mt-4 text-[17px] font-bold text-gray-900'>{title}</p>
      <p className='mt-1 max-w-sm text-[13.5px] leading-5 text-gray-500'>{body}</p>
      {action && <div className='mt-5 flex flex-wrap justify-center gap-2'>{action}</div>}
    </div>
  )
}

const BUTTON = 'rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition-colors'

/**
 * Deals Mode / Use Cashback — app parity: screens/DealsCashbackScreen.jsx.
 * The hero says what the mode is and switches it; categories carry their
 * counts so an empty one never surprises; filters narrow the grid.
 */
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
  const { location } = useLocation()
  const hasLocation = location.lat != null && location.lng != null

  const counts = useMemo(() => {
    const c: Record<DealsCategory, number> = { dining: 0, shopping: 0, wellness: 0 }
    items.forEach(i => { c[i.group] += 1 })
    return c
  }, [items])

  const [category, setCategory] = useState<DealsCategory>(() =>
    counts[initialCategory] > 0
      ? initialCategory
      : (CATEGORIES.find(c => counts[c.key] > 0)?.key ?? initialCategory),
  )
  const [filters, setFilters] = useState<Set<FilterKey>>(() => new Set())
  const [pages, setPages] = useState(1)

  // filters that make sense here: the other mode's perk, plus booking where it exists
  const filterDefs = [
    { key: 'near' as const, label: `Within ${NEARBY_RADIUS_KM} km`, Icon: MapPin },
    ...(category !== 'shopping' ? [{ key: 'booking' as const, label: 'Booking available', Icon: CalendarDays }] : []),
    mode === 'deals'
      ? { key: 'cashback' as const, label: 'Takes Privé Credits', Icon: BadgeCheck }
      : { key: 'deals' as const, label: 'Has a deal', Icon: Tag },
  ]

  function pickCategory(next: DealsCategory) {
    setCategory(next)
    setPages(1)
    // shopping has no booking — don't leave a hidden filter emptying the grid
    if (next === 'shopping') setFilters(prev => { const f = new Set(prev); f.delete('booking'); return f })
    window.history.replaceState(null, '', `/deals?mode=${mode}&category=${next}`)
  }

  function toggle(key: FilterKey) {
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
        if (filters.has('booking') && !m.bookHref) return false
        if (filters.has('deals') && m.offers.length === 0) return false
        if (filters.has('cashback') && !m.acceptsCashback) return false
        if (filters.has('near') && !(m.distanceKm != null && m.distanceKm <= NEARBY_RADIUS_KM)) return false
        return true
      }),
    [items, category, filters],
  )
  const shown = list.slice(0, pages * PAGE_SIZE)
  const active = CATEGORIES.find(c => c.key === category)!
  const otherWithItems = CATEGORIES.find(c => c.key !== category && counts[c.key] > 0)
  const otherMode = mode === 'deals' ? 'cashback' : 'deals'

  return (
    <div className='mx-auto max-w-7xl px-4 pt-4 pb-28 font-(family-name:--font-dm-sans) md:px-6 md:pt-6'>
      <Hero mode={mode} category={category} total={items.length} />

      {/* sticky so the filters stay at hand while scrolling the grid */}
      <div className='sticky top-0 z-30 -mx-4 mt-6 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6'>
        <div className='scrollbar-hide flex gap-2 overflow-x-auto'>
          {CATEGORIES.map(c => (
            <Chip
              key={c.key}
              label={c.label}
              Icon={c.Icon}
              count={counts[c.key]}
              active={c.key === category}
              onClick={() => pickCategory(c.key)}
            />
          ))}
          <span className='mx-1 my-1.5 w-px shrink-0 bg-gray-200' aria-hidden='true' />
          {filterDefs.map(f => (
            <FilterChip key={f.key} label={f.label} Icon={f.Icon} active={filters.has(f.key)} onClick={() => toggle(f.key)} />
          ))}
        </div>
      </div>

      <div className='mt-5 flex flex-wrap items-baseline justify-between gap-2'>
        <h2 className='text-[18px] font-bold text-[#141414]'>
          {list.length} {list.length === 1 ? 'place' : 'places'} <span className='font-medium text-gray-500'>in {active.label}</span>
        </h2>
        <p className='text-[12.5px] text-gray-500'>
          {hasLocation ? 'Nearest first' : 'Set your location in the header to sort by distance'}
        </p>
      </div>
      {filters.has('near') && !hasLocation && (
        <p className='mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800'>
          Distance filters need your location — set it from the header to see what’s nearby.
        </p>
      )}

      <div className='mt-4'>
        {shown.length > 0 ? (
          <div className='grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3'>
            {shown.map(item => <PlaceCard key={item.key} item={item} mode={mode} />)}
          </div>
        ) : filters.size > 0 ? (
          <EmptyState
            title='No places match these filters'
            body={`Try removing a filter to see more ${active.label.toLowerCase()} ${mode === 'deals' ? 'deals' : 'places'}.`}
            action={
              <button type='button' onClick={() => { setFilters(new Set()); setPages(1) }} className={cn(BUTTON, 'bg-[#141414] text-white hover:bg-black')}>
                Clear filters
              </button>
            }
          />
        ) : (
          <EmptyState
            title={mode === 'deals' ? `No ${active.label.toLowerCase()} deals right now` : `No ${active.label.toLowerCase()} places take Privé Credits yet`}
            body={mode === 'deals' ? 'New deals go live every week — check back soon, or look at another category.' : 'More merchants are joining — meanwhile, see where you can use them elsewhere.'}
            action={
              <>
                {otherWithItems && (
                  <button type='button' onClick={() => pickCategory(otherWithItems.key)} className={cn(BUTTON, 'bg-[#141414] text-white hover:bg-black')}>
                    See {otherWithItems.label.toLowerCase()} ({counts[otherWithItems.key]})
                  </button>
                )}
                <Link href={`/deals?mode=${otherMode}&category=${category}`} className={cn(BUTTON, 'border border-gray-200 text-gray-800 hover:border-gray-400')}>
                  {otherMode === 'deals' ? 'Browse deals instead' : 'Where to use cashback'}
                </Link>
              </>
            }
          />
        )}
      </div>

      {shown.length < list.length && (
        <div className='mt-8 flex flex-col items-center gap-2'>
          <button
            type='button'
            onClick={() => setPages(p => p + 1)}
            className={cn(BUTTON, 'border border-gray-200 px-7 text-gray-900 hover:border-gray-400 hover:bg-gray-50')}
          >
            Show more places
          </button>
          <p className='text-[12px] text-gray-400'>
            Showing {shown.length} of {list.length}
          </p>
        </div>
      )}
    </div>
  )
}
