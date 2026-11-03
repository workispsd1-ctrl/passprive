import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
  }

  // Step 1: verify payment with iVeri
  let verifyUpstream: Response
  try {
    verifyUpstream = await fetch(`${PAYMENTS_API}/api/payments/iveri/verify`, {
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
        payment_context: 'BILL_PAYMENT',
      }),
      signal: AbortSignal.timeout(15000),
    })
  } catch (err) {
    console.error('[dining/verify] fetch failed:', err)
    return NextResponse.json({ error: 'Payment service unavailable. Please try again.' }, { status: 503 })
  }

  const verifyData = await verifyUpstream.json() as Record<string, unknown>
  if (!verifyUpstream.ok) {
    console.error('[dining/verify] upstream error:', JSON.stringify(verifyData))
    return NextResponse.json(
      { error: (verifyData?.error as string) ?? (verifyData?.message as string) ?? 'Payment verification failed' },
      { status: verifyUpstream.status },
    )
  }

  if (!isPaymentSuccess(verifyData)) {
    return NextResponse.json({ ...verifyData, cashback_credited: 0 })
  }

  // Step 2: finalize-bill — the backend records the bill and credits the cashback
  // (cashback_quote). Never credit here as well: the app doesn't, and it would pay twice.
  let cashback_credited = 0
  try {
    const finalizeRes = await fetch(`${PAYMENTS_API}/api/payments/iveri/finalize-bill`, {
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
    const finalizeData = await finalizeRes.json() as Record<string, unknown>

    if (finalizeRes.ok) {
      const bp = finalizeData?.bill_payment as Record<string, unknown> | undefined
      cashback_credited = Number(bp?.cashback_credited ?? bp?.cashback_amount ?? 0)
    } else {
      console.error('[dining/finalize-bill] upstream error:', JSON.stringify(finalizeData))
    }
  } catch (err) {
    console.error('[dining/finalize-bill] failed (non-fatal):', err)
  }

  return NextResponse.json({ ...verifyData, cashback_credited })
}
