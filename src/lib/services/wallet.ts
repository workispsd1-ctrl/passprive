import { createClient } from '@/lib/supabase/server'
import type { WalletBalance, WalletTransaction, UserCashbackInfo } from '@/lib/types/wallet'

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
    .select('id, amount, type, created_at, restaurant_id, store_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return (data ?? []) as WalletTransaction[]
}

// Rates at a Preferred Partner — tier determines the reward
const PREFERRED_RATE: Record<string, number> = {
  none: 0.5,
  premium: 2,
  black: 4,
}

// At a Verified Pay Partner (or unclaimed/null), every tier earns the same flat rate
const VERIFIED_PAY_RATE = 0.5

export async function getUserCashbackInfo(userId: string, restaurantId?: string): Promise<UserCashbackInfo | null> {
  const supabase = await createClient()

  const [userResult, restaurantResult] = await Promise.all([
    supabase.from('users').select('cashback, membership_tier').eq('id', userId).single(),
    restaurantId
      ? supabase.from('restaurants').select('merchant_type').eq('id', restaurantId).single()
      : Promise.resolve({ data: null }),
  ])

  if (!userResult.data) return null

  const tier = (userResult.data.membership_tier as string | null) ?? 'none'
  const merchantType = (restaurantResult.data as { merchant_type?: string | null } | null)?.merchant_type ?? null

  // Preferred Partners give tier-based rewards; everyone else gets the flat 0.5%
  const cashback_rate = merchantType === 'preferred_partner'
    ? (PREFERRED_RATE[tier] ?? 0.5)
    : VERIFIED_PAY_RATE

  return { cashback_rate, membership_tier: tier }
}

export async function debitWallet(
  userId: string,
  amount: number,
  restaurantId?: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('gift_balances')
    .select('balance')
    .eq('user_id', userId)
    .single()

  const currentBalance = existing?.balance ?? 0
  if (currentBalance < amount) {
    return { error: 'Insufficient PP Points balance' }
  }

  const { error: txError } = await supabase
    .from('gift_transactions')
    .insert({
      user_id: userId,
      amount,
      type: 'payment',
      restaurant_id: restaurantId ?? null,
    })

  if (txError) return { error: txError.message }

  const { error: updateError } = await supabase
    .from('gift_balances')
    .update({ balance: currentBalance - amount, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (updateError) return { error: updateError.message }

  return { error: null }
}

export async function creditCashback(
  userId: string,
  amount: number,
  restaurantId?: string,
  storeId?: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error: txError } = await supabase
    .from('gift_transactions')
    .insert({
      user_id: userId,
      amount,
      type: 'cashback',
      restaurant_id: restaurantId ?? null,
      store_id: storeId ?? null,
    })

  if (txError) return { error: txError.message }

  const { data: existing } = await supabase
    .from('gift_balances')
    .select('balance')
    .eq('user_id', userId)
    .single()

  if (existing) {
    const { error: updateError } = await supabase
      .from('gift_balances')
      .update({ balance: existing.balance + amount, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
    if (updateError) return { error: updateError.message }
  } else {
    const { error: insertError } = await supabase
      .from('gift_balances')
      .insert({ user_id: userId, balance: amount })
    if (insertError) return { error: insertError.message }
  }

  return { error: null }
}
