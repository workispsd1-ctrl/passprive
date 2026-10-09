import type { Metadata } from 'next'
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

  // Block repurchasing the same active plan
  const activeTier = (membership?.membership_tier ?? 'none').trim().toLowerCase()
  const selectedTier = PLAN_TIER[selectedPlan.product_id] ?? selectedPlan.plan_name.trim().toLowerCase()
  if (activeTier !== 'none' && (activeTier === selectedTier || activeTier === selectedPlan.plan_name.trim().toLowerCase())) {
    redirect('/membership')
  }

  // Upgrades only: block buying a plan priced at or below the current one
  // (same rule as the membership page — plans rank by yearly price).
  const price = (v: unknown) => Number(String(v ?? '').replace(/[^\d.]/g, '')) || 0
  const currentPlan = activeTier === 'none'
    ? null
    : plans.find(p => p.plan_name.trim().toLowerCase() === activeTier) ??
      plans.find(p => (PLAN_TIER[p.product_id] ?? '') === activeTier) ??
      plans.find(p => p.plan_name.toLowerCase().includes(activeTier))
  if (currentPlan && price(selectedPlan.amount) <= price(currentPlan.amount)) redirect('/membership')

  return (
    <main className="min-h-screen">
      <SetPageTitle title="Checkout" />
      <CheckoutClient plan={selectedPlan} />
    </main>
  )
}
