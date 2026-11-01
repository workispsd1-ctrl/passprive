/**
 * Receipt-upload cashback — ported from the app's `utils/receipts.js`. A
 * member photographs the printed bill from a merchant that doesn't take
 * in-app bill payments; reviewers approve the `receipt_claims` row and the
 * reward lands as Privé Credits. Pure helpers shared by routes and UI.
 */

export const RECEIPT_STATUS = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

export type ReceiptStatus = (typeof RECEIPT_STATUS)[keyof typeof RECEIPT_STATUS]

export type ReceiptClaim = {
  id: string
  status: ReceiptStatus | string
  bill_amount: number | null
  reward_amount: number | null
  reward_percent?: number | null
  submitted_at: string | null
  reviewed_at?: string | null
  rejection_reason: string | null
  restaurant_id: string | null
  store_id: string | null
  purchase_date?: string | null
  image_path?: string | null
}

export type ReceiptMerchant = {
  id: string
  name: string
  cover_image: string | null
  cuisines: string[]
  kind: 'restaurant' | 'store'
}

/** `receipt_reward_quote` — the viewer's receipt reward % here, and Black's. */
export type ReceiptQuote = { tier: string; pct: number; blackPct: number }

export type BlackPlan = {
  plan_name: string | null
  amount: string | number | null
  original_amount: string | number | null
  type: string | null
}

/** jpg/png/heic/webp only — app parity: RECEIPT_TYPES. */
export const RECEIPT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
}
export const RECEIPT_ACCEPT = 'image/jpeg,image/png,image/heic,image/heif,image/webp'
export const RECEIPT_MAX_BYTES = 10 * 1024 * 1024

export const isPendingStatus = (status: string | null | undefined) =>
  status === RECEIPT_STATUS.SUBMITTED || status === RECEIPT_STATUS.UNDER_REVIEW

export function formatPct(pct: number): string {
  return `${Number(pct).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`
}

export function formatMoney(amount: number | string | null | undefined, currency = 'MUR'): string {
  if (amount === null || amount === undefined || amount === '') return ''
  const n = Number(amount)
  return Number.isFinite(n) ? `${currency} ${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : ''
}

/** "12 Oct 2026, 7:30 pm" in Mauritius time. */
export function formatClaimStamp(value: string | null | undefined): string {
  const parsed = Date.parse(String(value ?? '').replace(' ', 'T'))
  if (!Number.isFinite(parsed)) return ''
  return new Date(parsed).toLocaleString('en-GB', {
    timeZone: 'Indian/Mauritius',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/** The status strip on a merchant page — app parity: claimBannerCopy. */
export function claimBannerCopy(claim: ReceiptClaim | null) {
  switch (String(claim?.status ?? '')) {
    case RECEIPT_STATUS.APPROVED:
      return {
        title: 'Receipt approved',
        detail: claim?.reward_amount != null ? `${claim.reward_amount} Privé Credits added` : 'Reward credited',
        tone: 'approved' as const,
      }
    case RECEIPT_STATUS.REJECTED:
      return { title: 'Receipt not verified', detail: claim?.rejection_reason || 'Tap to upload a clearer photo', tone: 'rejected' as const }
    case RECEIPT_STATUS.SUBMITTED:
    case RECEIPT_STATUS.UNDER_REVIEW:
      return { title: 'Receipt under review', detail: 'We’ll update you very soon', tone: 'pending' as const }
    default:
      return null
  }
}

/** Where the upload flow starts for a merchant. */
export function uploadHref(merchantId: string, kind: 'restaurant' | 'store', dealId?: string | null): string {
  const q = new URLSearchParams({ [kind === 'store' ? 'storeId' : 'restaurantId']: merchantId })
  if (dealId) q.set('dealId', dealId)
  return `/receipts/upload?${q.toString()}`
}
