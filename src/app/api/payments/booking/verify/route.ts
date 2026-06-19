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
    session_id: string
    merchant_trace?: string
    status?: string
    booking_id?: string
  }

  const upstream = await fetch(`${PAYMENTS_API}/api/payments/iveri/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      session_id: body.session_id,
      merchant_trace: body.merchant_trace,
      status: body.status,
      payment_context: 'BOOKING',
    }),
  })

  const data = await upstream.json() as Record<string, unknown>

  if (!upstream.ok) {
    return NextResponse.json(
      { error: (data?.error as string) ?? (data?.message as string) ?? 'Payment verification failed' },
      { status: upstream.status },
    )
  }

  if (body.booking_id) {
    const supabaseServer = await createClient()
    await supabaseServer
      .from('restaurant_bookings')
      .update({ payment_status: 'paid' })
      .eq('id', body.booking_id)
  }

  return NextResponse.json(data)
}
