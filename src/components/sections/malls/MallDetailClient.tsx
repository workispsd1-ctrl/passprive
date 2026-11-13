'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, ChevronLeft, Navigation, Phone, Share2 } from 'lucide-react'
import { Rail } from '@/components/greatDeals/GreatDeals'
import { useLocation } from '@/lib/context/LocationContext'
import { getCardChips } from '@/lib/cardChips'
import { cardOfferText } from '@/lib/deals'
import { MALL_AMENITY_LABELS, mallAmenityKeys, mallOpenStatus, weeklyHours, type Mall } from '@/lib/malls'
import type { MallPlaces, MallStore } from '@/lib/services/malls'
import type { FeaturedRestaurant } from '@/lib/types/dining'
import { cn, formatDistanceKm, haversineKm } from '@/lib/utils'
import { AMENITY_ICONS } from './amenityIcons'
import { BestOfferCard, BrandTile, PlaceCard, ShopPanel, type MallPlace } from './MallCards'
import { MALL_PAGE } from './unit'

/*
 * Figma "Mall Flow" (Mall — Desktop / Dining, all floors / Dining, ground
 * floor) on top of the app's MallDetails.jsx data and rules: the same places,
 * tabs, floor filter and sections. Desktop classes are exact Figma values in
 * design px (`--u`, see unit.ts); `max-lg:` is the phone layout.
 */

const CATEGORIES = [
  { key: 'all', label: 'All', icon: null },
  { key: 'dining', label: 'Dining', icon: '/assets/search/dining.webp' },
  { key: 'shopping', label: 'Shopping', icon: '/assets/search/shopping.webp' },
  { key: 'wellness', label: 'Wellness', icon: '/assets/search/wellness.webp' },
] as const
type Category = (typeof CATEGORIES)[number]['key']

const SORTS = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'distance', label: 'Distance' },
  { key: 'rating', label: 'Rating' },
] as const
type Sort = (typeof SORTS)[number]['key']

/** Dining sub-rails of the "Dining" tab, picked by cuisine. */
const CAFE = /caf[eé]|coffee|bakery|dessert|tea|patisser/i
const QUICK = /fast ?food|burger|pizza|sandwich|snack|street|quick|wrap|shawarma|fries|sub/i

const TITLE = 'text-[calc(24*var(--u))] leading-[calc(32*var(--u))] font-bold text-[#322F35] max-lg:text-[20px] max-lg:leading-[28px]'
const CHIP =
  'flex h-39 shrink-0 items-center gap-8 rounded-full border-[calc(1.45*var(--u))] px-12 text-[calc(17.4*var(--u))] leading-[calc(27*var(--u))] font-semibold transition-colors max-lg:h-[34px] max-lg:border max-lg:px-[12px] max-lg:text-[13px]'
const chipState = (on: boolean) => (on ? 'border-[#FF4800] bg-[#FFF1EB] text-[#FF4800]' : 'border-[#B0B0B0] bg-white/77 text-[#454040] hover:bg-[#FAFAFA]')

const distanceFrom = (from: { lat: number | null; lng: number | null }, lat: number | null | undefined, lng: number | null | undefined) =>
  from.lat != null && from.lng != null && lat != null && lng != null ? haversineKm(from.lat, from.lng, Number(lat), Number(lng)) : null

function restaurantPlace(r: FeaturedRestaurant, rank: number, from: { lat: number | null; lng: number | null }): MallPlace {
  return {
    id: r.id,
    saveType: 'RESTAURANT',
    href: `/dining/${r.slug ?? r.id}`,
    name: r.name,
    image: r.cover_image,
    logo: null,
    offer: r.offer_badge?.trim() || null,
    more: 0,
    rating: Number(r.rating) || 0,
    distance: distanceFrom(from, r.latitude, r.longitude) ?? r.distance_km ?? null,
    area: r.area ?? r.city,
    floor: null,
    tagline: r.cuisines.slice(0, 2).join(', ') || null,
    cuisines: r.cuisines,
    costForTwo: r.cost_for_two,
    chips: getCardChips(r),
    caps: r,
    topBrand: false,
    rank,
  }
}

function storePlace(s: MallStore, rank: number, from: { lat: number | null; lng: number | null }): MallPlace {
  const base = s.store_type === 'SERVICE' ? 'wellness' : 'stores'
  return {
    id: s.id,
    saveType: 'STORE',
    href: `/${base}/${s.slug ?? s.id}`,
    name: s.name,
    image: s.cover_image ?? s.logo_url,
    logo: s.logo_url,
    offer: cardOfferText(s.store_offers) ?? null,
    more: Math.max(0, (s.store_offers?.length ?? 0) - 1),
    rating: 0,
    distance: distanceFrom(from, s.lat, s.lng),
    area: s.location_name ?? s.city,
    floor: s.floor,
    tagline: [s.category, s.subcategory].filter(Boolean).join(', ') || null,
    cuisines: [],
    costForTwo: null,
    chips: getCardChips(s),
    caps: s,
    topBrand: !!s.is_top_brand,
    rank,
  }
}

function sortPlaces(list: MallPlace[], sort: Sort, heavy: boolean) {
  const rows = heavy ? list.filter((p) => p.offer) : list
  if (sort === 'relevance') return rows
  return [...rows].sort((a, b) =>
    sort === 'rating'
      ? b.rating - a.rating || a.rank - b.rank
      : (a.distance ?? Infinity) - (b.distance ?? Infinity) || a.rank - b.rank,
  )
}

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])
  return ref
}

// ─── Overview ────────────────────────────────────────────────────────────

function ShareButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: name, url }).catch(() => {})
      return
    }
    await navigator.clipboard?.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <button
      type='button'
      onClick={share}
      aria-label={copied ? 'Link copied' : 'Share'}
      className='absolute top-24 right-24 flex size-40 items-center justify-center rounded-full bg-[rgba(217,217,217,0.1)] text-white backdrop-blur-sm transition-colors hover:bg-black/20 max-lg:top-[12px] max-lg:right-[12px] max-lg:size-[36px] max-lg:bg-black/25'
    >
      {copied ? <Check className='size-20 max-lg:size-[18px]' strokeWidth={1.8} /> : <Share2 className='size-20 max-lg:size-[18px]' strokeWidth={1.4} />}
    </button>
  )
}

function Overview({ mall }: { mall: Mall }) {
  const { location } = useLocation()
  const [showHours, setShowHours] = useState(false)
  const status = useMemo(() => mallOpenStatus(mall.opening_hours), [mall.opening_hours])
  const hours = weeklyHours(mall.opening_hours)
  const amenities = mallAmenityKeys(mall)
  const hoursRef = useDismiss(showHours, () => setShowHours(false))
  const distance = distanceFrom(location, mall.lat, mall.lng) ?? mall.distance ?? null
  const place = mall.location_name ?? mall.city
  const query = mall.lat != null && mall.lng != null ? `${mall.lat},${mall.lng}` : mall.name
  const placeId = mall.google_place_id ? `&query_place_id=${encodeURIComponent(mall.google_place_id)}` : ''
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}${placeId}`
  const image = mall.cover_image ?? mall.logo_url
  const iconPill = 'flex h-34 w-35 items-center justify-center rounded-full bg-[#F4F4F4] text-[#666666] transition-colors hover:bg-[#EAEAEA] max-lg:size-[34px]'

  return (
    <section>
      <div className='relative h-392 overflow-hidden rounded-[calc(20*var(--u))] bg-[#EBEBEB] max-lg:h-[200px] max-lg:rounded-[16px]'>
        {image && <Image src={image} alt={mall.name} fill priority sizes='(min-width: 1024px) 82vw, 100vw' className='object-cover' />}
        <ShareButton name={mall.name} />
      </div>

      <div className='mt-28 flex items-start justify-between gap-32 max-lg:mt-[16px] max-lg:flex-col max-lg:gap-[14px]'>
        <div className='min-w-0'>
          <h1 className='text-[calc(32*var(--u))] leading-[calc(40*var(--u))] font-bold text-[#322F35] max-lg:text-[24px] max-lg:leading-[32px]'>{mall.name}</h1>
          {(distance != null || place) && (
            <p className='mt-10 text-[calc(15.96*var(--u))] leading-[calc(23*var(--u))] font-medium text-[#9B969D] max-lg:mt-[4px] max-lg:text-[14px] max-lg:leading-[20px]'>
              {[formatDistanceKm(distance), place].filter(Boolean).join(' • ')}
            </p>
          )}
          <div className='mt-13 flex items-center gap-4 max-lg:mt-[10px] max-lg:gap-[6px]'>
            {status && (
              <div ref={hoursRef} className='relative'>
                <button
                  type='button'
                  onClick={() => setShowHours((o) => !o)}
                  aria-expanded={showHours}
                  className='flex h-34 items-center gap-4 rounded-full bg-[#F4F4F4] px-11 text-[calc(15.4*var(--u))] leading-[calc(22*var(--u))] max-lg:h-[34px] max-lg:px-[12px] max-lg:text-[13px]'
                >
                  <span className={cn('font-semibold', status.open ? 'text-[#3AA456]' : 'text-[#E5484D]')}>{status.open ? 'Open' : 'Closed'}</span>
                  <span className='text-[#666666]'>{status.label}</span>
                  <ChevronDown className={cn('size-16 text-[#666666] transition-transform max-lg:size-[14px]', showHours && 'rotate-180')} strokeWidth={1.6} />
                </button>
                {showHours && (
                  <dl className='absolute top-full left-0 z-30 mt-8 w-280 rounded-[calc(16*var(--u))] bg-white p-16 text-[calc(15*var(--u))] leading-[calc(22*var(--u))] shadow-[0_calc(4*var(--u))_calc(13*var(--u))_rgba(0,0,0,0.12)] max-lg:w-[240px] max-lg:rounded-[14px] max-lg:p-[12px] max-lg:text-[13px]'>
                    {hours.map((row) => (
                      <div key={row.day} className='flex justify-between gap-16 py-4'>
                        <dt className='text-[#666666]'>{row.day}</dt>
                        <dd className='font-medium text-[#322F35]'>{row.text}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            )}
            <a href={directions} target='_blank' rel='noreferrer' aria-label='Directions' className={iconPill}>
              <Navigation className='size-17 max-lg:size-[16px]' strokeWidth={1.4} />
            </a>
            {mall.phone && (
              <a href={`tel:${mall.phone}`} aria-label='Call' className={iconPill}>
                <Phone className='size-17 max-lg:size-[16px]' strokeWidth={1.4} />
              </a>
            )}
          </div>
        </div>

        {amenities.length > 0 && (
          <ul className='mt-30 flex flex-wrap justify-end gap-x-24 gap-y-8 max-lg:mt-0 max-lg:justify-start max-lg:gap-x-[16px]'>
            {amenities.map((key) => {
              const Icon = AMENITY_ICONS[key]
              return (
                <li key={key} className='flex items-center gap-5 text-[calc(14.85*var(--u))] leading-[calc(19*var(--u))] font-medium text-[#1A1A1A] max-lg:text-[13px]'>
                  <Icon className='size-19 text-[#FF4800] max-lg:size-[16px]' strokeWidth={2} /> {MALL_AMENITY_LABELS[key]}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

// ─── Tabs, floors, sort ──────────────────────────────────────────────────

function SortMenu({ sort, onChange }: { sort: Sort; onChange: (s: Sort) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useDismiss(open, () => setOpen(false))
  const current = SORTS.find((s) => s.key === sort)
  return (
    <div ref={ref} className='relative shrink-0'>
      <button type='button' onClick={() => setOpen((o) => !o)} aria-expanded={open} className={cn(CHIP, chipState(sort !== 'relevance'))}>
        {sort === 'relevance' ? 'Sort By' : current?.label}
        <ChevronDown className={cn('size-16 transition-transform max-lg:size-[14px]', open && 'rotate-180')} strokeWidth={2} />
      </button>
      {open && (
        <ul className='absolute top-full left-0 z-30 mt-8 w-200 overflow-hidden rounded-[calc(14*var(--u))] bg-white py-6 shadow-[0_calc(4*var(--u))_calc(13*var(--u))_rgba(0,0,0,0.12)] max-lg:w-[180px] max-lg:rounded-[12px]'>
          {SORTS.map((s) => (
            <li key={s.key}>
              <button
                type='button'
                onClick={() => {
                  onChange(s.key)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between px-16 py-10 text-left text-[calc(16*var(--u))] leading-[calc(22*var(--u))] hover:bg-[#FAFAFA] max-lg:px-[14px] max-lg:py-[10px] max-lg:text-[14px]',
                  s.key === sort ? 'font-semibold text-[#FF4800]' : 'text-[#322F35]',
                )}
              >
                {s.label}
                {s.key === sort && <Check className='size-16 max-lg:size-[14px]' strokeWidth={2} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────

/** One mall and what's inside it — app parity: screens/MallDetails.jsx. */
export function MallDetailClient({ mall, places }: { mall: Mall; places: MallPlaces }) {
  const router = useRouter()
  const { location } = useLocation()
  const [category, setCategory] = useState<Category>('all')
  const [floor, setFloor] = useState('All')
  const [sort, setSort] = useState<Sort>('relevance')
  const [heavy, setHeavy] = useState(false)

  const all = useMemo(
    () => ({
      dining: places.dining.map((r, i) => restaurantPlace(r, i, location)),
      shopping: places.shopping.map((s, i) => storePlace(s, i, location)),
      wellness: places.wellness.map((s, i) => storePlace(s, i, location)),
    }),
    [places, location],
  )

  const floors = useMemo(() => {
    const set = new Set([...places.shopping, ...places.wellness].map((s) => s.floor).filter((f): f is string => !!f))
    return set.size ? ['All', ...set] : []
  }, [places])

  // app parity: a chosen floor narrows the stores; restaurants carry no floor, so they drop out
  const byFloor = (list: MallPlace[]) => (floor === 'All' ? list : list.filter((p) => p.floor === floor))
  const dining = sortPlaces(floor === 'All' ? all.dining : [], sort, heavy)
  const shopping = sortPlaces(byFloor(all.shopping), sort, heavy)
  const wellness = sortPlaces(byFloor(all.wellness), sort, heavy)
  const lists = { dining, shopping, wellness }

  const tabs = CATEGORIES.filter((c) => c.key === 'all' || places[c.key].length)
  const nothing = !places.dining.length && !places.shopping.length && !places.wellness.length
  const bestOffers = [...shopping, ...wellness, ...dining].filter((p) => p.offer).slice(0, 6)
  const brands = shopping.filter((p) => p.topBrand)
  const shopPanels = Array.from({ length: Math.ceil(shopping.length / 3) }, (_, i) => shopping.slice(i * 3, i * 3 + 3))
  const empty = <p className='text-[calc(16*var(--u))] text-[#666666] max-lg:text-[14px]'>Nothing matches here yet.</p>

  const grid = (title: string, list: MallPlace[]) => (
    <section className='flex flex-col gap-24 max-lg:gap-[12px]'>
      <h2 className={TITLE}>{title}</h2>
      {list.length ? (
        <div className='grid grid-cols-3 gap-24 max-lg:grid-cols-1 max-lg:gap-[16px] sm:max-lg:grid-cols-2'>
          {list.map((p) => <PlaceCard key={p.id} place={p} variant='grid' />)}
        </div>
      ) : (
        empty
      )}
    </section>
  )
  const rail = (title: string, list: MallPlace[]) =>
    list.length > 0 && (
      <Rail head={<h2 className={cn(TITLE, 'mb-8 max-lg:mb-0')}>{title}</h2>}>
        {list.map((p) => <PlaceCard key={p.id} place={p} />)}
      </Rail>
    )

  return (
    <div className={MALL_PAGE}>
      <div className='px-172 pt-56 max-lg:px-16 max-lg:pt-[12px]'>
        <button
          type='button'
          onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
          className='flex h-40 items-center gap-0 text-[calc(24*var(--u))] leading-[calc(31*var(--u))] font-semibold text-[#666666] hover:text-[#322F35] max-lg:h-[36px] max-lg:text-[16px]'
        >
          <ChevronLeft className='-ml-12 size-40 max-lg:-ml-[8px] max-lg:size-[26px]' strokeWidth={1.5} /> Back
        </button>

        <div className='mt-56 max-lg:mt-[12px]'>
          <Overview mall={mall} />
        </div>

        {nothing ? (
          <p className='mt-48 text-[calc(16*var(--u))] text-[#666666] max-lg:mt-[32px] max-lg:text-[14px]'>No places listed at this mall yet.</p>
        ) : (
          <>
            {/* Figma "Categories and filters": 80-tall tabs over a 1px rule, floors on the right, chips below */}
            <div className='mt-32 max-lg:mt-[24px]'>
              <div className='flex items-start justify-between gap-24 border-b border-[#E6E6E6] max-lg:flex-col max-lg:gap-[12px] max-lg:border-b-0'>
                <div role='tablist' className='scrollbar-hide flex gap-12 overflow-x-auto [scrollbar-width:none] max-lg:-mx-16 max-lg:w-[calc(100%+32px)] max-lg:border-b max-lg:border-[#E6E6E6] max-lg:px-16'>
                  {tabs.map((tab) => {
                    const active = tab.key === category
                    return (
                      <button
                        key={tab.key}
                        role='tab'
                        type='button'
                        aria-selected={active}
                        onClick={() => setCategory(tab.key)}
                        className={cn(
                          'relative flex h-80 shrink-0 items-start gap-11 pt-4 text-[calc(16*var(--u))] leading-[calc(24*var(--u))] font-bold whitespace-nowrap text-[#322F35] max-lg:h-[56px] max-lg:gap-[8px] max-lg:text-[14px]',
                          tab.icon ? 'px-16 max-lg:px-[8px]' : 'px-22 max-lg:px-[12px]',
                        )}
                      >
                        {tab.icon && <Image src={tab.icon} alt='' width={84} height={92} className='h-41 w-auto max-lg:h-[30px]' />}
                        <span className='mt-18 max-lg:mt-[6px]'>
                          {tab.key === 'all' ? tab.label : `${tab.label} (${places[tab.key].length})`}
                        </span>
                        {active && <span className='absolute inset-x-0 bottom-1 h-3 rounded-full bg-[#FF4901] max-lg:bottom-0' />}
                      </button>
                    )
                  })}
                </div>

                {floors.length > 0 && (
                  <div className='mt-18 flex shrink-0 items-center gap-15 max-lg:mt-0 max-lg:gap-[10px]'>
                    <span className='text-[calc(18.9*var(--u))] leading-[calc(25*var(--u))] font-bold text-[#1A1A1A] max-lg:text-[14px]'>Floor</span>
                    <div className='scrollbar-hide flex gap-5 overflow-x-auto [scrollbar-width:none] max-lg:gap-[6px]'>
                      {floors.map((f) => (
                        <button
                          key={f}
                          type='button'
                          onClick={() => setFloor(f)}
                          aria-pressed={f === floor}
                          className={cn(
                            'flex h-36 min-w-47 shrink-0 items-center justify-center rounded-full border-[calc(1.35*var(--u))] px-13 text-[calc(16.2*var(--u))] leading-[calc(25*var(--u))] font-semibold max-lg:h-[32px] max-lg:min-w-[42px] max-lg:border max-lg:px-[10px] max-lg:text-[13px]',
                            f === floor ? 'border-[#FF4800] bg-[#FF4800] text-white' : 'border-[#B0B0B0] bg-white/77 text-[#454040] hover:bg-[#FAFAFA]',
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className='mt-23 flex flex-wrap items-center gap-12 max-lg:mt-[12px] max-lg:gap-[8px]'>
                <SortMenu sort={sort} onChange={setSort} />
                <button type='button' aria-pressed={heavy} onClick={() => setHeavy((h) => !h)} className={cn(CHIP, chipState(heavy))}>
                  Heavy discounts
                </button>
              </div>
            </div>

            <div className='mt-48 flex flex-col gap-64 max-lg:mt-[24px] max-lg:gap-[32px]'>
              {floor !== 'All' ? (
                // Figma "Dining, ground floor": a floor shows one grid of what's on it
                category === 'all' ? (
                  grid(`On floor ${floor}`, [...shopping, ...wellness])
                ) : (
                  grid(`${CATEGORIES.find((c) => c.key === category)?.label} on floor ${floor}`, lists[category])
                )
              ) : category === 'all' ? (
                <>
                  {bestOffers.length > 0 && (
                    <Rail head={<h2 className={cn(TITLE, 'mb-8 max-lg:mb-0')}>Best offers</h2>}>
                      {bestOffers.map((p) => <BestOfferCard key={`${p.saveType}-${p.id}`} place={p} />)}
                    </Rail>
                  )}
                  {rail('New Eateries', dining)}
                  {rail('Spa near you', wellness)}
                  {brands.length > 0 && (
                    <Rail head={<h2 className={cn(TITLE, 'mb-8 max-lg:mb-0')}>Discover top brands</h2>}>
                      {brands.map((p, i) => <BrandTile key={p.id} place={p} index={i} />)}
                    </Rail>
                  )}
                  {shopping.length > 0 && (
                    <section className='flex flex-col gap-24 max-lg:gap-[12px]'>
                      <h2 className={TITLE}>Shop and shine</h2>
                      <div className='grid grid-cols-2 gap-24 max-lg:grid-cols-1 max-lg:gap-[12px]'>
                        {shopPanels.map((panel, i) => <ShopPanel key={i} places={panel} />)}
                      </div>
                    </section>
                  )}
                  {!dining.length && !wellness.length && !shopping.length && empty}
                </>
              ) : category === 'dining' ? (
                <>
                  {rail('New Eateries', dining)}
                  {rail('Cozy Cafés', dining.filter((p) => p.cuisines.some((c) => CAFE.test(c))))}
                  {rail('Quick Bites', dining.filter((p) => p.cuisines.some((c) => QUICK.test(c))))}
                  {grid(`All in dining at ${mall.name}`, dining)}
                </>
              ) : (
                grid(`All in ${category} at ${mall.name}`, lists[category])
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
