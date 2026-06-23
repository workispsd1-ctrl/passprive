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

  const selectedPlan = plans.find(p => PLAN_TIER[p.product_id] === plan)
  if (!selectedPlan) redirect('/membership')

  // Block repurchasing the same active tier
  if (membership?.membership_tier === plan) redirect('/membership')

  return (
    <main className="min-h-screen">
      <SetPageTitle title="Checkout" />
      <CheckoutClient plan={selectedPlan} />
    </main>
  )
}
