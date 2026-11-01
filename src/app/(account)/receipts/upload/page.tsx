import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { UploadReceiptClient } from './UploadReceiptClient'

export const metadata: Metadata = {
  title: 'Upload Receipt | PassPrivé',
}

/**
 * app parity: screens/UploadReceiptScreen.jsx + ReviewReceiptScreen.jsx —
 * photograph the printed bill of a merchant to claim receipt cashback.
 */
export default async function UploadReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ restaurantId?: string; storeId?: string; dealId?: string }>
}) {
  const { restaurantId, storeId, dealId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const kind = storeId ? 'store' : 'restaurant'
  const merchantId = storeId || restaurantId
  if (!merchantId) notFound()

  const { data } = await supabase
    .from(kind === 'store' ? 'stores' : 'restaurants')
    .select('id, name, slug')
    .eq('id', merchantId)
    .maybeSingle()
  const merchant = data as { id: string; name: string; slug: string | null } | null
  if (!merchant) notFound()

  return (
    <main className="min-h-screen">
      <SetPageTitle title="Upload receipt" />
      <UploadReceiptClient
        merchant={{ id: merchant.id, name: merchant.name, kind }}
        backHref={`/${kind === 'store' ? 'stores' : 'dining'}/${merchant.slug ?? merchant.id}`}
        dealId={dealId ?? null}
      />
    </main>
  )
}
