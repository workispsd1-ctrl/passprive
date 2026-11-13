'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { getCardChips } from '@/lib/cardChips'
import { SlidersHorizontal } from 'lucide-react'
import { cn, sortByMerchant, haversineKm } from '@/lib/utils'
import { useLocation } from '@/lib/context/LocationContext'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCardBadge } from '@/lib/cashback'
import { HScroll } from '@/components/sections/home/HScroll'
import { MerchantCard } from '@/components/sections/home/MerchantCard'
import { storeCardTags } from '@/lib/storeBadges'
import type { StoreRow, StoreMoodCategory } from '@/lib/types/stores'
import {
  EMPTY_STORE_FILTERS,
  NEAR_ME,
  applyStoreFilters,
  applyStoreQuickFilter,
  isWellnessCategory,
  storeCategoryOptions,
  storeFilterCount,
  type StoreFilters,
} from '@/lib/storeFilters'
import { StoreFilterDialog } from './StoreFilterDialog'

interface Props {
  stores: StoreRow[]
  moodCategories: StoreMoodCategory[]
  activeCategorySlug: string
  /** heading above the list (default "All Stores") */
  title?: string
  /** `rail` = one scrolling row (stores home), `grid` = wrapped results page */
  layout?: 'rail' | 'grid'
}

/** "Home & Furniture" / "home-furniture" → "home-and-furniture" style key for comparing categories. */
const categoryKey = (value: string) =>
  value.trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/**
 * Cards rendered up front, then appended in batches of this size as the list
 * nears its end. Without a location every active store matches, and rendering
 * all ~450 cards made the page ~4 MB of HTML.
 */
const BATCH = 24

export function AllStoresSection({ stores, moodCategories, activeCategorySlug, title = 'All Stores', layout = 'rail' }: Props) {
  const { location } = useLocation()
  const plan = useUserPlan()
  const userCoords = useMemo(
    () => location.lat != null && location.lng != null
      ? { lat: location.lat, lng: location.lng }
      : null,
    [location.lat, location.lng]
  )

  const [filters, setFilters] = useState<StoreFilters>(EMPTY_STORE_FILTERS)
  const [quick, setQuick] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  const activeCategoryTitle = activeCategorySlug === 'all-stores'
    ? null
    : (moodCategories.find(c => c.slug === activeCategorySlug)?.title ?? null)

  // the list the filters work on: location-aware distance, then the page's category
  const scoped = useMemo(() => {
    let result = stores.map(s => ({
      ...s,
      distance_km: userCoords && s.lat != null && s.lng != null
        ? haversineKm(userCoords.lat, userCoords.lng, s.lat, s.lng)
        : null,
    }))
    if (activeCategoryTitle) {
      // app parity: storeMatchesMoodCategory — compare normalised keys, not raw text
      const wanted = new Set([categoryKey(activeCategoryTitle), categoryKey(activeCategorySlug)])
      result = result.filter(s =>
        (s.category ?? '').split(',').some(c => wanted.has(categoryKey(c)))
      )
    }
    return sortByMerchant(result)
  }, [stores, userCoords, activeCategoryTitle, activeCategorySlug])

  // app parity: StoreHome drops wellness categories; StoreCategoryResultsScreen lists them all
  const categoryOptions = useMemo(
    () => storeCategoryOptions(scoped, layout === 'rail' ? isWellnessCategory : undefined),
    [scoped, layout],
  )
  const quickFilters = useMemo(() => {
    const list = [NEAR_ME, ...categoryOptions.slice(0, 10)]
    // the picked chip moves to the front (DineFilters orderedFilters)
    return quick && list.includes(quick) ? [quick, ...list.filter(f => f !== quick)] : list
  }, [categoryOptions, quick])

  const filtered = useMemo(
    () => applyStoreFilters(applyStoreQuickFilter(scoped, quick), filters),
    [scoped, quick, filters],
  )
  const filterCount = storeFilterCount(filters, quick)

  // back to the first batch whenever the filters / sort produce a new list
  const [shown, setShown] = useState(BATCH)
  const [shownFor, setShownFor] = useState(filtered)
  if (shownFor !== filtered) {
    setShownFor(filtered)
    setShown(BATCH)
  }
  const visible = filtered.slice(0, shown)
  const hasMore = shown < filtered.length
  const showMore = () => setShown(n => (n < filtered.length ? n + BATCH : n))

  const isFiltered = activeCategorySlug !== 'all-stores' || filterCount > 0

  return (
    <section className="py-5">
      <div className={cn('mb-4 px-4 md:px-8', layout === 'rail' && 'mx-auto max-w-7xl')}>
        <h2 className="font-(family-name:--font-dm-sans) text-[19px] leading-none font-bold text-[#0D141C] md:text-[20px] xl:text-[22px] 2xl:text-[26px] min-[120rem]:text-[32px]">{title}</h2>
      </div>

      {/* app parity: DineFilters — Filter button with count, then "Near Me" + top store categories */}
      <div className={cn('scrollbar-hide mb-4 flex items-center gap-2 overflow-x-auto px-4 md:px-8', layout === 'rail' && 'mx-auto max-w-7xl')}>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap transition-colors',
            filterCount > 0
              ? 'border-brand bg-brand-tint text-brand'
              : 'border-gray-300 bg-white text-gray-700 hover:border-brand hover:text-brand',
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {filterCount > 0 ? `Filter (${filterCount})` : 'Filter'}
        </button>
        {quickFilters.map(f => (
          <button
            key={f}
            type="button"
            aria-pressed={quick === f}
            onClick={() => setQuick(cur => (cur === f ? null : f))}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap transition-colors',
              quick === f
                ? 'border-brand bg-brand text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-brand hover:text-brand',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filterOpen && (
        <StoreFilterDialog
          open
          onClose={() => setFilterOpen(false)}
          initial={filters}
          categoryOptions={[...categoryOptions].sort((a, b) => a.localeCompare(b))}
          onApply={next => { setFilters(next); setFilterOpen(false) }}
          onReset={() => { setFilters(EMPTY_STORE_FILTERS); setQuick(null) }}
        />
      )}

      {isFiltered && (
        <p className={cn('mb-3 px-4 text-[12px] text-gray-400 md:px-8', layout === 'rail' && 'mx-auto max-w-7xl')}>{filtered.length} store{filtered.length !== 1 ? 's' : ''}</p>
      )}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-gray-400">No stores match your filters.</p>
      ) : (
        <StoreList layout={layout} onNearEnd={hasMore ? showMore : undefined}>
          {visible.map((store) => {
            const meta = [
              store.distance_km != null ? (store.distance_km < 1 ? `${Math.round(store.distance_km * 1000)}m` : `${store.distance_km.toFixed(1)}km`) : null,
              store.location_name ?? store.city,
            ]
              .filter(Boolean)
              .join(' • ')

            const primaryOffer = store.store_offers?.[0]
            const extraOffers = (store.store_offers?.length ?? 0) - 1
            const discountText = primaryOffer?.discount_value
              ? `Flat ${primaryOffer.discount_value}% OFF`
              : primaryOffer?.badge_text
            const offerLabel = discountText
              ? extraOffers > 0
                ? `${discountText} + ${extraOffers} offers`
                : discountText
              : undefined

            
            return (
              <MerchantCard
                key={store.id}
                href={`/stores/${store.slug ?? store.id}`}
                saveId={store.id}
                saveType="STORE"
                image={store.cover_image}
                name={store.name}
                meta={meta || undefined}
                tagline={[store.category, store.subcategory].filter(Boolean).join(', ') || undefined}
                offerLabel={offerLabel}
                cardBadge={getCardBadge(store, plan)}
                chips={getCardChips(store, 3)}
                tags={storeCardTags(store)}
              />
            )
          })}
        </StoreList>
      )}
    </section>
  )
}

function StoreList({ layout, onNearEnd, children }: { layout: 'rail' | 'grid'; onNearEnd?: () => void; children: React.ReactNode }) {
  if (layout === 'grid') {
    return (
      <>
        <div className="flex flex-wrap justify-center gap-4 px-4 md:justify-start md:px-8 2xl:gap-6">{children}</div>
        {/* remounted per batch so a sentinel still on screen fires again */}
        {onNearEnd && <NearEndSentinel key={Array.isArray(children) ? children.length : 0} onVisible={onNearEnd} />}
      </>
    )
  }
  return (
    <HScroll className="py-0" onNearEnd={onNearEnd}>
      {children}
    </HScroll>
  )
}

/** Fires `onVisible` once the grid's end is within ~a screen of the viewport. */
function NearEndSentinel({ onVisible }: { onVisible: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const cb = useRef(onVisible)
  useEffect(() => {
    cb.current = onVisible
  }, [onVisible])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => { if (entries.some(e => e.isIntersecting)) cb.current() },
      { rootMargin: '0px 0px 1000px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <div ref={ref} aria-hidden className="h-px" />
}
