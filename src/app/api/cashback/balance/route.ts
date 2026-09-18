import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Same upstream + auth as the app's fetchCashbackBalance (utils/cashbackApi.js):
// GET {PAYMENTS_API}/api/cashback/balance with the Supabase access token.
const PAYMENTS_API = (
  process.env.PAYMENTS_API_URL ??
  'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com'
).replace(/\/+$/, '')

function toAmount(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Not logged in → no balance (the app throws; here we degrade to 0).
  if (!session) return NextResponse.json({ balance: 0 })

  try {
    const upstream = await fetch(`${PAYMENTS_API}/api/cashback/balance`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      signal: AbortSignal.timeout(10000),
    })
    if (!upstream.ok) return NextResponse.json({ balance: 0 })
    const data = (await upstream.json()) as { balance?: unknown }
    return NextResponse.json({ balance: toAmount(data?.balance) })
  } catch {
    return NextResponse.json({ balance: 0 })
  }
}
