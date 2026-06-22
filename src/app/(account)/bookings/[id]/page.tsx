import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getBookingById } from '@/lib/services/bookings'
import { getWalletBalance, getUserCashbackInfo } from '@/lib/services/wallet'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { BookingDetailClient } from './BookingDetailClient'

export const metadata: Metadata = { title: 'Booking Details | PassPrivé' }

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const booking = await getBookingById(id, user.id)
  const [wallet, cashbackInfo] = await Promise.all([
    getWalletBalance(user.id),
    getUserCashbackInfo(user.id, booking?.restaurant_id),
  ])
  if (!booking) notFound()

  const userName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? booking.customer_name ?? 'Guest'

  return (
    <main className="min-h-screen bg-gray-50">
      <SetPageTitle title="Booking Details" />
      <Suspense>
        <BookingDetailClient
          booking={booking}
          userName={userName}
          ppBalance={wallet?.balance ?? 0}
          cashbackRate={cashbackInfo?.cashback_rate ?? 0.5}
          membershipTier={cashbackInfo?.membership_tier ?? 'none'}
        />
      </Suspense>
    </main>
  )
}
