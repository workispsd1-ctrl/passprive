import { createClient } from '@/lib/supabase/server'
import type { DiningBooking } from '@/lib/types/bookings'

const BOOKING_SELECT = 'id, restaurant_id, booking_date, booking_time, party_size, status, booking_code, source, customer_name, special_request, restaurants(id, name, slug, cover_image, area, full_address, cost_for_two, merchant_type)'

export async function getUserDiningBookings(userId: string): Promise<DiningBooking[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('restaurant_bookings')
    .select(BOOKING_SELECT)
    .eq('customer_user_id', userId)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false })
  return (data ?? []) as unknown as DiningBooking[]
}

export async function getBookingById(bookingId: string, userId: string): Promise<DiningBooking | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('restaurant_bookings')
    .select(BOOKING_SELECT)
    .eq('id', bookingId)
    .eq('customer_user_id', userId)
    .single()
  return data as unknown as DiningBooking | null
}

/**
 * Confirmed/pending bookings from today onwards, soonest first — app parity:
 * components/Home/UpcomingBookings.jsx (restaurant_bookings; the app also
 * merges store orders, which have no web flow yet).
 */
export async function getUpcomingDiningBookings(
  userId: string,
  limit = 10,
): Promise<DiningBooking[]> {
  const supabase = await createClient()
  // Mauritius (UTC+4) calendar date, so an evening booking doesn't drop off early
  const today = new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 10)
  const { data } = await supabase
    .from('restaurant_bookings')
    .select(BOOKING_SELECT)
    .eq('customer_user_id', userId)
    .in('status', ['confirmed', 'pending'])
    .gte('booking_date', today)
    .order('booking_date', { ascending: true })
    .order('booking_time', { ascending: true })
    .limit(limit)
  return (data ?? []) as unknown as DiningBooking[]
}
