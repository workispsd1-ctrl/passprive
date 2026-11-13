/**
 * Deal Reveal — ported from the app's `utils/dealReveals.js` +
 * `utils/merchantOffers.js`. Pure helpers shared by the API routes (which do
 * the Supabase reads/RPCs with the visitor's cookies) and the client UI.
 *
 * A merchant page shows two kinds of revealable items:
 *  - `deal`: a `restaurant_deals` row with a benefit for the viewer's tier
 *    (`restaurant_deal_tiers`), counted against the monthly reveal quota;
 *  - `restaurant_offer` / `store_offer`: a live merchant offer.
 * Redeeming either goes through the `redeem_*` RPCs (merchant PIN or NFC tag).
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MAURITIUS_OFFSET_MS = 4 * 60 * 60 * 1000

/** `deal_reveal_quota` row. `monthly_limit` null = unlimited. */
export type DealQuota = {
  tier: string | null
  period_start: string | null
  period_end: string | null
  monthly_limit: number | null
  monthly_used: number | null
  monthly_remaining?: number | null
  per_restaurant_limit: number | null
}

export type DealTierRow = {
  tier: string | null
  benefit_percent: number | null
  benefit_amount: number | null
  deal_price: number | null
  buy_quantity: number | null
  get_quantity: number | null
  free_item_label: string | null
  is_active: boolean | null
}

/** What the reveal card, terms sheet and redeem sheet need from a deal or offer. */
export type DealTerms = {
  starts_at?: string | null
  ends_at?: string | null
  start_time?: string | null
  end_time?: string | null
  terms?: string[] | null
}

export type RestaurantDeal = DealTerms & {
  id: string
  title: string | null
  description: string | null
  badge_text: string | null
  deal_type: string | null
  currency_code: string | null
  priority: number | null
  restaurant_deal_tiers?: DealTierRow[] | null
  tierRow?: DealTierRow
}

export type MerchantOffer = {
  id: string
  title: string | null
  description?: string | null
  badge_text: string | null
  offer_type: string | null
  discount_value: number | null
  min_spend?: number | null
  start_at?: string | null
  end_at?: string | null
  is_active?: boolean | null
  metadata?: Record<string, unknown> | null
}

export type RevealKind = 'deal' | 'restaurant_offer' | 'store_offer'

export type RevealItem = {
  key: string
  kind: RevealKind
  id: string
  benefit: string
  /** used to rank items best-first (≈ the saving on a MUR 1,000 bill) */
  score: number
  terms: DealTerms
  /** the ticket stub's "UP TO 5%" — the best any tier gets (app: dealUpToLabel) */
  upTo?: string
  /** a percentage deal: revealed through `reveal_deal_percent` (app: isPercentDealItem) */
  percent?: boolean
  /** each plan's ceiling for this deal, e.g. { free: 2.5, plus: 5, black: 10 } (app: dealTierCaps) */
  caps?: Partial<Record<string, number>>
}

/** `redeem_precheck` / `redeem_with_pin` / `redeem_with_nfc` row. */
export type RedeemResult = {
  allowed: boolean
  reason?: string | null
  monthly_used?: number | null
  locked_until?: string | null
  attempts_left?: number | null
  confirmation_code?: string | null
}

// ── dates (deal windows are Mauritius wall-clock) ─────────────────────────

function mauritiusDate(value: string | null | undefined): Date | null {
  const raw = String(value ?? '').trim().replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00')
  const parsed = Date.parse(raw)
  return Number.isFinite(parsed) ? new Date(parsed + MAURITIUS_OFFSET_MS) : null
}

export function isDealLive(deal: DealTerms, now = Date.now()): boolean {
  const start = mauritiusDate(deal.starts_at)
  const end = mauritiusDate(deal.ends_at)
  if (start && now < start.getTime() - MAURITIUS_OFFSET_MS) return false
  if (end && now > end.getTime() - MAURITIUS_OFFSET_MS) return false
  return true
}

export function isOfferLive(offer: MerchantOffer, now = Date.now()): boolean {
  if (offer.is_active === false) return false
  if (offer.start_at && Date.parse(offer.start_at) > now) return false
  if (offer.end_at && Date.parse(offer.end_at) < now) return false
  return true
}

/** "Resets on 1 Nov" */
export function resetLabel(periodEnd: string | null | undefined): string {
  const d = mauritiusDate(periodEnd)
  return d ? `Resets on ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}` : ''
}

/** "1 November 2026" */
export function resetDateSentence(periodEnd: string | null | undefined): string {
  const d = mauritiusDate(periodEnd)
  return d ? `${d.getUTCDate()} ${MONTHS_FULL[d.getUTCMonth()]} ${d.getUTCFullYear()}` : ''
}

/** "1 October to 31 October 2026" */
export function dealWindowSentence(startsAt: string | null | undefined, endsAt: string | null | undefined): string {
  const start = mauritiusDate(startsAt)
  const end = mauritiusDate(endsAt)
  if (start && end) {
    return `${start.getUTCDate()} ${MONTHS_FULL[start.getUTCMonth()]} to ${end.getUTCDate()} ${MONTHS_FULL[end.getUTCMonth()]} ${end.getUTCFullYear()}`
  }
  const only = end ?? start
  return only ? `${only.getUTCDate()} ${MONTHS_FULL[only.getUTCMonth()]} ${only.getUTCFullYear()}` : ''
}

function shortClock(value: string | null | undefined): string {
  const m = String(value ?? '').match(/^(\d{1,2}):(\d{2})/)
  if (!m) return ''
  const hours = Number(m[1])
  const minutes = Number(m[2])
  const suffix = hours >= 12 ? 'pm' : 'am'
  const h12 = hours % 12 || 12
  return minutes ? `${h12}:${String(minutes).padStart(2, '0')}${suffix}` : `${h12}${suffix}`
}

/** Reveal card footer — "1-31 Oct | 12pm-3pm" */
export function dealWindowShort(deal: DealTerms): string {
  const start = mauritiusDate(deal.starts_at)
  const end = mauritiusDate(deal.ends_at)
  let dates = ''
  if (start && end) {
    dates = start.getUTCMonth() === end.getUTCMonth()
      ? `${start.getUTCDate()}-${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]}`
      : `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]}-${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]}`
  } else if (end) {
    dates = `Till ${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]}`
  }
  const from = shortClock(deal.start_time)
  const to = shortClock(deal.end_time)
  return [dates, from && to ? `${from}-${to}` : ''].filter(Boolean).join(' | ')
}

// ── quota ──────────────────────────────────────────────────────────────────

export function isUnlimitedQuota(quota: DealQuota | null): boolean {
  return quota?.monthly_limit == null
}

export function isQuotaExhausted(quota: DealQuota | null): boolean {
  if (!quota || quota.monthly_limit == null) return false
  return (Number(quota.monthly_used) || 0) >= Number(quota.monthly_limit)
}

export function quotaText(quota: DealQuota): string {
  if (isUnlimitedQuota(quota)) return 'Unlimited'
  return `${Number(quota.monthly_used) || 0}/${quota.monthly_limit}`
}

export function quotaFraction(quota: DealQuota): number {
  const limit = Number(quota.monthly_limit)
  if (!Number.isFinite(limit) || limit <= 0) return 0
  return Math.max(0, Math.min(1, (Number(quota.monthly_used) || 0) / limit))
}

export function unlocksLeftLabel(quota: DealQuota): string {
  if (isUnlimitedQuota(quota)) return 'Unlimited unlocks this month'
  const left = Math.max(0, (Number(quota.monthly_limit) || 0) - (Number(quota.monthly_used) || 0))
  if (left === 0) return 'No unlocks left'
  return `${left} ${left === 1 ? 'unlock' : 'unlocks'} left this month`
}

// ── benefits & ranking ─────────────────────────────────────────────────────

const VISIT_TITLE = /\bon\s+\d+(st|nd|rd|th)\s+visit\b/i
const REFERENCE_BILL = 1000

/** Stamp-card "on 5th visit" offers belong to repeat rewards, not deal reveal. */
export function isRepeatRewardOffer(offer: Pick<MerchantOffer, 'metadata' | 'offer_type' | 'title'>): boolean {
  if (String((offer.metadata as { offerKind?: string } | null)?.offerKind ?? '').toUpperCase() === 'VISIT') return true
  return String(offer.offer_type ?? '').toLowerCase() === 'custom' && VISIT_TITLE.test(String(offer.title ?? ''))
}

function trimNumber(value: unknown): string {
  const n = Number(value)
  return Number.isFinite(n) ? String(Number(n.toFixed(2))) : ''
}

/** App parity: merchantOffers.js offerValue — the saving on a MUR 1,000 bill. */
function benefitScore(tier: Partial<DealTierRow> | undefined, type: string, discount: unknown): number {
  const pct = Number(tier?.benefit_percent ?? (type.startsWith('percent') ? discount : NaN))
  if (Number.isFinite(pct) && pct > 0) return (REFERENCE_BILL * pct) / 100
  const flat = Number(tier?.benefit_amount ?? (type === 'flat' ? discount : NaN))
  return Number.isFinite(flat) && flat > 0 ? flat : 0
}

export function dealBenefitLabel(deal: RestaurantDeal): string {
  const t = deal.tierRow ?? ({} as Partial<DealTierRow>)
  const code = String(deal.currency_code ?? 'MUR').toUpperCase()
  const currency = code === 'MUR' ? 'MUR' : code
  switch (String(deal.deal_type ?? '').toLowerCase()) {
    case 'percentage':
      return t.benefit_percent == null ? '' : `${trimNumber(t.benefit_percent)}% OFF`
    case 'flat':
      return t.benefit_amount == null ? '' : `${currency} ${trimNumber(t.benefit_amount)} OFF`
    case 'fixed_price':
      return t.deal_price == null ? '' : `${currency} ${trimNumber(t.deal_price)} DEAL`
    case 'bogo':
      return t.buy_quantity && t.get_quantity ? `BUY ${t.buy_quantity} GET ${t.get_quantity}` : ''
    case 'free_item':
      return t.free_item_label ? `FREE ${String(t.free_item_label).toUpperCase()}` : ''
    default:
      return ''
  }
}

/** "5%" / "MUR 300" — the best benefit across a deal's active tiers. App parity: dealReveals.js dealUpToLabel. */
export function dealUpToLabel(deal: RestaurantDeal): string {
  const tiers = (deal.restaurant_deal_tiers ?? []).filter(row => row?.is_active !== false)
  const best = (key: 'benefit_percent' | 'benefit_amount') => Math.max(0, ...tiers.map(row => Number(row?.[key]) || 0))
  switch (String(deal.deal_type ?? '').toLowerCase()) {
    case 'percentage':
      return best('benefit_percent') > 0 ? `${trimNumber(best('benefit_percent'))}%` : ''
    case 'flat':
      return best('benefit_amount') > 0 ? `MUR ${trimNumber(best('benefit_amount'))}` : ''
    default:
      return ''
  }
}

/** dealUpToLabel for a merchant offer (no tiers): its own value. */
function offerUpToLabel(offer: MerchantOffer): string {
  const value = Number(offer.discount_value)
  if (!Number.isFinite(value) || value <= 0) return ''
  const type = String(offer.offer_type ?? '').toLowerCase()
  if (type === 'percentage' || type === 'percent') return `${trimNumber(value)}%`
  return type === 'flat' ? `MUR ${trimNumber(value)}` : ''
}

export function offerBenefitLabel(offer: MerchantOffer): string {
  const value = Number(offer.discount_value)
  const type = String(offer.offer_type ?? '').toLowerCase()
  if (Number.isFinite(value) && value > 0) {
    if (type === 'percentage' || type === 'percent') return `${trimNumber(value)}% OFF`
    if (type === 'flat') return `MUR ${trimNumber(value)} OFF`
  }
  return String(offer.badge_text || offer.title || '').trim()
}

type StripOffer = {
  badge_text?: string | null
  offer_type?: string | null
  discount_value?: number | null
  title?: string | null
  metadata?: Record<string, unknown> | null
}

/** The most an offer can give — Black's percent when the merchant set tier percents (app: offerFullCap). */
function offerFullCap(offer: StripOffer): { percent: number } | { amount: number } | null {
  const type = String(offer.offer_type ?? '').toLowerCase()
  const value = Number(offer.discount_value)
  if (!Number.isFinite(value) || value <= 0) return null
  if (type === 'flat') return { amount: value }
  if (!type.startsWith('percent')) return null
  const black = Number((offer.metadata?.tier_percents as Record<string, unknown> | undefined)?.black)
  return { percent: Number.isFinite(black) && black > 0 && black <= 100 ? black : value }
}

/**
 * Card offer strip text — app parity: merchantOffers.js offerStripText (app
 * fbaf070): "Up to 20% OFF" / "Up to MUR 100 OFF", else the badge, else the title.
 */
export function offerStripText(offer: StripOffer): string {
  const cap = offerFullCap(offer)
  if (cap && 'percent' in cap) return `Up to ${trimNumber(cap.percent)}% OFF`
  if (cap) return `Up to MUR ${trimNumber(cap.amount)} OFF`
  const badge = String(offer.badge_text ?? '').trim()
  if (badge) return badge
  return String(offer.title ?? '').trim()
}

/** A card's strip: the first offer's text, "+ N offers" when there are more. */
export function cardOfferText(offers: StripOffer[] | null | undefined, withCount = false): string | undefined {
  const first = offers?.[0]
  const text = first ? offerStripText(first) : ''
  if (!text) return undefined
  const extra = (offers?.length ?? 0) - 1
  return withCount && extra > 0 ? `${text} + ${extra} offers` : text
}

/** Live deals that carry a benefit for this membership tier, tier row attached. */
export function pickDealsForTier(rows: RestaurantDeal[], tier: string | null | undefined): RestaurantDeal[] {
  const slug = String(tier ?? '').trim().toLowerCase()
  if (!slug) return []
  return rows.flatMap(deal => {
    if (!isDealLive(deal)) return []
    const tierRow = (deal.restaurant_deal_tiers ?? []).find(
      r => r.is_active !== false && String(r.tier ?? '').toLowerCase() === slug,
    )
    return tierRow ? [{ ...deal, tierRow }] : []
  })
}

/** "premiere" (the Plus plan's key) → "plus" — app parity: dealReveals.js planTierSlug. */
export function planTierSlug(plan: string | null | undefined): string | null {
  const slug = String(plan ?? '').trim().toLowerCase()
  return slug === 'premiere' ? 'plus' : slug || null
}

/** "7.5%" — app parity: DealRevealCard.jsx formatPercent. */
export function formatPercent(value: number): string {
  return `${Number(Number(value).toFixed(2))}%`
}

function isPercentType(type: string | null | undefined): boolean {
  const t = String(type ?? '').toLowerCase()
  return t === 'percentage' || t === 'percent'
}

/** A deal's per-plan percent ceilings — app parity: dealReveals.js dealTierCaps (kind 'deal'). */
export function dealTierCaps(deal: RestaurantDeal): Partial<Record<string, number>> {
  const caps: Partial<Record<string, number>> = {}
  for (const row of deal.restaurant_deal_tiers ?? []) {
    const value = Number(row?.benefit_percent)
    if (row?.is_active !== false && value > 0) caps[String(row.tier).toLowerCase()] = value
  }
  return caps
}

/**
 * An offer's per-plan percent ceilings — app parity: dealReveals.js
 * dealTierCaps: `metadata.tier_percents` when set, else a quarter / half / all
 * of the offer's discount for Free / Plus / Black.
 */
export function offerTierCaps(offer: Pick<MerchantOffer, 'discount_value' | 'metadata'>): Partial<Record<string, number>> {
  const caps: Partial<Record<string, number>> = {}
  const set = offer.metadata?.tier_percents
  if (set && typeof set === 'object') {
    for (const [tier, raw] of Object.entries(set as Record<string, unknown>)) {
      const value = Number(raw)
      if (value > 0 && value <= 100) caps[tier] = value
    }
    if (Object.keys(caps).length) return caps
  }
  const value = Number(offer.discount_value)
  if (!(value > 0)) return caps
  return { free: Number((value / 4).toFixed(2)), plus: Number((value / 2).toFixed(2)), black: value }
}

export function dealItem(deal: RestaurantDeal): RevealItem | null {
  const benefit = dealBenefitLabel(deal)
  if (!benefit) return null
  return {
    key: `deal:${deal.id}`,
    kind: 'deal',
    id: deal.id,
    benefit,
    score: benefitScore(deal.tierRow, String(deal.deal_type ?? '').toLowerCase(), null),
    upTo: dealUpToLabel(deal),
    percent: String(deal.deal_type ?? '').toLowerCase() === 'percentage',
    caps: dealTierCaps(deal),
    terms: {
      starts_at: deal.starts_at,
      ends_at: deal.ends_at,
      start_time: deal.start_time,
      end_time: deal.end_time,
      terms: Array.isArray(deal.terms) ? deal.terms : [],
    },
  }
}

export function offerItem(offer: MerchantOffer, kind: 'restaurant_offer' | 'store_offer'): RevealItem | null {
  if (!isOfferLive(offer) || isRepeatRewardOffer(offer)) return null
  const benefit = offerBenefitLabel(offer)
  if (!benefit) return null
  return {
    key: `${kind}:${offer.id}`,
    kind,
    id: offer.id,
    benefit,
    score: benefitScore(undefined, String(offer.offer_type ?? '').toLowerCase(), offer.discount_value),
    upTo: offerUpToLabel(offer),
    percent: isPercentType(offer.offer_type),
    caps: offerTierCaps(offer),
    terms: {
      starts_at: offer.start_at,
      ends_at: offer.end_at,
      terms: offer.description ? [offer.description] : [],
    },
  }
}

/**
 * What a reveal ticket shows — app parity: DealRevealCard.jsx `benefit` and
 * `upTo`. Revealed: the percent `reveal_deal_percent` returned. Hidden: the
 * viewed plan's ceiling, else the item's own benefit. The stub's "UP TO" is
 * that plan's ceiling, else the best any tier gets.
 */
export function revealDisplay(item: RevealItem, tier: string | null, revealedPercent: number | null | undefined): { benefit: string; upTo: string } {
  const cap = tier ? Number(item.caps?.[tier]) : NaN
  const hasCap = cap > 0
  const benefit =
    Number(revealedPercent) > 0 ? `${formatPercent(Number(revealedPercent))} OFF` : hasCap ? `${formatPercent(cap)} OFF` : item.benefit
  return { benefit, upTo: hasCap ? formatPercent(cap) : (item.upTo ?? '') }
}

/** Best saving first; ties keep their original order. */
export function bestFirst<T extends { score: number }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => b.item.score - a.item.score || a.index - b.index)
    .map(entry => entry.item)
}

/** "Can't redeem" copy from an RPC reason — sentence-cased with a full stop. */
export function sentence(text: string | null | undefined): string {
  const value = String(text ?? '').trim()
  if (!value) return ''
  const capped = value.charAt(0).toUpperCase() + value.slice(1)
  return /[.!?]$/.test(capped) ? capped : `${capped}.`
}

export const REVEAL_KINDS: RevealKind[] = ['deal', 'restaurant_offer', 'store_offer']
