import { createClient } from '@/lib/supabase/server'
import type { SubscriptionPlan, UserMembership } from '@/lib/types/subscription'

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
