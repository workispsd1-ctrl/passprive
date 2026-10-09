import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * "Almost there" step for a new number — app parity: screens/Details.jsx
 * (users row: full_name, email, phone). Needs the session from verify-otp.
 */
export async function POST(request: Request) {
  const { fullName, email, phone } = (await request.json().catch(() => ({}))) as {
    fullName?: string
    email?: string
    phone?: string
  }
  if (!fullName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Please fill all fields.' }, { status: 400 })
  }
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Your session has expired. Please verify your number again.' }, { status: 401 })
  }

  const now = new Date().toISOString()
  const { error } = await supabase.from('users').upsert(
    {
      id: user.id,
      full_name: fullName.trim(),
      email: email.trim(),
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
