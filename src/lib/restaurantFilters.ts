/**
 * Dining feed filters — app parity: DineinHome.jsx buildFeedFilters /
 * SORT_LABEL_TO_PARAM / AllRestaurantBadges BADGE_FILTERS. State lives in the
 * URL query string so a filtered list is shareable and server-rendered.
 */

export const FEED_PAGE_SIZE = 12

export type Coords = { lat: number; lng: number }

export const SORT_OPTIONS = [
  { key: 'distance', label: 'Distance' },
  { key: 'rating', label: 'Top Rated' },
  { key: 'cost_asc', label: 'Cost: Low to High' },
  { key: 'cost_desc', label: 'Cost: High to Low' },
] as const

export const BADGE_KEYS = ['cashback', 'booking', 'instant', 'stamps', 'exclusive'] as const
export type BadgeKey = (typeof BADGE_KEYS)[number]

/** "Cost for two" — Figma desktop filter (Rs, the site's currency). */
export const COST_BUCKETS = [
  { key: 'u300', label: 'Under Rs 300', min: null, max: 300 },
  { key: '300-600', label: 'Rs 300 - Rs 600', min: 300, max: 600 },
  { key: '600-1000', label: 'Rs 600 - Rs 1000', min: 600, max: 1000 },
  { key: '1000-1500', label: 'Rs 1000 - Rs 1500', min: 1000, max: 1500 },
  { key: 'a1500', label: 'Above Rs 1500', min: 1500, max: null },
] as const

export const RATING_OPTIONS = [4.5, 4.0, 3.5, 3.0] as const

/** Sort section of the filter dialog — app parity: FilterModal SORT_OPTIONS (Relevance = no sort). */
export const DIALOG_SORT_OPTIONS = [
  { key: null, label: 'Relevance' },
  { key: 'distance', label: 'Distance: Nearby to Far' },
  { key: 'popularity', label: 'Popularity: High to Low' },
  { key: 'cost_asc', label: 'Cost for two: Low to High' },
  { key: 'cost_desc', label: 'Cost for two: High to Low' },
] as const

/** app parity: DISTANCE_OPTIONS — applied as a fixed radius around the visitor. */
export const DISTANCE_OPTIONS = [
  { key: 'near', label: 'Nearby (< 1 km)', km: 1 },
  { key: '1', label: 'Within 1 km', km: 1 },
  { key: '3', label: 'Within 3 km', km: 3 },
  { key: '5', label: 'Within 5 km', km: 5 },
  { key: '10', label: 'Within 10 km', km: 10 },
] as const

export const distanceKm = (key?: string) => DISTANCE_OPTIONS.find((d) => d.key === key)?.km

/** "Open Now" maps to `openNow`; the rest have no data behind them yet (as in the app). */
export const AVAILABILITY_OPTIONS = ['Available Today', 'Available Tomorrow', 'Available This Weekend'] as const

export const CATEGORY_OPTIONS = ['Casual Dining', 'Fine Dining', 'Café & Bakery', 'Fast Food', 'Buffet', 'Bar & Lounge'] as const

/** "Pure Veg" maps to `veg`; the rest are `in_experience` keywords. */
export const DIET_OPTIONS = ['Vegan Options', 'Gluten-Free', 'Halal', 'Jain Food'] as const

export const VIBE_OPTIONS = ['Romantic', 'Family Friendly', 'Outdoor Seating', 'Rooftop', 'Live Music', 'Pet Friendly'] as const

/** Every offer type narrows to restaurants with a live offer (`in_has_offer`). */
export const OFFER_OPTIONS = ['Happy Hour Deals', 'Free Delivery', 'Buy 1 Get 1', 'Discount Offers', 'Combo Meals'] as const

/**
 * Label → `in_experience` keywords — app parity: EXPERIENCE_KEYWORDS. Labels
 * not listed here are sent as-is (lower-cased).
 */
const EXPERIENCE_KEYWORDS: Record<string, string[]> = {
  Romantic: ['romantic'],
  'Family Friendly': ['family friendly', 'family dining'],
  'Outdoor Seating': ['outdoor seating', 'alfresco', 'open air'],
  Rooftop: ['rooftop'],
  'Live Music': ['live music'],
  'Pet Friendly': ['pet friendly', 'pets allowed'],
  'Casual Dining': ['casual dining'],
  'Fine Dining': ['fine dining'],
  'Café & Bakery': ['cafe', 'café', 'bakery', 'coffee'],
  'Fast Food': ['fast food'],
  Buffet: ['buffet'],
  'Bar & Lounge': ['bar', 'lounge', 'cocktail'],
  'Vegan Options': ['vegan'],
  'Gluten-Free': ['gluten'],
  Halal: ['halal'],
  'Jain Food': ['jain'],
}

const keywordsOf = (label: string) => EXPERIENCE_KEYWORDS[label] ?? [label.toLowerCase()]

export type FeedFilters = {
  sort?: string
  cuisines?: string[]
  minRating?: number
  cost?: string
  veg?: boolean
  openNow?: boolean
  openLate?: boolean
  hasOffer?: boolean
  vibes?: string[]
  /** DISTANCE_OPTIONS key */
  distance?: string
  categories?: string[]
  diets?: string[]
  offers?: string[]
  availability?: string[]
  badge?: BadgeKey
  /** mood category title (resolved from the `mood` slug by the page) */
  moodTitle?: string
}

type Params = Record<string, string | string[] | undefined>

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const list = (v: string | string[] | undefined) =>
  (one(v) ?? '').split(',').map((s) => s.trim()).filter(Boolean)

/** URL search params → typed filters (mood slug is resolved separately). */
export function parseFilters(params: Params): FeedFilters & { moodSlug?: string } {
  const badge = one(params.badge)
  const rating = Number(one(params.rating))
  return {
    sort: one(params.sort) || undefined,
    cuisines: list(params.cuisines),
    minRating: Number.isFinite(rating) && rating > 0 ? rating : undefined,
    cost: one(params.cost) || undefined,
    veg: one(params.veg) === '1',
    openNow: one(params.open) === '1',
    openLate: one(params.late) === '1',
    hasOffer: one(params.offer) === '1',
    vibes: list(params.vibe),
    distance: distanceKm(one(params.km)) ? one(params.km) : undefined,
    categories: list(params.cat),
    diets: list(params.diet),
    offers: list(params.offers),
    availability: list(params.avail),
    badge: (BADGE_KEYS as readonly string[]).includes(badge ?? '') ? (badge as BadgeKey) : undefined,
    moodSlug: one(params.mood) || undefined,
  }
}

export function countActive(f: FeedFilters & { moodSlug?: string }): number {
  return [
    f.sort,
    f.cuisines?.length,
    f.minRating,
    f.cost,
    f.veg,
    f.openNow,
    f.openLate,
    f.hasOffer,
    f.vibes?.length,
    f.distance,
    f.categories?.length,
    f.diets?.length,
    f.offers?.length,
    f.availability?.length,
    f.badge,
    f.moodSlug,
  ].filter(Boolean).length
}

/** Typed filters → `restaurant_feed` RPC arguments. */
export function toRpcArgs(f: FeedFilters, limit: number, offset: number, coords?: Coords | null) {
  const bucket = COST_BUCKETS.find((b) => b.key === f.cost)
  // mood tags are saved with inconsistent spacing ("Family  dining" / "Family dining")
  const moodTitles = f.moodTitle ? [...new Set([f.moodTitle, f.moodTitle.replace(/\s+/g, ' ').trim()])] : []
  const experience = [
    ...new Set([...(f.vibes ?? []), ...(f.categories ?? []), ...(f.diets ?? [])].flatMap(keywordsOf)),
    ...moodTitles,
  ]
  return {
    in_lat: coords?.lat ?? null,
    in_lng: coords?.lng ?? null,
    in_limit: limit,
    in_offset: offset,
    in_cuisines: f.cuisines?.length ? f.cuisines : null,
    in_min_rating: f.sort === 'rating' ? Math.max(f.minRating ?? 0, 4.0) : (f.minRating ?? null),
    in_min_cost: bucket?.min ?? null,
    in_max_cost: bucket?.max ?? null,
    in_veg: f.veg ? true : null,
    in_experience: experience.length ? experience : null,
    // with a location the default order is nearest-first, like the app
    in_sort:
      f.sort === 'rating' || f.sort === 'popularity' ? 'rating_desc' : (f.sort ?? (coords ? 'distance' : 'newest')),
    in_open_now: f.openNow ? true : null,
    in_open_late: f.openLate ? true : null,
    in_has_offer: f.hasOffer || f.offers?.length ? true : null,
    in_cashback_only: f.badge === 'cashback' ? true : null,
    in_booking_only: f.badge === 'booking' || f.badge === 'instant' ? true : null,
    in_exclusive_only: f.badge === 'exclusive' ? true : null,
    in_repeat_rewards_only: f.badge === 'stamps' ? true : null,
  }
}
