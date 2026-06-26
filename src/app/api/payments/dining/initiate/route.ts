import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserCashbackInfo } from '@/lib/services/wallet'

const PAYMENTS_API = (process.env.PAYMENTS_API_URL ?? 'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '')

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Please log in to continue.' }, { status: 401 })
  }

  const body = await request.json() as {
    dining_payload: {
      restaurant_id: string
      booking_id?: string
      amount: number
      original_amount?: number
      discount_amount?: number
      cashback_amount?: number
      selected_offer_ids?: string[]
      payment_instrument_type?: string
      currency_code: string
    }
  }

  const cashbackInfo = await getUserCashbackInfo(session.user.id, body.dining_payload.restaurant_id)
  if (cashbackInfo !== null && cashbackInfo.cashback_rate === 0) {
    return NextResponse.json(
      { error: 'This restaurant is not a PassPrivé partner and does not accept PassPrivé payments.' },
      { status: 400 },
    )
  }

  const host = request.headers.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`
  const bookingId = body.dining_payload.booking_id ?? ''
  const returnUrl = `${appUrl}/bookings/${bookingId}/payment-return`

  const amount = Number(body.dining_payload.amount)
  const billPayload: Record<string, unknown> = {
    bill_amount: amount,
    original_amount: Number(body.dining_payload.original_amount ?? amount),
    discount_amount: Number(body.dining_payload.discount_amount ?? 0),
    cashback_amount: Number(body.dining_payload.cashback_amount ?? 0),
    selected_offer_ids: body.dining_payload.selected_offer_ids ?? [],
    payment_instrument_type: body.dining_payload.payment_instrument_type ?? 'CARD',
    currency_code: body.dining_payload.currency_code,
  }
  if (body.dining_payload.booking_id) {
    billPayload.booking_id = body.dining_payload.booking_id
  }

  const payload = {
    payment_context: 'BILL_PAYMENT',
    platform: 'web',
    restaurant_id: body.dining_payload.restaurant_id,
    return_url: returnUrl,
    bill_payload: billPayload,
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
    console.error('[dining/initiate] fetch failed:', err)
    return NextResponse.json({ error: 'Payment service unavailable. Please try again.' }, { status: 503 })
  }

  const data = await upstream.json() as Record<string, unknown>

  if (!upstream.ok) {
    console.error('[dining/initiate] upstream error:', JSON.stringify(data))
    return NextResponse.json(
      { error: (data?.error as string) ?? (data?.message as string) ?? 'Payment initiation failed', detail: data },
      { status: upstream.status },
    )
  }

  return NextResponse.json(data)
}
