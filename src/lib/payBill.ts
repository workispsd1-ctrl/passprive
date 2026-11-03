/**
 * Pay-bill offer maths — app parity: utils/unifiedOffers.js
 * (normalize*BillOffer, mergeBillOffers, calculateOfferApplication) and the
 * selection rules in screens/PayBillScreen.jsx. Kept 1:1 with the app so the
 * amount sent to the gateway matches what the payments backend recomputes.
 */

export type BillOfferSource = 'MERCHANT' | 'BANK' | 'PLATFORM'

export type BillOffer = {
  id: string
  source: BillOfferSource
  title: string
  sub: string
  badgeText: string
  sponsorName: string
  logo: string | null
  benefitType: 'percent' | 'flat' | 'cashback'
  value: number
  minBillAmount: number
  maxBillAmount: number
  maxDiscount?: number
  priority: number
  /** from the `offers` table — only these ids are sent as selected_offer_ids */
  fromOffersTable: boolean
}

export type AppliedOffer = { id: string; title: string; amount: number; cashbackAmount: number }

/** `offers` row, as the app selects it */
export type OffersTableRow = {
  id: string
  source_type: string | null
  owner_entity_type: string | null
  owner_entity_id: string | null
  module: string | null
  payment_flow: string | null
  title: string | null
  subtitle: string | null
  description: string | null
  badge_text: string | null
  logo_url: string | null
  offer_type: string | null
  benefit_value: number | null
  benefit_percent: number | null
  max_discount_amount: number | null
  min_bill_amount: number | null
  max_bill_amount: number | null
  priority: number | null
  starts_at: string | null
  ends_at: string | null
  sponsor_name: string | null
}

/** `restaurant_offers` row */
export type RestaurantOfferRow = {
  id: string
  title: string | null
  description: string | null
  badge_text: string | null
  offer_type: string | null
  discount_value: number | null
  min_spend: number | null
  metadata?: Record<string, unknown> | null
}

const num = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
const text = (v: unknown) => String(v ?? '').trim()
const upper = (v: unknown) => text(v).toUpperCase().replace(/[\s-]+/g, '_')

export function isBankSource(v: unknown) {
  const s = upper(v)
  return s === 'BANK' || s.includes('BANK_') || s.includes('_BANK')
}
export function isPlatformSource(v: unknown) {
  const s = upper(v)
  return s === 'PLATFORM' || s.includes('PLATFORM') || s === 'PASSPRIVE' || s === 'PASS_PRIVE' || s.includes('PASSPRIVE')
}

function benefitFromText(value: string, fallback: BillOffer['benefitType']): { type: BillOffer['benefitType']; value: number } {
  const pct = value.match(/(\d+(?:\.\d+)?)\s*%/i)
  if (pct) return { type: fallback === 'cashback' ? 'cashback' : 'percent', value: num(pct[1]) }
  const mur = value.match(/(?:MUR|Rs\.?)\s*(\d+(?:\.\d+)?)/i) || value.match(/(\d+(?:\.\d+)?)\s*(?:MUR|Rs\.?)/i)
  if (mur) return { type: fallback, value: num(mur[1]) }
  return { type: fallback, value: 0 }
}

/** app: normalizeUnifiedBillOffer + extractNumericBenefit */
function fromOffersTable(o: OffersTableRow): BillOffer {
  const kind = upper(o.offer_type)
  let benefit: { type: BillOffer['benefitType']; value: number }
  if (num(o.benefit_percent) > 0) benefit = { type: 'percent', value: num(o.benefit_percent) }
  else if (num(o.benefit_value) > 0) {
    benefit = { type: kind.includes('PERCENT') ? 'percent' : kind === 'CASHBACK' ? 'cashback' : 'flat', value: num(o.benefit_value) }
  } else {
    benefit = benefitFromText([o.title, o.subtitle, o.description, o.badge_text].map(text).filter(Boolean).join(' '), kind === 'CASHBACK' ? 'cashback' : 'flat')
  }
  const source: BillOfferSource = isBankSource(o.source_type) ? 'BANK' : isPlatformSource(o.source_type) ? 'PLATFORM' : 'MERCHANT'
  return {
    id: text(o.id) || text(o.title),
    source,
    title: text(o.title) || text(o.badge_text) || 'Offer',
    sub: text(o.description) || text(o.subtitle) || 'Available on this bill',
    badgeText: text(o.badge_text),
    sponsorName: text(o.sponsor_name),
    logo: o.logo_url || null,
    benefitType: benefit.type,
    value: benefit.value,
    minBillAmount: num(o.min_bill_amount),
    maxBillAmount: num(o.max_bill_amount),
    maxDiscount: num(o.max_discount_amount) || undefined,
    priority: o.priority == null ? 100 : Number(o.priority),
    fromOffersTable: true,
  }
}

/** app: normalizeLegacyBillOffer — the restaurant's own offers */
function fromRestaurantOffer(o: RestaurantOfferRow): BillOffer {
  const kind = upper(o.offer_type)
  const type: BillOffer['benefitType'] = kind.includes('PERCENT') ? 'percent' : kind === 'CASHBACK' ? 'cashback' : 'flat'
  const title = text(o.title) || 'Offer'
  const sub = text(o.description) || 'Available on this bill'
  const benefit = num(o.discount_value) > 0 ? { type, value: num(o.discount_value) } : benefitFromText(`${title} ${sub}`, type)
  return {
    id: text(o.id) || title,
    source: 'MERCHANT',
    title,
    sub,
    badgeText: text(o.badge_text),
    sponsorName: '',
    logo: null,
    benefitType: benefit.type,
    value: benefit.value,
    minBillAmount: num(o.min_spend),
    maxBillAmount: 0,
    priority: 100,
    fromOffersTable: false,
  }
}

function activeNow(o: { starts_at: string | null; ends_at: string | null }, now: number) {
  const start = o.starts_at ? Date.parse(o.starts_at) : NaN
  const end = o.ends_at ? Date.parse(o.ends_at) : NaN
  return !(Number.isFinite(start) && now < start) && !(Number.isFinite(end) && now > end)
}

/**
 * The bill's offers — PayBillScreen: the restaurant's own offers merged with
 * live `offers` rows that apply to bill payments here (its MERCHANT offers,
 * plus every BANK / PLATFORM offer). Deduped on id + title, best priority first.
 */
export function billOffers(restaurantId: string, own: RestaurantOfferRow[], table: OffersTableRow[], now = Date.now()): BillOffer[] {
  const scoped = table.filter(o => {
    if (!activeNow(o, now)) return false
    const mod = upper(o.module)
    if (mod && !['BOTH', 'ALL', 'ANY', 'RESTAURANT', 'DINING'].includes(mod)) return false
    const flow = upper(o.payment_flow)
    if (flow && flow !== 'ANY' && flow !== 'BILL_PAYMENT' && flow !== 'PAY_BILL') return false
    if (isBankSource(o.source_type) || isPlatformSource(o.source_type)) return true
    return upper(o.source_type) === 'MERCHANT' && upper(o.owner_entity_type) === 'RESTAURANT' && text(o.owner_entity_id) === restaurantId
  })
  // deduped on title too, as BillSummaryScreen does
  const seen = new Set<string>()
  return [...own.map(fromRestaurantOffer), ...scoped.map(fromOffersTable)]
    .filter(o => o.value > 0)
    .filter(o => {
      const key = o.title.toLowerCase()
      if (seen.has(o.id) || seen.has(key)) return false
      seen.add(o.id)
      seen.add(key)
      return true
    })
    .sort((a, b) => a.priority - b.priority)
}

/** PayBillScreen primaryOfferCard — the first merchant offer, else the first of any kind. */
export function primaryOffer(offers: BillOffer[]): BillOffer | null {
  return offers.find(o => o.source === 'MERCHANT') ?? offers[0] ?? null
}

/** "Min bill MUR 1,000" / "Up to MUR 2,000" when this amount is outside the offer's range, else ''. */
export function offerRangeNote(o: BillOffer, amount: number): string {
  if (o.minBillAmount > 0 && amount < o.minBillAmount) return `Min bill MUR ${fmtMur(o.minBillAmount)}`
  if (o.maxBillAmount > 0 && amount > o.maxBillAmount) return `Up to MUR ${fmtMur(o.maxBillAmount)}`
  return ''
}

/**
 * BillSummaryScreen offerState — only a merchant offer in range can be applied;
 * bank and platform offers are applied at payment.
 */
export function couponState(o: BillOffer, amount: number): { state: 'apply' | 'locked'; note: string } {
  if (o.source !== 'MERCHANT') return { state: 'locked', note: 'Applied at payment' }
  const note = offerRangeNote(o, amount)
  return note ? { state: 'locked', note } : { state: 'apply', note: '' }
}

/**
 * BillSummaryScreen selectedOfferId — the member's choice (`null` = none); with
 * no choice made yet, the offer is picked only when exactly one can apply.
 */
export function selectedCoupon(offers: BillOffer[], amount: number, choice: string | null | undefined): BillOffer | null {
  const applicable = offers.filter(o => couponState(o, amount).state === 'apply')
  const id = choice === undefined ? (applicable.length === 1 ? applicable[0].id : null) : choice
  return applicable.find(o => o.id === id) ?? null
}

/**
 * A member keeps only their tier's share of a merchant's upfront discount
 * (membership_discount_caps) — the payments backend applies the same share.
 */
export function shareOffer(offer: BillOffer, sharePct: number): BillOffer {
  if (!(sharePct >= 0) || sharePct >= 100 || offer.source !== 'MERCHANT' || offer.benefitType === 'cashback') return offer
  return { ...offer, value: (offer.value * sharePct) / 100 }
}

/** app: calculateOfferApplication */
export function applyOffers(billAmount: number, offers: BillOffer[]) {
  const base = Math.max(0, num(billAmount))
  let running = base
  let discount = 0
  let cashback = 0
  const applied: AppliedOffer[] = []
  for (const o of [...offers].sort((a, b) => a.priority - b.priority)) {
    if (o.minBillAmount > 0 && base < o.minBillAmount) continue
    if (o.maxBillAmount > 0 && base > o.maxBillAmount) continue
    if (o.benefitType === 'cashback') {
      let value = 0
      if (o.value > 0) {
        value = o.maxDiscount != null ? Math.min((running * o.value) / 100, o.maxDiscount) : (running * o.value) / 100
        if (o.maxDiscount == null && o.value > running) value = Math.min(running, o.value)
      }
      cashback += Math.max(0, value)
      applied.push({ id: o.id, title: o.title, amount: 0, cashbackAmount: value })
      continue
    }
    let amount = o.benefitType === 'percent' ? (running * o.value) / 100 : Math.min(running, o.value)
    if (o.benefitType === 'percent' && o.maxDiscount) amount = Math.min(amount, o.maxDiscount)
    amount = Math.min(running, Math.max(0, amount))
    running = Math.max(0, running - amount)
    discount += amount
    applied.push({ id: o.id, title: o.title, amount, cashbackAmount: 0 })
  }
  return { finalAmount: running, discount, cashback, applied }
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * What the member pays — app parity: BillSummaryScreen. Privé Credits can't
 * cover the whole bill (at least MUR 1 goes on the card), and are capped by
 * the balance and by what the burn rules allow now (`burnCap`).
 */
export function billTotals({ amount, discount, balance, burnCap, useCredits, upgradeAmount = 0 }: {
  amount: number
  discount: number
  balance: number
  burnCap: number
  useCredits: boolean
  /** a membership added to the bill (paid first, then the member returns to the bill) */
  upgradeAmount?: number
}) {
  const payableBeforeCredits = Math.max(0, amount - discount + upgradeAmount)
  const maxCreditSpend = Math.max(0, round2(payableBeforeCredits - 1))
  const creditsUsable = balance > 0 && maxCreditSpend > 0 && burnCap > 0
  const creditsApplied = useCredits && creditsUsable ? round2(Math.max(0, Math.min(balance, maxCreditSpend, burnCap))) : 0
  return { payableBeforeCredits, creditsUsable, creditsApplied, toPay: round2(payableBeforeCredits - creditsApplied) }
}

/** app: BillSummaryScreen offerHeadline — the badge, else the benefit. */
export function offerHeadline(o: BillOffer) {
  if (o.badgeText) return o.badgeText
  if (!(o.value > 0)) return 'Offer'
  if (o.benefitType === 'percent') return `${o.value}% OFF`
  if (o.benefitType === 'cashback') return `${o.value}% CASHBACK`
  return `MUR ${fmtMur(o.value)} OFF`
}

export const MAX_BILL_DIGITS = 7

export function fmtMur(n: number) {
  const v = Math.round(Number(n || 0) * 100) / 100
  return v.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

/** Points-burn rules for "Use Privé Credits" — app: fetchPointsBurnQuote */
export type BurnQuote = { balance: number; burnableNow: number; blockMessage: string }

/** `/api/pay-bill/quote` */
export type BillQuote = {
  loggedIn: boolean
  /** membership cashback on this bill (cashback_quote) */
  cashback: number
  repeatReward: { tierId: string | number | null; discount: number; label: string } | null
  burn: BurnQuote | null
  balance: number
}

/** sessionStorage — what the return page needs to draw the receipt */
export type PendingBillPayment = {
  sessionId: string
  merchantTrace: string
  restaurantId: string
  restaurantName: string
  location: string
  originalAmount: number
  discount: number
  paidAmount: number
  cashback: number
  /** Order & Collect — what was ordered; the receipt is "Order placed" */
  orderItems?: { id: string; name: string; price: number; qty: number }[]
}
export const PENDING_BILL_KEY = 'pp_bill_payment_session'
/** sessionStorage — the bill to reopen after buying a membership from its summary */
export const PAY_BILL_RESUME_KEY = 'pp_bill_resume'
