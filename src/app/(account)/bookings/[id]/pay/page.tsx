import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBookingById } from '@/lib/services/bookings'
import { getUserCashbackInfo } from '@/lib/services/wallet'
import { PayCheckoutClient } from './PayCheckoutClient'

export const metadata: Metadata = { title: 'Pay Bill | PassPrivé' }

export default async function PayBillPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ amount?: string }>
}) {
  const { id } = await params
  const { amount: amountParam } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const booking = await getBookingById(id, user.id)
  const cashbackInfo = await getUserCashbackInfo(user.id, booking?.restaurant_id ?? undefined)
  if (!booking) notFound()

  const isActive = booking.status === 'confirmed' || booking.status === 'pending'
  if (!isActive) redirect(`/bookings/${id}`)

  const costForTwo = booking.restaurants?.cost_for_two ?? 0
  const estimatedBill = costForTwo > 0
    ? Math.round(costForTwo * booking.party_size / 2)
    : 0
  const defaultAmount = amountParam ? parseFloat(amountParam) || estimatedBill : estimatedBill

  return (
    <main className="min-h-screen bg-gray-50">
      <PayCheckoutClient
        booking={booking}
        cashbackRate={cashbackInfo?.cashback_rate ?? 0.5}
        membershipTier={cashbackInfo?.membership_tier ?? 'none'}
        defaultAmount={defaultAmount}
      />
    </main>
  )
}
