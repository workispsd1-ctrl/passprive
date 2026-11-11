/**
 * Sample bill maths — app parity: components/SampleBill.jsx (pickBillOffer,
 * sampleBase, pickDeal, computeBill). Offers come in already normalised by
 * `billOffers` (payBill.ts), the same list pay-bill uses.
 */
import { getCashbackPct, hasBillCashback, type CashbackPlan, type MerchantCapabilityFields } from '@/lib/cashback'
import { dealBenefitLabel, pickDealsForTier, type DealTierRow, type RestaurantDeal } from '@/lib/deals'
import type { BillOffer } from '@/lib/payBill'
import type { DiscountCaps } from '@/lib/services/membershipCaps'

export type PickedOffer = { offer: BillOffer; discount: number }
export type PickedDeal = { label: string; discount: number }

export type SampleBill = {
  subtotal: number
  merchant: PickedOffer | null
  bank: PickedOffer | null
  deal: PickedDeal | null
  merchantOff: number
  bankOff: number
  dealOff: number
  youPay: number
  saved: number
  credits: number
}

/** app: pickBillOffer — the single offer that takes the most off this subtotal (after the tier's share). */
function pickBillOffer(offers: BillOffer[], subtotal: number, sharePct = 100): PickedOffer | null {
  let best: PickedOffer | null = null
  for (const offer of offers) {
    if (offer.benefitType === 'cashback') continue
    if (offer.minBillAmount > 0 && subtotal < offer.minBillAmount) continue
    if (!(offer.value > 0)) continue
    const raw = offer.benefitType === 'percent' ? (subtotal * offer.value) / 100 : offer.value
    const cap = offer.maxDiscount && offer.maxDiscount > 0 ? offer.maxDiscount : Infinity
    const gross = Math.min(raw, subtotal, cap)
    const discount = Math.round((gross * sharePct) / 100)
    if (!best || discount > best.discount) best = { offer, discount }
  }
  return best
}

/**
 * app: sampleBase — the bill the estimate starts from: cost for two, unless
 * every offer needs a bigger bill, then the smallest minimum spend.
 */
export function sampleBase(costForTwo: number, merchantOffers: BillOffer[]): number {
  const list = merchantOffers.filter(o => o.value > 0)
  if (!list.length || list.some(o => o.minBillAmount <= costForTwo)) return costForTwo
  return Math.min(...list.map(o => o.minBillAmount))
}

// app: DEAL_TIER — membership plan → restaurant_deal_tiers.tier
const DEAL_TIER: Record<CashbackPlan, string> = { free: 'free', premiere: 'plus', black: 'black' }

/** app: pickDeal — the tier deal worth the most on this bill (flat or percentage deals only). */
function pickDeal(dealRows: RestaurantDeal[], plan: CashbackPlan, subtotal: number): PickedDeal | null {
  let best: PickedDeal | null = null
  for (const deal of pickDealsForTier(dealRows, DEAL_TIER[plan])) {
    const type = String(deal.deal_type ?? '').toLowerCase()
    const row: Partial<DealTierRow> = deal.tierRow ?? {}
    const gross =
      type === 'flat' ? Number(row.benefit_amount) || 0 : type === 'percentage' ? (subtotal * (Number(row.benefit_percent) || 0)) / 100 : 0
    const discount = Math.round(Math.min(gross, subtotal))
    if (discount > 0 && (!best || discount > best.discount)) best = { label: dealBenefitLabel(deal), discount }
  }
  return best
}

/** app: getEntityCashbackPct — 0 when this merchant doesn't pay cashback on bills. */
export function billCashbackPct(merchant: MerchantCapabilityFields, plan: CashbackPlan): number {
  return hasBillCashback(merchant) ? getCashbackPct(merchant, plan) : 0
}

/** app: computeBill */
export function computeSampleBill({
  subtotal,
  merchant,
  offers,
  dealRows,
  plan,
  caps,
}: {
  subtotal: number
  merchant: MerchantCapabilityFields
  offers: BillOffer[]
  dealRows: RestaurantDeal[]
  plan: CashbackPlan
  caps: DiscountCaps
}): SampleBill {
  const merchantPick = pickBillOffer(offers.filter(o => o.source === 'MERCHANT'), subtotal, caps[plan])
  const bankPick = pickBillOffer(offers.filter(o => o.source === 'BANK'), subtotal, 100)
  const deal = pickDeal(dealRows, plan, subtotal)
  const merchantOff = merchantPick?.discount ?? 0
  const bankOff = bankPick?.discount ?? 0
  const dealOff = Math.min(deal?.discount ?? 0, Math.max(0, subtotal - merchantOff - bankOff))
  const youPay = Math.max(0, subtotal - merchantOff - bankOff - dealOff)
  return {
    subtotal,
    merchant: merchantPick,
    bank: bankPick,
    deal,
    merchantOff,
    bankOff,
    dealOff,
    youPay,
    saved: merchantOff + bankOff + dealOff,
    credits: Math.round((youPay * billCashbackPct(merchant, plan)) / 100),
  }
}

/** "Rs 1,370" — the design's money format. */
export const rs = (n: number) => `Rs ${Math.round(Number(n) || 0).toLocaleString('en-US')}`
