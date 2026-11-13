import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Does a referral code exist? — app parity: utils/referral.js checkReferralCode
 * (`check_referral_code`). The signup details step calls it before the account
 * exists, so no login is required, as in the app.
 */
export async function POST(request: Request) {
  const { code } = (await request.json().catch(() => ({}))) as { code?: unknown }
  const value = String(code ?? '').trim().toUpperCase().slice(0, 12)
  if (!value) return NextResponse.json({ valid: false })
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('check_referral_code', { p_code: value })
  if (error) return NextResponse.json({ error: 'Could not check that code.' }, { status: 502 })
  return NextResponse.json({ valid: !!data })
}
