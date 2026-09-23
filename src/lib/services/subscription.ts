import { createClient } from '@/lib/supabase/server'
import type { SubscriptionPlan, UserMembership } from '@/lib/types/subscription'
import type { CashbackPlan } from '@/lib/cashback'

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subscription')
    .select('id, plan_name, amount, type, cashback, sort_order, product_id, price_id')
    .order('sort_order')
  return (data ?? []) as SubscriptionPlan[]
}

export async function getUserMembership(userId: string): Promise<UserMembership | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('membership_tier, membership_started, membership_expiry, cashback')
    .eq('id', userId)
    .single()
  if (!data) return null

  const isExpired =
    data.membership_expiry != null &&
    new Date(data.membership_expiry) < new Date()

  return {
    membership_tier: isExpired ? 'none' : (data.membership_tier ?? 'none'),
    membership_started: data.membership_started ?? null,
    membership_expiry: data.membership_expiry ?? null,
    cashback_rate: isExpired ? 0.5 : (data.cashback ?? 0.5),
  }
}

/**
 * The viewer's cashback plan bucket — app parity: cashbackBadge.js
 * normalizePlan (tier free-text like "Privé Black" → free/premiere/black).
 * Logged-out visitors and anyone without an active paid tier get 'free'.
 */
export async function getUserPlan(userId: string | undefined | null): Promise<CashbackPlan> {
  if (!userId) return 'free'
  const membership = await getUserMembership(userId)
  const tier = (membership?.membership_tier ?? 'none').toLowerCase()
  if (!tier || tier === 'none') return 'free'
  return tier.includes('black') ? 'black' : 'premiere'
}
