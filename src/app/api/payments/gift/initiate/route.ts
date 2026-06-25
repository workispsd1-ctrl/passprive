import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { GiftPurchasePayload } from '@/lib/types/gifts'

const PAYMENTS_API = (process.env.PAYMENTS_API_URL ?? 'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '')

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Please log in to continue.' }, { status: 401 })

  const body = await request.json() as GiftPurchasePayload

  if (!body.amount || body.amount <= 0) {
    return NextResponse.json({ error: 'Invalid gift amount.' }, { status: 400 })
  }

  const host = request.headers.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`

  const payload: Record<string, unknown> = {
    payment_context: 'GIFT_PURCHASE',
    platform: 'web',
    return_url: `${appUrl}/gifts/payment-return`,
    original_amount: body.original_amount,
    discount_amount: body.discount_amount ?? 0,
    bill_amount: body.amount,
  }
  if (body.gift_discount_id) payload.gift_discount_id = body.gift_discount_id
  if (body.store_id) payload.store_id = body.store_id
  if (body.restaurant_id) payload.restaurant_id = body.restaurant_id

  try {
    const upstream = await fetch(`${PAYMENTS_API}/api/payments/iveri/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    })
    const data = await upstream.json() as Record<string, unknown>
    if (!upstream.ok) {
      return NextResponse.json(
        { error: (data?.error as string) ?? 'Payment initiation failed' },
        { status: upstream.status },
      )
    }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Payment service unavailable.' }, { status: 503 })
  }
}
