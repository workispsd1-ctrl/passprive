import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { getBillPayments } from '@/lib/services/billPayments'
import { getPointsLedger } from '@/lib/services/wallet'
import { TransactionsClient } from './TransactionsClient'

export const metadata: Metadata = { title: 'Transactions | PassPrivé' }

/**
 * Transactions — app parity: screens/TransactionsScreen.jsx. Paid = bill
 * payments (payment_sessions); Earned / Used = the Privé Credits ledger.
 */
export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ open }, payments, ledger] = await Promise.all([searchParams, getBillPayments(50), getPointsLedger()])

  return (
    <main className='min-h-screen'>
      <SetPageTitle title='Transactions' />
      <TransactionsClient payments={payments} ledger={ledger ?? []} openId={open ?? null} />
    </main>
  )
}
