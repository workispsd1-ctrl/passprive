import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserCashbackInfo } from '@/lib/services/wallet'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { PayBillClient } from './PayBillClient'

export const metadata: Metadata = { title: 'Pay Bill | PassPrivé' }

export default async function PayBillPage({
  searchParams,
}: {
  searchParams: Promise<{ restaurant_id?: string; restaurant_name?: string }>
}) {
  const { restaurant_id, restaurant_name } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const cashbackInfo = await getUserCashbackInfo(user.id)

  return (
    <main className="min-h-screen bg-gray-50">
      <SetPageTitle title={restaurant_name ? `Pay Bill · ${restaurant_name}` : 'Pay Bill'} />
      <PayBillClient
        restaurantId={restaurant_id ?? null}
        restaurantName={restaurant_name ?? null}
        cashbackRate={cashbackInfo?.cashback_rate ?? 0.5}
        membershipTier={cashbackInfo?.membership_tier ?? 'none'}
      />
    </main>
  )
}
