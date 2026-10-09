import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CODE_LENGTH, fullPhone, normalizeLocalPhone } from '@/lib/phoneAuth'

const API_BASE = (process.env.PAYMENTS_API_URL ?? 'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '')

type VerifyResult = {
  success?: boolean
  message?: string
  error?: string
  registered?: boolean
  session?: { access_token?: string; refresh_token?: string }
  session_token?: string
}

/**
 * Verifies the code and signs the visitor in — app parity: otpApi.verifyOtp +
 * establishSessionFromOtp. The backend's session is stored as the site's
 * normal Supabase auth cookies (setSession), with the app's fallback of
 * redeeming a single-use `session_token` hash.
 */
export async function POST(request: Request) {
  const { phone, code } = (await request.json().catch(() => ({}))) as { phone?: string; code?: string }
  const local = normalizeLocalPhone(phone ?? '')
  if (!local) return NextResponse.json({ error: 'Enter a valid Mauritian mobile number.' }, { status: 400 })
  if (!code || !new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code)) {
    return NextResponse.json({ error: 'Enter the 6-digit code.' }, { status: 400 })
  }

  let result: VerifyResult
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: fullPhone(local), code }),
      signal: AbortSignal.timeout(15000),
    })
    result = ((await res.json().catch(() => null)) ?? {}) as VerifyResult
    if (!res.ok || result.success === false) {
      return NextResponse.json({ error: result.message ?? result.error ?? 'invalid code' }, { status: 400 })
    }
  } catch (err) {
    console.error('[auth/otp/verify]', err)
    return NextResponse.json({ error: 'network error' }, { status: 503 })
  }

  const supabase = await createClient()
  let signedIn = false
  if (result.session?.access_token && result.session.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    })
    signedIn = !error && !!data.session
  }
  if (!signedIn && result.session_token) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: result.session_token, type: 'magiclink' })
    signedIn = !error && !!data.session
  }

  // A known number must end up signed in; the app treats that as a failure too.
  if (result.registered && !signedIn) {
    return NextResponse.json({ error: 'Could not sign you in. Please try again.' }, { status: 502 })
  }

  return NextResponse.json({ registered: !!result.registered, signedIn })
}
