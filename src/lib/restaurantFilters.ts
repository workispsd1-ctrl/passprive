/**
 * Dining feed filters — app parity: DineinHome.jsx buildFeedFilters /
 * SORT_LABEL_TO_PARAM / AllRestaurantBadges BADGE_FILTERS. State lives in the
 * URL query string so a filtered list is shareable and server-rendered.
 */

export const FEED_PAGE_SIZE = 12

/** App parity: utils/locationScope.js NEARBY_RADIUS_KM */
export const NEARBY_RADIUS_KM = 15

export type Coords = { lat: number; lng: number }

export const SORT_OPTIONS = [
  { key: 'distance', label: 'Distance' },
  { key: 'rating', label: 'Top Rated' },
  { key: 'cost_asc', label: 'Cost: Low to High' },
  { key: 'cost_desc', label: 'Cost: High to Low' },
] as const

export const BADGE_KEYS = ['cashback', 'booking', 'instant', 'stamps', 'exclusive'] as const
export type BadgeKey = (typeof BADGE_KEYS)[number]

export const COST_BUCKETS = [
  { key: 'budget', label: 'Under Rs 1,000', min: null, max: 1000 },
  { key: 'mid', label: 'Rs 1,000 – 2,500', min: 1000, max: 2500 },
  { key: 'high', label: 'Rs 2,500+', min: 2500, max: null },
] as const

export const RATING_OPTIONS = [3.5, 4.0, 4.5] as const

/** Vibe chips → `in_experience` keywords (matched against facility/highlight/mood tags). */
export const VIBE_OPTIONS = [
  'Romantic',
  'Family',
  'Rooftop',
  'Live music',
  'Outdoor',
  'Sea view',
  'Pet friendly',
  'Parking',
  'Wifi',
] as const

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
    f.badge,
    f.moodSlug,
  ].filter(Boolean).length
}

/** Typed filters → `restaurant_feed` RPC arguments. */
export function toRpcArgs(f: FeedFilters, limit: number, offset: number, coords?: Coords | null) {
  const bucket = COST_BUCKETS.find((b) => b.key === f.cost)
  const experience = [...(f.vibes ?? []), ...(f.moodTitle ? [f.moodTitle] : [])]
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
    in_sort: f.sort === 'rating' ? 'rating_desc' : (f.sort ?? (coords ? 'distance' : 'newest')),
    in_open_now: f.openNow ? true : null,
    in_open_late: f.openLate ? true : null,
    in_has_offer: f.hasOffer ? true : null,
    in_cashback_only: f.badge === 'cashback' ? true : null,
    in_booking_only: f.badge === 'booking' || f.badge === 'instant' ? true : null,
    in_exclusive_only: f.badge === 'exclusive' ? true : null,
    in_repeat_rewards_only: f.badge === 'stamps' ? true : null,
  }
}
