import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getMembershipPlans, getUserMembership } from '@/lib/services/subscription'
import { MembershipClient } from './MembershipClient'

export const metadata: Metadata = {
  title: 'Membership | PassPrivé',
}

// Figma "Subscription plan" carries its own title row, so no PageTitleBar here
export default async function MembershipPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [plans, membership] = await Promise.all([
    getMembershipPlans(),
    user ? getUserMembership(user.id) : Promise.resolve(null),
  ])

  return (
    <main className="min-h-screen">
      <MembershipClient plans={plans} membership={membership} />
    </main>
  )
}
