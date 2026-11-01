import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AUTH_API_BASE, establishOtpSession, type OtpSessionResult } from '@/lib/otpSession'

type RegisterResult = OtpSessionResult & {
  success?: boolean
  message?: string
  error?: string
  user_id?: string
}

/**
 * Creates the account for a new number — app parity: Details.jsx →
 * otpApi.registerPhone (POST /api/auth/register-phone with the verify step's
 * single-use signup token), then signs in and fills the users row.
 */
export async function POST(request: Request) {
  const { signupToken, fullName, email, phone } = (await request.json().catch(() => ({}))) as {
    signupToken?: string
    fullName?: string
    email?: string
    phone?: string
  }
  if (!signupToken) {
    return NextResponse.json({ error: 'Your verification has expired. Please verify your number again.' }, { status: 400 })
  }
  if (!fullName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Please fill all fields.' }, { status: 400 })
  }
  const cleanEmail = email.trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  let result: RegisterResult
  try {
    const res = await fetch(`${AUTH_API_BASE}/api/auth/register-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signup_token: signupToken, full_name: fullName.trim(), email: cleanEmail }),
      signal: AbortSignal.timeout(15000),
    })
    result = ((await res.json().catch(() => null)) ?? {}) as RegisterResult
    if (!res.ok || result.success === false) {
      // "verification has expired" / "already has an account" are shown as-is.
      return NextResponse.json(
        { error: result.message ?? result.error ?? 'Failed to save. Please try again.' },
        { status: res.ok ? 400 : res.status },
      )
    }
  } catch (err) {
    console.error('[auth/otp/register]', err)
    return NextResponse.json({ error: 'Network request failed' }, { status: 503 })
  }

  if (!(await establishOtpSession(result))) {
    return NextResponse.json({ error: 'Could not sign you in. Please try again.' }, { status: 502 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Could not sign you in. Please try again.' }, { status: 502 })

  const now = new Date().toISOString()
  const { error } = await supabase.from('users').upsert(
    {
      id: user.id,
      full_name: fullName.trim(),
      email: cleanEmail,
      phone: phone ?? user.phone ?? null,
      last_login: now,
      last_opened: now,
      updated_at: now,
    },
    { onConflict: 'id' },
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
