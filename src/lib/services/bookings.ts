import { createClient } from '@/lib/supabase/server'
import type { DiningBooking } from '@/lib/types/bookings'

export async function getUserDiningBookings(userId: string): Promise<DiningBooking[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('restaurant_bookings')
    .select('id, restaurant_id, booking_date, booking_time, party_size, status, booking_code, restaurants(id, name, slug, cover_image, area, full_address)')
    .eq('customer_user_id', userId)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false })
  return (data ?? []) as unknown as DiningBooking[]
}
