import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GIFTS_API = (process.env.PAYMENTS_API_URL ?? 'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '')

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json() as { code: string }
  if (!body.code?.trim()) {
    return NextResponse.json({ error: 'Gift code is required' }, { status: 400 })
  }

  try {
    const upstream = await fetch(`${GIFTS_API}/api/gifts/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ code: body.code.trim().toUpperCase() }),
      signal: AbortSignal.timeout(10000),
    })
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
