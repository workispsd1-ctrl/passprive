import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ACTIVE_BOOKING_STATUSES, isBlockingBooking } from '@/lib/booking/status'

/** The caller's live bookings at one restaurant — app parity: useExistingBookingGuard.check. */
export async function GET(request: NextRequest) {
  const restaurantId = request.nextUrl.searchParams.get('restaurant_id')
  if (!restaurantId) return NextResponse.json({ error: 'restaurant_id is required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ bookings: [] })

  // Mauritius (UTC+4) calendar date
  const today = new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('restaurant_bookings')
    .select('id, booking_date, booking_time, status, party_size, booked_slot_label, payment_required, payment_status, payment_amount, cover_charge_amount')
    .eq('restaurant_id', restaurantId)
    .eq('customer_user_id', user.id)
    .is('cancelled_at', null)
    .in('status', ACTIVE_BOOKING_STATUSES)
    .gte('booking_date', today)
    .order('booking_date', { ascending: true })
    .order('booking_time', { ascending: true })
  if (error) return NextResponse.json({ error: 'failed' }, { status: 500 })
  return NextResponse.json({ bookings: (data ?? []).filter(isBlockingBooking) })
}
