import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * A payment session's status — app parity: paymentApi.js readPaymentSessionStatus
 * (`payment_sessions.status`, readable by its owner). The pay-bill page polls
 * this while the bank's page is open in its own window, so it can move on to
 * the receipt whatever page the gateway ends on.
 */
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get('session_id') ?? ''
  if (!sessionId) return NextResponse.json({ status: '' })
  const supabase = await createClient()
  const { data } = await supabase.from('payment_sessions').select('status').eq('id', sessionId).maybeSingle()
  return NextResponse.json({ status: String(data?.status ?? '').toUpperCase() })
}
