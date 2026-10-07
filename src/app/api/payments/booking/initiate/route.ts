import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAYMENTS_API = (process.env.PAYMENTS_API_URL ?? 'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '')

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Please log in to continue.' }, { status: 401 })
  }

  // app parity: CardPaymentScreen.jsx BOOKING context — the booking is sent
  // inside the payment session and created by finalize-booking afterwards.
  const body = await request.json() as {
    restaurant_id?: string
    store_id?: string
    booking_payload?: Record<string, unknown>
  }

  if ((!body.restaurant_id && !body.store_id) || !body.booking_payload) {
    return NextResponse.json({ error: 'Missing booking details.' }, { status: 400 })
  }

  const host = request.headers.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`
  const returnUrl = `${appUrl}/dining/cover-charge-return`

  const payload = {
    payment_context: 'BOOKING',
    platform: 'web',
    return_url: returnUrl,
    ...(body.store_id ? { store_id: body.store_id } : { restaurant_id: body.restaurant_id }),
    booking_payload: body.booking_payload,
  }

  let upstream: Response
  try {
    upstream = await fetch(`${PAYMENTS_API}/api/payments/iveri/initiate`, {
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

  const data = await upstream.json() as Record<string, unknown>

  if (!upstream.ok) {
    console.error('[booking/initiate] upstream error:', JSON.stringify(data))
    return NextResponse.json(
      { error: (data?.error as string) ?? (data?.message as string) ?? 'Payment initiation failed', detail: data },
      { status: upstream.status },
    )
  }

  return NextResponse.json(data)
}
