import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Sets a new password for the signed-in account — the reset link signs the
 * user in via /api/auth/callback first. Server-side so it uses the auth cookies
 * (app parity: ResetPassword.jsx → supabase.auth.updateUser).
 */
export async function POST(request: Request) {
  const { password } = (await request.json().catch(() => ({}))) as { password?: string }
  if (!password) return NextResponse.json({ error: 'Please enter a new password.' }, { status: 400 })

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims?.sub) {
    return NextResponse.json({ error: 'This reset link has expired. Request a new one from the login pop-up.' }, { status: 401 })
  }
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return NextResponse.json({ error: error.message || 'Could not reset your password.' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
