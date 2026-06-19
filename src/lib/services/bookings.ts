import { createClient } from '@/lib/supabase/server'
import type { DiningBooking } from '@/lib/types/bookings'

const BOOKING_SELECT = 'id, restaurant_id, booking_date, booking_time, party_size, status, booking_code, source, customer_name, special_request, restaurants(id, name, slug, cover_image, area, full_address, cost_for_two)'

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
