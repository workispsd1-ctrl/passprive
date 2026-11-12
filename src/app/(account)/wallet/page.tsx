import type { Metadata } from 'next'
import { HuntSpot } from '@/components/hunt/HuntSpot'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { getNextPointsExpiry, getPointsLedger } from '@/lib/services/wallet'
import { getCashbackSummary } from '@/lib/services/cashbackSummary'
import { getUserMembership } from '@/lib/services/subscription'
import { getPendingBookingRewards } from '@/lib/services/bookings'
import type { LedgerRow } from '@/lib/pointsLedger'
import type { UserMembership } from '@/lib/types/subscription'
import { WalletClient, type WalletTier } from './WalletClient'

export const metadata: Metadata = {
  title: 'Privé Credits | PassPrivé',
}

/** app parity: WalletScreen resolveTier — an expired membership counts as Free */
function resolveTier(m: UserMembership | null): WalletTier {
  if (!m) return 'free'
  const expiry = m.membership_expiry ? Date.parse(m.membership_expiry) : NaN
  if (Number.isFinite(expiry) && expiry <= Date.now()) return 'free'
  const t = String(m.membership_tier || '').toLowerCase()
  if (t.includes('black')) return 'black'
  if (t.includes('plus') || t.includes('premium')) return 'plus'
  return 'free'
}

/** Privé Credits wallet — app parity: screens/WalletScreen.jsx (balance from the cashback summary, history from the points ledger). */
export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [summary, ledger, nextExpiry, membership, pendingRewards] = await Promise.all([
    getCashbackSummary(),
    getPointsLedger(200),
    getNextPointsExpiry(),
    getUserMembership(user.id),
    getPendingBookingRewards(),
  ])

  const transactions: LedgerRow[] = ledger
    ?? (summary?.transactions ?? []).map(t => ({ id: t.id, type: t.type, amount: t.amount, created_at: t.createdAt, status: t.status }))

  return (
    <main className='relative min-h-screen bg-white'>
      <HuntSpot slot='wallet' />
      <SetPageTitle title='Privé Credits' />
      <WalletClient
        balance={Number(summary?.balance ?? 0)}
        transactions={transactions}
        nextExpiry={nextExpiry}
        tier={resolveTier(membership)}
        pendingRewards={pendingRewards}
      />
    </main>
  )
}
