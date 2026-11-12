import type { Metadata } from 'next'
import { amountOf, tierOf } from '@/lib/membershipPlans'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { getSubscriptionPlans, getUserMembership } from '@/lib/services/subscription'
import { PLAN_TIER } from '@/lib/types/subscription'
import { CheckoutClient } from './CheckoutClient'

export const metadata: Metadata = { title: 'Checkout | PassPrivé' }

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const { plan } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/membership')

  const [plans, membership] = await Promise.all([
    getSubscriptionPlans(),
    getUserMembership(user.id),
  ])

  // `plan` is a plan id (membership page) or a legacy tier key ('premium' / 'black')
  const selectedPlan = plans.find(p => p.id === plan) ?? plans.find(p => PLAN_TIER[p.product_id] === plan)
  if (!selectedPlan) redirect('/membership')

  // app parity: Membership.jsx canContinue — a paid plan at or above the
  // member's current tier (the same tier adds to the plan, a higher one
  // carries the unused days over); never a downgrade or the free plan.
  const RANK: Record<string, number> = { free: 0, plus: 1, black: 2 }
  const rawTier = (membership?.membership_tier ?? '').trim().toLowerCase()
  const expired = !!membership?.membership_expiry && Date.parse(membership.membership_expiry) <= Date.now()
  const active = !!rawTier && !['none', 'inactive', 'free'].includes(rawTier) && !expired
  const matched = plans.find(p => p.plan_name.trim().toLowerCase() === rawTier)
  const currentTier = !active ? 'free' : matched ? tierOf(matched) : rawTier.includes('black') ? 'black' : 'plus'
  const targetRank = RANK[tierOf(selectedPlan)] ?? 1
  if (targetRank === 0 || amountOf(selectedPlan.amount) <= 0 || targetRank < (RANK[currentTier] ?? 0)) redirect('/membership')

  return (
    <main className="min-h-screen">
      <SetPageTitle title="Checkout" />
      <CheckoutClient plan={selectedPlan} />
    </main>
  )
}
