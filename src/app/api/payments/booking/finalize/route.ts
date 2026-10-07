import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAYMENTS_API = (process.env.PAYMENTS_API_URL ?? 'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '')

/**
 * app parity: PaymentReturnScreen.jsx → `finalizeIveriBooking`. The backend
 * creates the booking from the payment session (and handles any cashback),
 * so this only relays its confirmation.
 */
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

  return NextResponse.json(upstreamData)
}
