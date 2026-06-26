import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { creditCashback, getUserCashbackInfo } from '@/lib/services/wallet'

const PAYMENTS_API = (process.env.PAYMENTS_API_URL ?? 'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '')

function generateBookingCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = 'PP'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Please log in to continue.' }, { status: 401 })
  }

  const body = await request.json() as {
    session_id: string
    merchant_trace?: string
  }

  if (!body.session_id) {
    return NextResponse.json({ error: 'session_id is required.' }, { status: 400 })
  }

  let upstream: Response
  try {
    upstream = await fetch(`${PAYMENTS_API}/api/payments/iveri/finalize-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        session_id: body.session_id,
        merchant_trace: body.merchant_trace,
      }),
      signal: AbortSignal.timeout(15000),
    })
  } catch (err) {
    console.error('[booking/finalize] fetch failed:', err)
    return NextResponse.json({ error: 'Payment service unavailable. Please try again.' }, { status: 503 })
  }

  const upstreamData = await upstream.json() as Record<string, unknown>

  if (!upstream.ok) {
    console.error('[booking/finalize] upstream error:', JSON.stringify(upstreamData))
    return NextResponse.json(
      { error: (upstreamData?.error as string) ?? (upstreamData?.message as string) ?? 'Booking finalization failed' },
      { status: upstream.status },
    )
  }

  const bookingPayload = upstreamData.booking_payload as {
    selectedDate?: string
    selectedTime?: string
    guests?: number
    option?: {
      type?: string
      coverChargeAmount?: number
      offer?: string
    }
  } | undefined

  const restaurantId = (upstreamData.restaurant_id as string | undefined) ?? ''
  const bookingDate = bookingPayload?.selectedDate ?? ''
  const bookingTime = bookingPayload?.selectedTime ?? ''
  const partySize = bookingPayload?.guests ?? 1
  const coverChargeAmount = bookingPayload?.option?.coverChargeAmount ?? 0
  const paymentAmount = coverChargeAmount * partySize

  if (!restaurantId || !bookingDate || !bookingTime) {
    console.error('[booking/finalize] missing booking fields in upstream response:', JSON.stringify(upstreamData))
    return NextResponse.json({ error: 'Booking data missing from payment session.' }, { status: 500 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, phone')
    .eq('id', session.user.id)
    .single()

  const customerName = (profile?.full_name as string | null) ?? (session.user.user_metadata?.full_name as string | null) ?? ''
  const customerPhone = (profile?.phone as string | null) ?? ''

  const bookingCode = generateBookingCode()

  const { data: booking, error: insertError } = await supabase
    .from('restaurant_bookings')
    .insert({
      restaurant_id: restaurantId,
      customer_user_id: session.user.id,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: session.user.email ?? null,
      booking_date: bookingDate,
      booking_time: bookingTime,
      party_size: partySize,
      booking_code: bookingCode,
      status: 'confirmed',
      payment_required: true,
      payment_amount: paymentAmount,
      payment_status: 'paid',
      source: 'mobile',
    })
    .select('id, booking_code, booking_date, booking_time, party_size, status')
    .single()

  if (insertError) {
    console.error('[booking/finalize] db insert error:', insertError.message)
    return NextResponse.json({ error: 'Failed to create booking. Please contact support.' }, { status: 500 })
  }

  if (paymentAmount > 0) {
    try {
      const cashbackInfo = await getUserCashbackInfo(session.user.id, restaurantId)
      if (cashbackInfo) {
        const cashback = Math.round(paymentAmount * cashbackInfo.cashback_rate / 100 * 100) / 100
        if (cashback > 0) {
          await creditCashback(session.user.id, cashback, restaurantId)
        }
      }
    } catch (err) {
      console.error('[booking/finalize] cashback credit failed (non-fatal):', err)
    }
  }

  return NextResponse.json({
    booking_id: booking.id,
    booking_code: booking.booking_code,
    booking_date: booking.booking_date,
    booking_time: booking.booking_time,
    party_size: booking.party_size,
    status: booking.status,
    restaurant_id: restaurantId,
  })
}
