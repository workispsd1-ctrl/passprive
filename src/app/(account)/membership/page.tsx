import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { getSubscriptionPlans, getUserMembership } from '@/lib/services/subscription'
import { MembershipClient } from './MembershipClient'

export const metadata: Metadata = {
  title: 'Membership | PassPrivé',
}

export default async function MembershipPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [plans, membership] = await Promise.all([
    getSubscriptionPlans(),
    user ? getUserMembership(user.id) : Promise.resolve(null),
  ])

  return (
    <main className="min-h-screen">
      <SetPageTitle title="Membership" />
      <MembershipClient
        plans={plans}
        membership={membership}
        isLoggedIn={!!user}
      />
    </main>
  )
}
