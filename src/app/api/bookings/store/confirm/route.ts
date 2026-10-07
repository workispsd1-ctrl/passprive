import { NextResponse } from 'next/server'
import { proxyUpstreamPost } from '@/lib/booking/upstream'

/** app parity: utils/storeBookingApi.js `confirmStoreBooking` (no-payment appointments). */
export async function POST(request: Request) {
  const body = await request.json() as { store?: { id?: string }; selectedDate?: string; selectedTime?: string; selectedServices?: unknown[] }
  if (!body?.store?.id || !body.selectedDate || !body.selectedTime || !body.selectedServices?.length) {
    return NextResponse.json({ error: 'Missing booking details.' }, { status: 400 })
  }
  return proxyUpstreamPost('/api/store-service-booking/confirm', body, 'bookings/store/confirm')
}
