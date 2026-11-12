import { createClient } from '@/lib/supabase/server'
import type { WalletBalance, WalletTransaction } from '@/lib/types/wallet'
import type { LedgerRow, NextExpiry } from '@/lib/pointsLedger'

export async function getWalletBalance(userId: string): Promise<WalletBalance | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('gift_balances')
    .select('balance, updated_at')
    .eq('user_id', userId)
    .single()
  return data ?? null
}

export async function getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('gift_transactions')
    .select('id, amount, type, created_at, restaurant_id, store_id, restaurants(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return ((data ?? []) as unknown[]).map((row) => {
    const r = row as Record<string, unknown>
    return {
      id: r.id as string,
      amount: r.amount as number,
      type: r.type as string,
      created_at: r.created_at as string,
      restaurant_id: r.restaurant_id as string | null,
      store_id: r.store_id as string | null,
      restaurant_name: (r.restaurants as { name?: string } | null)?.name ?? null,
    } satisfies WalletTransaction
  })
}

/**
 * The Privé Credits ledger with per-lot expiry — app parity: WalletScreen /
 * TransactionsScreen → fetchPointsLedger. Null when the RPC isn't reachable,
 * so the page can fall back to the plain gift_transactions history.
 */
export async function getPointsLedger(limit = 200): Promise<LedgerRow[] | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('my_points_ledger', { p_limit: limit })
  if (error || !Array.isArray(data)) return null
  return data as LedgerRow[]
}

/** The soonest credits to expire — app parity: fetchPointsBurnQuote(null).next_expiry_*. */
export async function getNextPointsExpiry(): Promise<NextExpiry | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('points_burn_quote', { p_bill_amount: null })
  if (error) return null
  const row = (Array.isArray(data) ? data[0] : data) as { next_expiry_at?: string | null; next_expiry_amount?: number | string | null } | null
  const amount = Number(row?.next_expiry_amount)
  return row?.next_expiry_at && Number.isFinite(amount) && amount > 0 ? { at: row.next_expiry_at, amount } : null
}
