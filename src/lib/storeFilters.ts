/**
 * Store list filters — app parity: utils/storeFilters.js + the FilterModal
 * option lists it is used with (DininHome/restaurantFilters.js DISTANCE_OPTIONS,
 * OFFER_OPTIONS). Pure functions so the Stores screen and tests share them.
 */

export const STORE_FILTER_SECTIONS = ['Sort', 'Distance', 'Store Category', 'Special Offers'] as const
export type StoreFilterSection = (typeof STORE_FILTER_SECTIONS)[number]

export const STORE_SORT_OPTIONS = ['Relevance', 'Distance: Nearby to Far'] as const

export const DISTANCE_OPTIONS = [
  'Nearby (< 1 km)',
  'Within 1 km',
  'Within 3 km',
  'Within 5 km',
  'Within 10 km',
] as const

export const OFFER_OPTIONS = [
  'Any Offer',
  '10% Off & Above',
  '20% Off & Above',
  '30% Off & Above',
  '50% Off & Above',
  'Flat Amount Off',
] as const

export const NEAR_ME = 'Near Me'

export type StoreFilters = {
  sort: string | null
  distance: string | null
  /** selected store categories and offer options, as in the app's `more` */
  more: string[]
}

export const EMPTY_STORE_FILTERS: StoreFilters = { sort: null, distance: null, more: [] }

type FilterableOffer = {
  offer_type?: string | null
  discount_value?: number | null
  title?: string | null
  badge_text?: string | null
  is_active?: boolean | null
  start_at?: string | null
  end_at?: string | null
}

export type FilterableStore = {
  category?: string | null
  subcategory?: string | null
  distance_km?: number | null
  store_offers?: FilterableOffer[] | null
}

const IGNORED_CATEGORIES = new Set(['all stores', 'all'])
const norm = (value: unknown) => String(value ?? '').trim().toLowerCase()
const slug = (value: unknown) => norm(value).replace(/[^a-z0-9]+/g, '-')

export function storeCategoryList(store: FilterableStore): string[] {
  return [store.category, store.subcategory]
    .flatMap((value) => String(value ?? '').split(','))
    .map((value) => value.trim())
    .filter((value) => value && !IGNORED_CATEGORIES.has(value.toLowerCase()))
}

export function storeMatchesCategory(store: FilterableStore, category: string): boolean {
  const wanted = slug(category)
  return storeCategoryList(store).some((value) => slug(value) === wanted)
}

/** Categories present in `stores`, most common first, then A–Z. */
export function storeCategoryOptions(stores: FilterableStore[], exclude: (value: string) => boolean = () => false): string[] {
  const counts = new Map<string, number>()
  for (const store of stores) {
    for (const value of new Set(storeCategoryList(store))) {
      if (exclude(value)) continue
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value]) => value)
}

/** app parity: StoreHome isWellnessCategory — kept out of the Stores screen's category options */
export const isWellnessCategory = (value: string) => /\b(salon|wellness|spa)\b/i.test(value)

function liveOffers(store: FilterableStore, now: number): FilterableOffer[] {
  return (store.store_offers ?? []).filter((offer) => {
    if (!offer || offer.is_active === false) return false
    if (offer.start_at && Date.parse(offer.start_at) > now) return false
    if (offer.end_at && Date.parse(offer.end_at) < now) return false
    return true
  })
}

function offerPercent(offer: FilterableOffer): number | null {
  const type = norm(offer.offer_type)
  const value = Number(offer.discount_value)
  if ((type === 'percentage' || type === 'percent') && value > 0) return value
  const match = String(offer.title || offer.badge_text || '').match(/(\d+(?:\.\d+)?)\s*%/)
  return match ? Number(match[1]) : null
}

function matchesOfferOption(offers: FilterableOffer[], option: string): boolean {
  if (option === 'Any Offer') return offers.length > 0
  if (option === 'Flat Amount Off') return offers.some((o) => norm(o.offer_type) === 'flat')
  const min = Number(option.match(/(\d+)%/)?.[1])
  return Number.isFinite(min) && offers.some((o) => (offerPercent(o) ?? 0) >= min)
}

function distanceLimitKm(option: string | null): number | null {
  const km = Number(String(option ?? '').match(/[\d.]+/)?.[0])
  return Number.isFinite(km) ? km : null
}

function distanceOf(store: FilterableStore): number | null {
  const km = store.distance_km
  return km != null && Number.isFinite(km) ? km : null
}

const byDistance = (a: FilterableStore, b: FilterableStore) =>
  (distanceOf(a) ?? Infinity) - (distanceOf(b) ?? Infinity)

/** Quick chip: "Near Me" sorts by distance, any other chip is a category. */
export function applyStoreQuickFilter<T extends FilterableStore>(stores: T[], quick: string | null): T[] {
  if (!quick) return stores
  if (norm(quick) === norm(NEAR_ME)) return [...stores].sort(byDistance)
  return stores.filter((store) => storeMatchesCategory(store, quick))
}

export function applyStoreFilters<T extends FilterableStore>(stores: T[], filters: StoreFilters, now = Date.now()): T[] {
  let out = stores
  const offerSet = new Set<string>(OFFER_OPTIONS)
  const selectedOffers = filters.more.filter((m) => offerSet.has(m))
  const selectedCategories = filters.more.filter((m) => !offerSet.has(m))

  if (selectedCategories.length) {
    out = out.filter((store) => selectedCategories.some((category) => storeMatchesCategory(store, category)))
  }
  if (selectedOffers.length) {
    out = out.filter((store) => {
      const offers = liveOffers(store, now)
      return selectedOffers.some((option) => matchesOfferOption(offers, option))
    })
  }
  const km = distanceLimitKm(filters.distance)
  if (km != null) {
    out = out.filter((store) => {
      const d = distanceOf(store)
      return d != null && d <= km
    })
  }
  if (filters.sort === 'Distance: Nearby to Far') out = [...out].sort(byDistance)
  return out
}

/** app parity: StoreHome activeFilterCount — sort, distance, quick chip, plus each multi pick */
export function storeFilterCount(filters: StoreFilters, quick: string | null): number {
  return [filters.sort, filters.distance, quick].filter(Boolean).length + filters.more.length
}
