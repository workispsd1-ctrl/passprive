import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const API_BASE = (process.env.PAYMENTS_API_URL ?? 'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '')

/**
 * POSTs to the PassPrivé backend as the signed-in user and relays the answer —
 * same Bearer-token calls the app makes from utils/restaurantBookingApi.js /
 * utils/storeBookingApi.js.
 */
export async function proxyUpstreamPost(path: string, body: unknown, tag: string): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Please log in to complete your booking.' }, { status: 401 })
  }

  let upstream: Response
  try {
    upstream = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })
  } catch (err) {
    console.error(`[${tag}] fetch failed:`, err)
    return NextResponse.json({ error: 'Booking service unavailable. Please try again.' }, { status: 503 })
  }

  const data = (await upstream.json().catch(() => null)) as Record<string, unknown> | null
  if (!upstream.ok) {
    console.error(`[${tag}] upstream error:`, JSON.stringify(data))
    return NextResponse.json(
      { error: (data?.error as string) ?? (data?.message as string) ?? `Booking request failed (${upstream.status})` },
      { status: upstream.status },
    )
  }
  return NextResponse.json(data ?? {})
}
