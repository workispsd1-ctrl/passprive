/**
 * Privé Credits ledger — ported from the app's `utils/pointsLedger.js`. Rows
 * come from the `my_points_ledger` RPC: every credit is a "lot" with its own
 * expiry, and spends draw from the soonest-to-expire lots first.
 */

export type LotState = 'active' | 'partly_used' | 'used' | 'expired'

export type LedgerLot = {
  at?: string | null
  amount: number
  type?: string | null
  merchant_name?: string | null
  earned_at?: string | null
  expires_at?: string | null
}

export type LedgerRow = {
  id: string
  type: 'credit' | 'debit' | 'expiry' | string
  source?: string | null
  status?: string | null
  amount: number
  created_at: string
  merchant_name?: string | null
  merchant_area?: string | null
  bill_amount?: number | null
  expires_at?: string | null
  earned_at?: string | null
  remaining?: number | null
  lot_state?: LotState | null
  lots?: LedgerLot[] | null
}

/** `points_burn_quote` — only the next-expiry part is shown on the wallet. */
export type NextExpiry = { at: string; amount: number }

const SOURCE_TITLES: Record<string, string> = {
  receipt: 'Receipt cashback',
  booking: 'Table booking reward',
  bill_payment: 'Bill payment cashback',
  merchant_bonus: 'Merchant bonus',
  bonus: 'Privé Credits bonus',
  treasure_hunt: 'Treasure hunt reward',
  referral: 'Referral reward',
  spend: 'Privé Credits used',
  expiry: 'Privé Credits expired',
}

export const LOT_STATE_STYLE: Record<LotState, { chip: string; text: string; label: string }> = {
  active: { chip: 'bg-[#E8F6EC] text-[#2E8B4A]', text: 'text-[#2E8B4A]', label: 'Active' },
  partly_used: { chip: 'bg-[#FFF3E6] text-[#C46A12]', text: 'text-[#C46A12]', label: 'Partly used' },
  used: { chip: 'bg-[#EEF0F3] text-[#5B6473]', text: 'text-[#5B6473]', label: 'Used' },
  expired: { chip: 'bg-[#FDECEC] text-[#C0392B]', text: 'text-[#C0392B]', label: 'Expired' },
}

export function ledgerTitle(row: LedgerRow): string {
  if (row.type === 'expiry') return SOURCE_TITLES.expiry
  return row.merchant_name || SOURCE_TITLES[row.source ?? ''] || 'Privé Credits'
}

export function ledgerKindLabel(row: LedgerRow): string {
  if (row.type === 'credit') return SOURCE_TITLES[row.source ?? ''] || 'Credited'
  if (row.type === 'expiry') return 'Expired'
  return row.status === 'HELD' ? 'Pending payment' : 'Used on bill'
}

export function formatMuDate(value: string | null | undefined, withYear = false): string {
  const parsed = Date.parse(String(value ?? ''))
  if (!Number.isFinite(parsed)) return ''
  return new Date(parsed).toLocaleDateString('en-GB', {
    timeZone: 'Indian/Mauritius',
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}

export function formatMuDateTime(value: string | null | undefined): string {
  const parsed = Date.parse(String(value ?? ''))
  if (!Number.isFinite(parsed)) return ''
  const d = new Date(parsed)
  const date = d.toLocaleDateString('en-GB', { timeZone: 'Indian/Mauritius', day: 'numeric', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-GB', { timeZone: 'Indian/Mauritius', hour: 'numeric', minute: '2-digit', hour12: true })
  return `${date}, ${time}`
}

export function formatPoints(value: number | null | undefined): string {
  return Math.abs(Number(value) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })
}

/** "Expires on 12 Jan" / "40 left · expires 12 Jan" under a credit. */
export function lotStatusLine(row: LedgerRow): string {
  if (row.type !== 'credit') return row.status === 'HELD' ? 'Pending payment' : ''
  const expires = formatMuDate(row.expires_at)
  switch (row.lot_state) {
    case 'expired':
      return expires ? `Expired on ${expires}` : 'Expired'
    case 'used':
      return 'Fully used'
    case 'partly_used':
      return `${formatPoints(row.remaining)} left · expires ${expires}`
    default:
      return expires ? `Expires on ${expires}` : ''
  }
}
