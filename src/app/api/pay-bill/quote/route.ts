import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { BillQuote } from '@/lib/payBill'
import { getStampGate } from '@/lib/services/platformFlags'

const n = (v: unknown) => {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}
const first = <T,>(data: unknown): T | null => ((Array.isArray(data) ? data[0] : data) ?? null) as T | null

/**
 * Live numbers for a bill — app parity: PayBillScreen's `cashback_quote`,
 * `repeat_reward_quote`, `deal_bill_quote` and `bill_deal_offer` RPCs and
 * BillSummaryScreen's `points_burn_quote` and `bill_cover_credit_quote`.
 * Each is best-effort: a failed RPC just leaves its part empty.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const restaurantId = url.searchParams.get('restaurant_id') ?? ''
  // app parity: PayBillScreen runs cashback_quote / repeat_reward_quote for restaurants only
  const storeId = url.searchParams.get('store_id') ?? ''
  const amount = n(url.searchParams.get('amount'))
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const quote: BillQuote = { loggedIn: !!user, cashback: 0, repeatReward: null, burn: null, balance: 0, deal: null, dealOffer: null, coverPaid: 0 }
  if ((!restaurantId && !storeId) || !(amount > 0)) return NextResponse.json(quote)

  const args = { in_restaurant_id: restaurantId, in_user_id: user?.id ?? null, in_bill_amount: amount }
  const none = Promise.resolve({ data: null, error: null })
  // app parity: dealReveals.js fetchDealBillQuote / fetchBillDealOffer — one merchant id, the other null
  const owner = { p_restaurant_id: restaurantId || null, p_store_id: restaurantId ? null : storeId || null }
  // the visit reward is a stamp reward — none while the admin repeat-rewards switch is off for this place
  const stampsOn = restaurantId ? (await getStampGate())(restaurantId) : false
  const [cashback, repeat, burn, deal, dealOffer, cover] = await Promise.allSettled([
    restaurantId ? supabase.rpc('cashback_quote', args) : none,
    user && restaurantId && stampsOn ? supabase.rpc('repeat_reward_quote', args) : none,
    user ? supabase.rpc('points_burn_quote', { p_bill_amount: amount }) : none,
    user ? supabase.rpc('deal_bill_quote', { ...owner, p_bill_amount: amount }) : none,
    user ? supabase.rpc('bill_deal_offer', owner) : none,
    // app parity: BillSummaryScreen — restaurants only
    user && restaurantId ? supabase.rpc('bill_cover_credit_quote', { p_restaurant_id: restaurantId }) : none,
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

  if (deal.status === 'fulfilled' && !deal.value.error) {
    const row = first<{ discount?: number; label?: string; source?: string }>(deal.value.data)
    if (row && n(row.discount) > 0) quote.deal = { discount: n(row.discount), label: row.label || 'Deal', source: row.source ?? null }
  }
  if (dealOffer.status === 'fulfilled' && !dealOffer.value.error) {
    const row = first<{ kind?: string; item_id?: string | number; label?: string; min_spend?: number; from_booking?: boolean }>(dealOffer.value.data)
    if (row?.kind && row.item_id != null) {
      quote.dealOffer = { kind: row.kind, itemId: String(row.item_id), label: row.label || 'Deal', minSpend: n(row.min_spend), fromBooking: !!row.from_booking }
    }
  }
  if (cover.status === 'fulfilled' && !cover.value.error) {
    quote.coverPaid = n(first<{ amount?: number }>(cover.value.data)?.amount)
  }

  return NextResponse.json(quote)
}
