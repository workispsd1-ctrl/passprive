import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getMembershipPlans, getUserMembership } from '@/lib/services/subscription'
import type { PlanTier } from '@/lib/membershipBenefits'
import { BenefitsClient } from './BenefitsClient'

export const metadata: Metadata = {
  title: 'Privé benefits | PassPrivé',
}

const TIERS: PlanTier[] = ['black', 'plus', 'free']

/** Figma "Privé benefits · Desktop 1920" — opened from the plan page's "View all 10 benefits". */
export default async function BenefitsPage({ searchParams }: { searchParams: Promise<{ tier?: string; period?: string }> }) {
  const { tier, period } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [plans, membership] = await Promise.all([
    getMembershipPlans(),
    user ? getUserMembership(user.id) : Promise.resolve(null),
  ])

  return (
    <main className="min-h-screen">
      <BenefitsClient
        plans={plans}
        membership={membership}
        initialTier={TIERS.includes(tier as PlanTier) ? (tier as PlanTier) : 'black'}
        initialPeriod={period === 'year' ? 'year' : period === 'month' ? 'month' : null}
      />
    </main>
  )
}
