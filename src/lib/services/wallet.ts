import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { WalletBalance, WalletTransaction, UserCashbackInfo } from '@/lib/types/wallet'
import { getUserMembership } from '@/lib/services/subscription'
import { PLAN_TIER } from '@/lib/types/subscription'
import { PREFERRED_PARTNER_RATES, VERIFIED_PAY_RATE } from '@/lib/constants/cashback'
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

export async function getUserCashbackInfo(userId: string, restaurantId?: string): Promise<UserCashbackInfo | null> {
  const supabase = await createClient()

  const [membership, restaurantResult] = await Promise.all([
    getUserMembership(userId),
    restaurantId
      ? supabase.from('restaurants').select('merchant_type').eq('id', restaurantId).single()
      : Promise.resolve({ data: null }),
  ])

  if (!membership) return null

  const rawMerchantType = (restaurantResult.data as { merchant_type?: string | null } | null)?.merchant_type ?? null

  // DB stores 'preferred' | 'verified' | null (lowercase, trimmed)
  const mtype = (rawMerchantType?.toLowerCase().trim() ?? '') as 'preferred' | 'verified' | ''
  const merchantType: 'preferred' | 'verified' | null =
    mtype === 'preferred' ? 'preferred' : mtype === 'verified' ? 'verified' : null

  // Normalize tier: DB may store product ID ('Privé Black', 'black_tier') or canonical ('black')
  const rawTier = membership.membership_tier ?? 'none'
  const normalizedTier = PLAN_TIER[rawTier] ?? rawTier
  const tier: 'free' | 'premium' | 'black' =
    normalizedTier === 'black' ? 'black' : normalizedTier === 'premium' ? 'premium' : 'free'
  const tierLabels: Record<string, string> = {
    free: 'Free',
    premium: 'Privé Premium',
    black: 'Privé Black',
  }

  let cashback_rate = 0
  if (merchantType === 'preferred') {
    cashback_rate = PREFERRED_PARTNER_RATES[tier] ?? membership.cashback_rate ?? VERIFIED_PAY_RATE
  } else if (merchantType === 'verified') {
    cashback_rate = VERIFIED_PAY_RATE
  }

  return {
    applicable: cashback_rate > 0,
    cashback_rate,
    membership_tier: tier,
    tier_label: tierLabels[tier] ?? 'Free',
    merchant_type: merchantType,
  }
}

export async function debitWallet(
  userId: string,
  amount: number,
  restaurantId?: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('gift_balances')
    .select('balance')
    .eq('user_id', userId)
    .single()

  const currentBalance = existing?.balance ?? 0
  if (currentBalance < amount) {
    return { error: 'Insufficient PP Points balance' }
  }

  const { error: txError } = await admin
    .from('gift_transactions')
    .insert({
      user_id: userId,
      amount,
      type: 'payment',
      restaurant_id: restaurantId ?? null,
    })

  if (txError) return { error: txError.message }

  const { error: updateError } = await admin
    .from('gift_balances')
    .update({ balance: currentBalance - amount, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (updateError) return { error: updateError.message }

  return { error: null }
}
