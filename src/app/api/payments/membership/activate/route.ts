import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAYMENTS_API = (process.env.PAYMENTS_API_URL ?? 'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '')

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Please log in to continue.' }, { status: 401 })
  }

  const body = await request.json() as { session_id: string }

  let upstream: Response
  try {
    upstream = await fetch(`${PAYMENTS_API}/api/payments/iveri/membership/success`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })
  } catch (err) {
    console.error('[membership/activate] fetch failed:', err)
    return NextResponse.json({ error: 'Payment service unavailable. Please try again.' }, { status: 503 })
  }

  const data = await upstream.json() as Record<string, unknown>

  if (!upstream.ok) {
    console.error('[membership/activate] upstream error:', JSON.stringify(data))
    return NextResponse.json(
      { error: (data?.error as string) ?? (data?.message as string) ?? 'Membership activation failed' },
      { status: upstream.status },
    )
  }

  return NextResponse.json(data)
}
