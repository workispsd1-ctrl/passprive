import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { BillQuote } from '@/lib/payBill'

const n = (v: unknown) => {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}
const first = <T,>(data: unknown): T | null => ((Array.isArray(data) ? data[0] : data) ?? null) as T | null

/**
 * Live numbers for a bill — app parity: PayBillScreen's `cashback_quote` and
 * `repeat_reward_quote` RPCs and BillSummaryScreen's `points_burn_quote`.
 * Each is best-effort: a failed RPC just leaves its part empty.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const restaurantId = url.searchParams.get('restaurant_id') ?? ''
  const amount = n(url.searchParams.get('amount'))
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const quote: BillQuote = { loggedIn: !!user, cashback: 0, repeatReward: null, burn: null, balance: 0 }
  if (!restaurantId || !(amount > 0)) return NextResponse.json(quote)

  const args = { in_restaurant_id: restaurantId, in_user_id: user?.id ?? null, in_bill_amount: amount }
  const [cashback, repeat, burn] = await Promise.allSettled([
    supabase.rpc('cashback_quote', args),
    user ? supabase.rpc('repeat_reward_quote', args) : Promise.resolve({ data: null, error: null }),
    user ? supabase.rpc('points_burn_quote', { p_bill_amount: amount }) : Promise.resolve({ data: null, error: null }),
  ])

  if (cashback.status === 'fulfilled' && !cashback.value.error) {
    const row = first<{ applicable?: boolean; cashback_amount?: number }>(cashback.value.data)
    if (row?.applicable) quote.cashback = n(row.cashback_amount)
  }
  if (repeat.status === 'fulfilled' && !repeat.value.error) {
    const row = first<{ applicable?: boolean; tier_id?: string | number; discount_amount?: number; label?: string; tier_name?: string }>(repeat.value.data)
    if (row?.applicable && n(row.discount_amount) > 0) {
      quote.repeatReward = { tierId: row.tier_id ?? null, discount: n(row.discount_amount), label: row.label || row.tier_name || 'Repeat visit reward' }
    }
  }
  if (burn.status === 'fulfilled' && !burn.value.error) {
    const row = first<{ balance?: number; burnable_now?: number; block_message?: string }>(burn.value.data)
    if (row) {
      quote.burn = { balance: n(row.balance), burnableNow: n(row.burnable_now), blockMessage: row.block_message || '' }
      quote.balance = n(row.balance)
    }
  }

  return NextResponse.json(quote)
}
