import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AUTH_API_BASE } from '@/lib/otpSession'
import { CODE_LENGTH, fullPhone, normalizeLocalPhone } from '@/lib/phoneAuth'

/**
 * Moves the signed-in account to a new, verified number — app parity:
 * otpApi.changePhone → POST /api/auth/change-phone with the Supabase access
 * token. The code was texted by /api/auth/otp/send.
 */
export async function POST(request: Request) {
  const { phone, code } = (await request.json().catch(() => ({}))) as { phone?: string; code?: string }
  const local = normalizeLocalPhone(phone ?? '')
  if (!local) return NextResponse.json({ error: 'invalid phone' }, { status: 400 })
  if (!code || !new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code)) {
    return NextResponse.json({ error: 'Enter the 6-digit code.' }, { status: 400 })
  }

  const supabase = await createClient()
  // getUser validates the token with Supabase; the session then carries it to the backend
  const { data: { user } } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()
  if (!user || !session?.access_token) {
    return NextResponse.json({ error: 'Your session has expired. Please log in again.' }, { status: 401 })
  }

  try {
    const res = await fetch(`${AUTH_API_BASE}/api/auth/change-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ phone: fullPhone(local), code }),
      signal: AbortSignal.timeout(15000),
    })
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null
    if (!res.ok || data?.success === false) {
      return NextResponse.json(
        { error: (data?.message as string) ?? (data?.error as string) ?? `Request failed (${res.status})` },
        { status: res.ok ? 400 : res.status },
      )
    }
    return NextResponse.json({ ok: true, phone: fullPhone(local) })
  } catch (err) {
    console.error('[auth/otp/change-phone]', err)
    return NextResponse.json({ error: 'Network request failed' }, { status: 503 })
  }
}
