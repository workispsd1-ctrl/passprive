import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// app parity: PaymentSuccessScreen.jsx CANCELLATION_REASONS
const REASONS = ['Plan change', 'Found a better offer elsewhere', 'Booked by mistake', 'Others']
const ACTIVE = ['pending', 'requested', 'confirmed', 'booked', 'accepted']
// app parity: useExistingBookingGuard.cancelExisting — replacing a booking stores this fixed reason
const REPLACED_REASON = 'Cancelled to create a new booking'
// Mauritius is UTC+4; booking_date/time are stored as local wall-clock values.
const MU_OFFSET = '+04:00'

/**
 * Cancel a dining booking — app parity: PaymentSuccessScreen.jsx
 * `handleConfirmCancellation` (status → cancelled, cancelled_at, cancel_reason).
 * The app only offers this when the restaurant has `cancellation_available`;
 * the same rule is enforced here, plus: the booking must be the caller's,
 * still active, and not yet started.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { reason, replacing } = (await request.json().catch(() => ({}))) as { reason?: string; replacing?: boolean }
  if (!reason || !REASONS.includes(reason)) {
    return NextResponse.json({ error: 'Please choose a reason for cancelling.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in to continue.' }, { status: 401 })

  const { data: booking } = await supabase
    .from('restaurant_bookings')
    .select('id, status, booking_date, booking_time, restaurants(cancellation_available)')
    .eq('id', id)
    .eq('customer_user_id', user.id)
    .maybeSingle()
  if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })

  const rest = booking.restaurants as { cancellation_available?: boolean | null } | { cancellation_available?: boolean | null }[] | null
  const allowed = (Array.isArray(rest) ? rest[0] : rest)?.cancellation_available === true
  if (!allowed && !replacing) return NextResponse.json({ error: 'This booking is not eligible for cancellation.' }, { status: 403 })
  const status = String(booking.status).toLowerCase()
  if (!ACTIVE.includes(status) && !(replacing && status === 'payment_successfull')) {
    return NextResponse.json({ error: 'This booking can no longer be cancelled.' }, { status: 409 })
  }
  const startsAt = Date.parse(`${booking.booking_date}T${String(booking.booking_time).slice(0, 5)}:00${MU_OFFSET}`)
  if (!replacing && Number.isFinite(startsAt) && startsAt <= Date.now()) {
    return NextResponse.json({ error: 'This booking has already started.' }, { status: 409 })
  }

  const { error } = await supabase
    .from('restaurant_bookings')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: replacing ? REPLACED_REASON : reason })
    .eq('id', id)
    .eq('customer_user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
