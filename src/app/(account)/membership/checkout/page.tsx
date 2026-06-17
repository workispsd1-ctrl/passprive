import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { getSubscriptionPlans } from '@/lib/services/subscription'
import { CheckoutClient } from './CheckoutClient'

export const metadata: Metadata = { title: 'Checkout | PassPrivé' }

const PLAN_TIER: Record<string, string> = {
  BasePlan_1: 'premium',
  black_tier: 'black',
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const { plan } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/membership')

  const plans = await getSubscriptionPlans()
  const selectedPlan = plans.find(p => PLAN_TIER[p.product_id] === plan)
  if (!selectedPlan) redirect('/membership')

  return (
    <main className="min-h-screen">
      <SetPageTitle title="Checkout" />
      <CheckoutClient plan={selectedPlan} />
    </main>
  )
}
