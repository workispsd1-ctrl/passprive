'use client'

import { useState, useMemo } from 'react'
import { SlidersHorizontal, ChevronDown, Percent } from 'lucide-react'
import { cn, sortByMerchant, haversineKm } from '@/lib/utils'
import { useLocation } from '@/lib/context/LocationContext'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCashbackBadgeArt } from '@/lib/cashback'
import { HScroll } from '@/components/sections/home/HScroll'
import { MerchantCard, type MerchantCardTag } from '@/components/sections/home/MerchantCard'
import type { StoreRow, StoreMoodCategory } from '@/lib/types/stores'

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

const DISTANCE_OPTIONS = [
  { label: 'Under 5km', km: 5 },
  { label: 'Under 10km', km: 10 },
  { label: 'Under 25km', km: 25 },
]

const SORT_OPTIONS = [
  { label: 'Recommended', value: 'recommended' as const },
  { label: 'Nearest', value: 'nearest' as const },
]

export function AllStoresSection({ stores, moodCategories, activeCategorySlug, title = 'All Stores', layout = 'rail' }: Props) {
  const { location } = useLocation()
  const plan = useUserPlan()
  const userCoords = useMemo(
    () => location.lat != null && location.lng != null
      ? { lat: location.lat, lng: location.lng }
      : null,
    [location.lat, location.lng]
  )

  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [showDistanceOptions, setShowDistanceOptions] = useState(false)
  const [minDiscount, setMinDiscount] = useState<number | null>(null)
  const [sort, setSort] = useState<'recommended' | 'nearest'>('recommended')
  const [showSortOptions, setShowSortOptions] = useState(false)

  const activeCategoryTitle = activeCategorySlug === 'all-stores'
    ? null
    : (moodCategories.find(c => c.slug === activeCategorySlug)?.title ?? null)

  const storesWithDist = useMemo(() =>
    stores.map(s => ({
      ...s,
      dist: userCoords && s.lat != null && s.lng != null
        ? haversineKm(userCoords.lat, userCoords.lng, s.lat, s.lng)
        : null,
    })),
    [stores, userCoords]
  )

  const filtered = useMemo(() => {
    let result = storesWithDist

    if (activeCategoryTitle) {
      // app parity: storeMatchesMoodCategory — compare normalised keys, not raw text
      const wanted = new Set([categoryKey(activeCategoryTitle), categoryKey(activeCategorySlug)])
      result = result.filter(s =>
        (s.category ?? '').split(',').some(c => wanted.has(categoryKey(c)))
      )
    }

    if (distanceKm != null) {
      result = result.filter(s => s.dist != null && s.dist <= distanceKm)
    }

    if (minDiscount != null) {
      result = result.filter(s =>
        (s.store_offers ?? []).some(o => (o.discount_value ?? 0) >= minDiscount)
      )
    }

    if (sort === 'nearest' && userCoords) {
      result = [...result].sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity))
    } else {
      result = sortByMerchant(result)
    }

    return result
  }, [storesWithDist, activeCategoryTitle, activeCategorySlug, distanceKm, minDiscount, sort, userCoords])

  const activeDistLabel = DISTANCE_OPTIONS.find(o => o.km === distanceKm)?.label
  const activeSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label
  const isFiltered = activeCategorySlug !== 'all-stores' || distanceKm != null || minDiscount != null

  return (
    <section className="py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-4 md:px-8">
        <h2 className="text-[18px] font-bold text-gray-900">{title}</h2>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label="Filter"
            className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 transition-colors hover:border-brand hover:text-brand"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSortOptions(v => !v)}
              className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 transition-colors hover:border-brand hover:text-brand"
            >
              Sort By: {activeSortLabel}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showSortOptions && (
              <div className="absolute top-full right-0 z-30 mt-1 min-w-40 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setSort(opt.value); setShowSortOptions(false) }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-[13px] hover:bg-gray-50',
                      sort === opt.value && 'font-semibold text-brand',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDistanceOptions(v => !v)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap transition-colors',
                distanceKm != null
                  ? 'border-brand bg-brand text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-brand hover:text-brand',
              )}
            >
              {activeDistLabel ?? 'Under 5km'}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showDistanceOptions && (
              <div className="absolute top-full right-0 z-30 mt-1 min-w-35 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => { setDistanceKm(null); setShowDistanceOptions(false) }}
                  className={cn('w-full px-4 py-2 text-left text-[13px] hover:bg-gray-50', distanceKm == null && 'font-semibold text-brand')}
                >
                  All distances
                </button>
                {DISTANCE_OPTIONS.map(opt => (
                  <button
                    key={opt.km}
                    type="button"
                    onClick={() => { setDistanceKm(opt.km); setShowDistanceOptions(false) }}
                    className={cn('w-full px-4 py-2 text-left text-[13px] hover:bg-gray-50', distanceKm === opt.km && 'font-semibold text-brand')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMinDiscount(v => (v === 30 ? null : 30))}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap transition-colors',
              minDiscount != null
                ? 'border-brand bg-brand text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-brand hover:text-brand',
            )}
          >
            <Percent className="h-3.5 w-3.5" />
            30% &amp; above
          </button>
        </div>
      </div>

      {isFiltered && (
        <p className="mb-3 px-4 text-[12px] text-gray-400 md:px-8">{filtered.length} store{filtered.length !== 1 ? 's' : ''}</p>
      )}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-gray-400">No stores match your filters.</p>
      ) : (
        <StoreList layout={layout}>
          {filtered.map((store) => {
            const meta = [
              store.dist != null ? (store.dist < 1 ? `${Math.round(store.dist * 1000)}m` : `${store.dist.toFixed(1)}km`) : null,
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

            const tags: MerchantCardTag[] = []
            if (store.store_offers?.length) tags.push({ label: 'Sale is live' })
            if (store.merchant_type === 'preferred') {
              tags.push({ label: 'Exclusive', icon: 'exclusive' })
            }

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
                cashbackArt={getCashbackBadgeArt(store, plan)}
                tags={tags}
              />
            )
          })}
        </StoreList>
      )}
    </section>
  )
}

function StoreList({ layout, children }: { layout: 'rail' | 'grid'; children: React.ReactNode }) {
  if (layout === 'grid') {
    return <div className="flex flex-wrap justify-center gap-4 px-4 md:justify-start md:px-8 2xl:gap-6">{children}</div>
  }
  return (
    <HScroll maxWidthClassName="w-full max-w-none" gapClassName="gap-4 2xl:gap-6" className="py-0">
      {children}
    </HScroll>
  )
}
