import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserVisitRewards } from '@/lib/services/visitRewards'
import { VisitRewardsClient } from './VisitRewardsClient'

export const metadata: Metadata = {
  title: 'Visit Rewards | PassPrivé',
  description:
    'Track your repeat-visit rewards across PassPrivé restaurants and unlock exclusive benefits.',
  alternates: { canonical: '/visit-rewards' },
}

export default async function VisitRewardsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const rewards = await getUserVisitRewards()

  return <VisitRewardsClient rewards={rewards} />
}
