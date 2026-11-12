import type { Metadata } from 'next'
import { HuntSpot } from '@/components/hunt/HuntSpot'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookingsClient } from './BookingsClient'
import { getUserDiningBookings, getUserStoreBookings } from '@/lib/services/bookings'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'

export const metadata: Metadata = {
  title: 'My Bookings | PassPrivé',
}

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const [{ tab }, diningBookings, storeBookings] = await Promise.all([
    searchParams,
    getUserDiningBookings(user.id),
    getUserStoreBookings(user.id),
  ])

  return (
    <main className="relative min-h-screen">
      <HuntSpot slot="bookings" />
      <SetPageTitle title="Your bookings" />
      <BookingsClient diningBookings={diningBookings} storeBookings={storeBookings} initialTab={tab} />
    </main>
  )
}
