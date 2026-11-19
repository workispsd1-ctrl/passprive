import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAYMENTS_API = (process.env.PAYMENTS_API_URL ?? 'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '')
// app parity: PaymentProcessingScreen MIPS_RETURN_URL — where the gateway ends; the page follows the session status
const MIPS_RETURN_URL = 'https://api.passprive.com/api/payments/mips/return'

/**
 * Start a booking payment — app parity (b2ff80a): PaymentProcessingScreen
 * buildPayload BOOKING, now through MIPS like the bill. The booking travels
 * inside the payment session; the backend creates it (or settles the cover
 * request) and marks the session FINALIZED with the booking's id.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Please log in to continue.' }, { status: 401 })
  }

  const body = await request.json() as {
    restaurant_id?: string
    store_id?: string
    /** what is paid now — the booking fee / cover charge */
    amount?: number
    booking_payload?: Record<string, unknown>
    /** salon / service bookings (app fbaf070) */
    service_booking_payload?: Record<string, unknown>
    /** paying a merchant's cover-charge request on an existing booking (app: CoverRequestBox) */
    cover_request_booking_id?: string
  }

  if ((!body.restaurant_id && !body.store_id) || (!body.booking_payload && !body.service_booking_payload && !body.cover_request_booking_id)) {
    return NextResponse.json({ error: 'Missing booking details.' }, { status: 400 })
  }

  let amount = Number(body.amount) || 0
  if (body.cover_request_booking_id) {
    // the amount still asked for on that booking, as the merchant set it
    const { data: row } = await supabase
      .from(body.store_id ? 'store_orders' : 'restaurant_bookings')
      .select('cover_request_amount')
      .eq('id', body.cover_request_booking_id)
      .maybeSingle()
    amount = Number(row?.cover_request_amount) || 0
  }
  if (!(amount > 0)) {
    return NextResponse.json({ error: 'There is nothing to pay for this booking.' }, { status: 400 })
  }

  const payload = {
    total_amount: Math.round(amount * 100) / 100,
    currency: 'MUR',
    custom_redirect_url: MIPS_RETURN_URL,
    payment_context: 'BOOKING',
    ...(body.store_id ? { store_id: body.store_id } : { restaurant_id: body.restaurant_id }),
    ...(body.cover_request_booking_id
      ? { cover_request_booking_id: body.cover_request_booking_id }
      : body.service_booking_payload
        ? { service_booking_payload: body.service_booking_payload }
        : { booking_payload: body.booking_payload }),
  }

  let upstream: Response
  try {
    upstream = await fetch(`${PAYMENTS_API}/api/payments/mips/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    })
  } catch (err) {
    console.error('[booking/initiate] fetch failed:', err)
    return NextResponse.json({ error: 'Payment service unavailable. Please try again.' }, { status: 503 })
  }

  const data = await upstream.json().catch(() => ({})) as Record<string, unknown>

  if (!upstream.ok) {
    console.error('[booking/initiate] upstream error:', JSON.stringify(data))
    return NextResponse.json(
      { error: (data?.error as string) ?? (data?.message as string) ?? 'Payment initiation failed' },
      { status: upstream.status },
    )
  }

  return NextResponse.json(data)
}
