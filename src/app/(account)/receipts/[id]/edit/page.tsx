import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { isPendingStatus } from '@/lib/receipts'
import { getClaimWithMerchant, receiptImageUrl } from '@/lib/services/receipts'
import { EditClaimClient } from './EditClaimClient'

export const metadata: Metadata = {
  title: 'Edit Claim | PassPrivé',
}

/** app parity: screens/EditClaimScreen.jsx — only while the claim is under review. */
export default async function EditClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const result = await getClaimWithMerchant(id)
  if (!result) notFound()
  if (!isPendingStatus(result.claim.status)) redirect(`/receipts/${id}`)

  const photoUrl = await receiptImageUrl(result.claim.image_path)

  return (
    <main className="min-h-screen">
      <SetPageTitle title="Edit claim" />
      <EditClaimClient claim={result.claim} merchant={result.merchant} photoUrl={photoUrl} />
    </main>
  )
}
