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

  const upstream = await fetch(`${PAYMENTS_API}/api/payments/iveri/membership/success`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  })

  const data = await upstream.json() as Record<string, unknown>

  if (!upstream.ok) {
    return NextResponse.json(
      { error: (data?.error as string) ?? (data?.message as string) ?? 'Membership activation failed' },
      { status: upstream.status },
    )
  }

  return NextResponse.json(data)
}
