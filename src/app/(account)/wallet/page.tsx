import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { getNextPointsExpiry, getPointsLedger, getWalletBalance, getWalletTransactions } from '@/lib/services/wallet'
import { getUserMembership } from '@/lib/services/subscription'
import { WalletClient } from './WalletClient'

export const metadata: Metadata = {
  title: 'My Wallet | PassPrivé',
}

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const [balance, ledger, nextExpiry, membership] = await Promise.all([
    getWalletBalance(user.id),
    getPointsLedger(),
    getNextPointsExpiry(),
    getUserMembership(user.id),
  ])
  // The ledger RPC carries per-lot expiry; the raw history is the fallback.
  const transactions = ledger ? [] : await getWalletTransactions(user.id)

  return (
    <main className="min-h-screen">
      <SetPageTitle title="My Wallet" />
      <WalletClient
        balance={balance}
        transactions={transactions}
        ledger={ledger}
        nextExpiry={nextExpiry}
        membership={membership}
      />
    </main>
  )
}
