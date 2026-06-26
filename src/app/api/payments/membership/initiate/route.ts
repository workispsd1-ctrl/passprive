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
    membership_payload: {
      plan_id: string
      plan_name: string
      plan_type: string
      product_id: string
      price_id: string
      amount: number
      currency_code: string
    }
  }

  const host = request.headers.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`
  const returnUrl = `${appUrl}/membership/payment-return`

  const payload = {
    payment_context: 'MEMBERSHIP',
    platform: 'web',
    return_url: returnUrl,
    membership_payload: body.membership_payload,
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
    console.error('[membership/initiate] fetch failed:', err)
    return NextResponse.json({ error: 'Payment service unavailable. Please try again.' }, { status: 503 })
  }

  const data = await upstream.json() as Record<string, unknown>

  if (!upstream.ok) {
    console.error('[membership/initiate] upstream error:', JSON.stringify(data))
    return NextResponse.json(
      { error: (data?.error as string) ?? (data?.message as string) ?? 'Payment initiation failed' },
      { status: upstream.status },
    )
  }

  return NextResponse.json(data)
}
