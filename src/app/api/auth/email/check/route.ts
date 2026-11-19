import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Whether an email already belongs to an account, so the email login flow
 * opens "Log in" (password) or "Create account" — Figma "Flow - Log in or
 * sign up_with email". Reads the public `users` row; an account that exists
 * only in Auth still surfaces at sign-up ("already registered" → password).
 */
export async function POST(request: Request) {
  const { email } = (await request.json().catch(() => ({}))) as { email?: string }
  const clean = (email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(clean) || clean.length > 254) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  // ilike for case-insensitive match; escape its wildcards so the email is literal
  const pattern = clean.replace(/[\\%_]/g, (c) => `\\${c}`)
  const { data, error } = await createAdminClient().from('users').select('id').ilike('email', pattern).limit(1)
  if (error) {
    console.error('[auth/email/check]', error.message)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ exists: (data ?? []).length > 0 })
}
