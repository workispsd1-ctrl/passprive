import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { creditCashback, getUserCashbackInfo } from '@/lib/services/wallet'
import { isPaymentSuccess } from '@/lib/utils/payment'

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

  let upstream: Response
  try {
    upstream = await fetch(`${PAYMENTS_API}/api/payments/iveri/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        session_id: body.session_id,
        merchant_trace: body.merchant_trace,
        status: body.status,
        outcome: body.status,
        payment_context: 'BOOKING',
      }),
      signal: AbortSignal.timeout(15000),
    })
  } catch (err) {
    console.error('[booking/verify] fetch failed:', err)
    return NextResponse.json({ error: 'Payment service unavailable. Please try again.' }, { status: 503 })
  }

  const data = await upstream.json() as Record<string, unknown>

  if (!upstream.ok) {
    console.error('[booking/verify] upstream error:', JSON.stringify(data))
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

    if (isPaymentSuccess(data)) {
      try {
        const { data: bookingRow } = await supabaseServer
          .from('restaurant_bookings')
          .select('restaurant_id, payment_amount')
          .eq('id', body.booking_id)
          .single()

        const paymentAmount = Number(bookingRow?.payment_amount ?? 0)
        const restaurantId = (bookingRow?.restaurant_id as string | undefined) ?? undefined

        if (paymentAmount > 0) {
          const cashbackInfo = await getUserCashbackInfo(session.user.id, restaurantId)
          if (cashbackInfo) {
            const cashback = Math.round(paymentAmount * cashbackInfo.cashback_rate / 100 * 100) / 100
            if (cashback > 0) {
              await creditCashback(session.user.id, cashback, restaurantId)
            }
          }
        }
      } catch (err) {
        console.error('[booking/verify] cashback credit failed (non-fatal):', err)
      }
    }
  }

  return NextResponse.json(data)
}
