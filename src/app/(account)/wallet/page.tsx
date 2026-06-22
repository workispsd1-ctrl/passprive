import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { getWalletBalance, getWalletTransactions } from '@/lib/services/wallet'
import { getUserMembership } from '@/lib/services/subscription'
import { WalletClient } from './WalletClient'

export const metadata: Metadata = {
  title: 'My Wallet | PassPrivé',
}

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const [balance, transactions, membership] = await Promise.all([
    getWalletBalance(user.id),
    getWalletTransactions(user.id),
    getUserMembership(user.id),
  ])


  return (
    <main className="min-h-screen">
      <SetPageTitle title="My Wallet" />
      <WalletClient
        balance={balance}
        transactions={transactions}
        membership={membership}
      />
    </main>
  )
}
