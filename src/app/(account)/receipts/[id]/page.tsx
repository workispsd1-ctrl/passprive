import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { getClaimWithMerchant } from '@/lib/services/receipts'
import { ReceiptStatusClient } from './ReceiptStatusClient'

export const metadata: Metadata = {
  title: 'Receipt Status | PassPrivé',
}

/** app parity: screens/ReceiptSubmittedScreen.jsx + ReceiptStatusScreen.jsx */
export default async function ReceiptStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ submitted?: string; saved?: string }>
}) {
  const [{ id }, { submitted, saved }] = await Promise.all([params, searchParams])
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const result = await getClaimWithMerchant(id)
  if (!result) notFound()

  return (
    <main className="min-h-screen">
      <SetPageTitle title="Your receipt" />
      <ReceiptStatusClient
        initial={result}
        celebrate={submitted ? 'Receipt submitted successfully.' : saved ? 'Changes saved' : null}
      />
    </main>
  )
}
