import { NextResponse } from 'next/server'
import { fullPhone, normalizeLocalPhone } from '@/lib/phoneAuth'

const API_BASE = (process.env.PAYMENTS_API_URL ?? 'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '')

/** Texts a login code — app parity: otpApi.sendOtp → POST /api/auth/send-otp. */
export async function POST(request: Request) {
  const { phone } = (await request.json().catch(() => ({}))) as { phone?: string }
  const local = normalizeLocalPhone(phone ?? '')
  if (!local) return NextResponse.json({ error: 'Enter a valid Mauritian mobile number.' }, { status: 400 })

  try {
    const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: fullPhone(local) }),
      signal: AbortSignal.timeout(15000),
    })
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null
    if (!res.ok || data?.success === false) {
      return NextResponse.json(
        { error: (data?.message as string) ?? (data?.error as string) ?? 'Failed to send the code. Please try again.' },
        { status: res.ok ? 400 : res.status },
      )
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[auth/otp/send]', err)
    return NextResponse.json({ error: 'No connection. Check your internet and try again.' }, { status: 503 })
  }
}
