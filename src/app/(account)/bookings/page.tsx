import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookingsClient } from './BookingsClient'
import { getUserDiningBookings } from '@/lib/services/bookings'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'

export const metadata: Metadata = {
  title: 'My Bookings | PassPrivé',
}

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const diningBookings = await getUserDiningBookings(user.id)

  return (
    <main className="min-h-screen">
      <SetPageTitle title="Review your bookings" />
      <BookingsClient diningBookings={diningBookings} />
    </main>
  )
}
