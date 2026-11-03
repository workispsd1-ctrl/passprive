import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPayBill, type MerchantCapabilityFields } from '@/lib/cashback'

const PAYMENTS_API = (process.env.PAYMENTS_API_URL ?? 'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '')
// app parity: PaymentProcessingScreen MIPS_RETURN_URL — where the gateway ends; the page follows the session status
const MIPS_RETURN_URL = 'https://api.passprive.com/api/payments/mips/return'

/**
 * Start a bill payment — app parity: PaymentProcessingScreen buildPayload +
 * initiateMipsPayment. The backend records and finalizes the bill itself and
 * credits the cashback; the session status says when it is paid.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Please log in to continue.' }, { status: 401 })

  const body = await request.json() as { restaurant_id: string; total_amount: number; coins_amount: number; order_items?: { id?: unknown; qty?: unknown }[] }

  const { data: merchant } = await supabase
    .from('restaurants')
    .select('merchant_type, merchant_plan, pay_bill_enabled, service_level, on_boarded')
    .eq('id', body.restaurant_id)
    .maybeSingle()
  if (!merchant || !canPayBill(merchant as MerchantCapabilityFields)) {
    return NextResponse.json({ error: 'This restaurant does not take bill payments on PassPrivé yet.' }, { status: 400 })
  }

  // app parity: buildPayload — only the ids and quantities of an Order & Collect cart
  const orderItems = Array.isArray(body.order_items)
    ? body.order_items
        .map(item => ({ id: String(item?.id ?? ''), qty: Math.floor(Number(item?.qty)) }))
        .filter(item => item.id && item.qty > 0)
    : []

  let upstream: Response
  try {
    upstream = await fetch(`${PAYMENTS_API}/api/payments/mips/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        payment_context: 'BILL_PAYMENT',
        restaurant_id: body.restaurant_id,
        total_amount: Number(body.total_amount),
        coins_amount: Number(body.coins_amount) || 0,
        currency: 'MUR',
        custom_redirect_url: MIPS_RETURN_URL,
        ...(orderItems.length ? { order_items: orderItems } : {}),
      }),
      signal: AbortSignal.timeout(15000),
    })
  } catch (err) {
    console.error('[bill/initiate] fetch failed:', err)
    return NextResponse.json({ error: 'Payment service unavailable. Please try again.' }, { status: 503 })
  }

  const data = await upstream.json().catch(() => ({})) as Record<string, unknown>
  if (!upstream.ok) {
    console.error('[bill/initiate] upstream error:', JSON.stringify(data))
    return NextResponse.json({ error: (data.error as string) ?? (data.message as string) ?? 'Payment could not be started' }, { status: upstream.status })
  }
  return NextResponse.json(data)
}
