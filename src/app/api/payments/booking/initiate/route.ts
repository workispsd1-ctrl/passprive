import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAYMENTS_API = (process.env.PAYMENTS_API_URL ?? 'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '')

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Please log in to continue.' }, { status: 401 })
  }

  const body = await request.json() as {
    booking_id: string
    restaurant_id: string
    amount: number
    currency_code: string
  }

  const host = request.headers.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const returnUrl = `${proto}://${host}/dining/cover-charge-return`

  const payload = {
    payment_context: 'BOOKING',
    platform: 'web',
    return_url: returnUrl,
    booking_payload: {
      booking_id: body.booking_id,
      restaurant_id: body.restaurant_id,
      amount: Number(body.amount),
      currency_code: body.currency_code,
    },
  }

  console.log('[booking/initiate] sending payload:', JSON.stringify(payload))

  const upstream = await fetch(`${PAYMENTS_API}/api/payments/iveri/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  })

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
