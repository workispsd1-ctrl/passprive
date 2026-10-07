import { NextResponse } from 'next/server'
import { proxyUpstreamPost } from '@/lib/booking/upstream'

/** app parity: utils/restaurantBookingApi.js `confirmRestaurantBooking` (no-payment bookings). */
export async function POST(request: Request) {
  const body = await request.json() as { restaurant?: { id?: string }; selectedDate?: string; selectedTime?: string; guests?: number }
  if (!body?.restaurant?.id || !body.selectedDate || !body.selectedTime || !body.guests) {
    return NextResponse.json({ error: 'Missing booking details.' }, { status: 400 })
  }
  return proxyUpstreamPost('/api/restaurant-bookings/confirm', body, 'bookings/dining/confirm')
}
