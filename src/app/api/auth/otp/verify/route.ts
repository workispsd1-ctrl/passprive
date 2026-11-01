import { NextResponse } from 'next/server'
import { AUTH_API_BASE, establishOtpSession, type OtpSessionResult } from '@/lib/otpSession'
import { CODE_LENGTH, fullPhone, normalizeLocalPhone } from '@/lib/phoneAuth'

type VerifyResult = OtpSessionResult & {
  success?: boolean
  message?: string
  error?: string
  registered?: boolean
  /** new numbers: single-use token for /api/auth/register-phone */
  signup_token?: string
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
    const res = await fetch(`${AUTH_API_BASE}/api/auth/verify-otp`, {
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
    return NextResponse.json({ error: 'Network request failed' }, { status: 503 })
  }

  const signedIn = await establishOtpSession(result)

  // A known number must end up signed in; the app treats that as a failure too.
  if (result.registered && !signedIn) {
    return NextResponse.json({ error: 'Could not sign you in. Please try again.' }, { status: 502 })
  }

  // A new number gets no session yet — the details step trades this token
  // for the account (app parity: Details.jsx → registerPhone).
  return NextResponse.json({
    registered: !!result.registered,
    signedIn,
    signupToken: result.registered ? null : (result.signup_token ?? null),
  })
}

