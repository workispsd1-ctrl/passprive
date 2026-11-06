import { canBook, isPaidMerchant, type MerchantCapabilityFields } from '@/lib/cashback'

/** app parity: CardChips.jsx CHIPS — each key is an image in /public/assets/chips. */
export type CardChipKey =
  | 'recommended'
  | 'trending'
  | 'highly-rated'
  | 'stamp-sheet'
  | 'instant-booking'
  | 'best-value'
  | 'most-saved'

/** width ÷ height of each chip image (app parity: CHIPS[key].aspect). */
export const CHIP_ASPECT: Record<CardChipKey, number> = {
  recommended: 444 / 84,
  trending: 292 / 84,
  'highly-rated': 392 / 84,
  'stamp-sheet': 388 / 84,
  'instant-booking': 392 / 94,
  'best-value': 352 / 84,
  'most-saved': 376 / 84,
}

type Subscription = { status?: string | null; repeat_rewards_enabled?: boolean | null; starts_at?: string | null; expires_at?: string | null }

/** What the chips read. Pass whatever the card's row has; missing fields simply earn no chip. */
export type ChipSource = MerchantCapabilityFields & {
  /** stores carry `store_type`; restaurants don't */
  store_type?: string | null
  is_advertised?: boolean | null
  rating?: number | null
  rating_count?: number | null
  booking_service_type?: string | null
  repeat_rewards_enabled?: boolean | null
  store_subscriptions?: Subscription[] | null
  /** app parity: hasAnyOffer — offer badge / has_offer / any offers */
  has_offer?: boolean | null
  offer_badge?: string | null
  store_offers?: unknown[] | null
  saved_count?: number | null
}

const MAX_CHIPS = 2
const MIN_REVIEWS_HIGH = 3
const MIN_REVIEWS_TREND = 10

/** app parity: storesApi.js isSubscriptionLive. */
function isLive(s: Subscription): boolean {
  if (String(s?.status ?? '').toLowerCase() !== 'active') return false
  const now = Date.now()
  const starts = s.starts_at ? Date.parse(s.starts_at) : NaN
  const ends = s.expires_at ? Date.parse(s.expires_at) : NaN
  if (Number.isFinite(starts) && starts > now) return false
  if (Number.isFinite(ends) && ends < now) return false
  return true
}

/** app parity: merchantCapabilities.js bookingType — anything but "request" books instantly. */
function bookingType(e: ChipSource): 'instant' | 'request' {
  return String(e.booking_service_type ?? 'instant').trim().toLowerCase() === 'request' ? 'request' : 'instant'
}

function hasAnyOffer(e: ChipSource): boolean {
  return !!(e.has_offer || e.offer_badge?.trim() || (e.store_offers?.length ?? 0) > 0)
}

/** app parity: CardChips.jsx getCardChips — the chips in priority order, at most `max`. */
export function getCardChips(e: ChipSource | null | undefined, max = MAX_CHIPS): CardChipKey[] {
  if (!e) return []
  const chips: CardChipKey[] = []
  const rating = Number(e.rating) || 0
  const reviews = Number(e.rating_count) || 0
  const merchant = String(e.merchant_type ?? '').toLowerCase()
  const isStore = e.store_type != null
  const advertised = e.is_advertised === true

  if ((merchant === 'preferred' || advertised) && (isStore || rating >= 4.0)) chips.push('recommended')
  if (rating >= 4.7 && reviews >= MIN_REVIEWS_TREND) chips.push('trending')
  if (rating >= 4.5 && reviews >= MIN_REVIEWS_HIGH) chips.push('highly-rated')

  const stamps =
    e.repeat_rewards_enabled === true ||
    (e.store_subscriptions ?? []).some(s => isLive(s) && s.repeat_rewards_enabled === true)
  if (stamps) chips.push('stamp-sheet')

  const bookable = isStore ? String(e.store_type).toUpperCase() === 'SERVICE' && canBook(e) : canBook(e)
  if (isPaidMerchant(e) && bookable && bookingType(e) === 'instant') chips.push('instant-booking')

  if (hasAnyOffer(e)) chips.push('best-value')

  if ((Number(e.saved_count) || 0) >= 25) chips.push('most-saved')

  return chips.slice(0, max)
}
