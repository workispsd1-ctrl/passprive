import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Refer a friend — app parity: utils/referral.js. GET → `my_referral` (code,
 * amounts, progress); POST { code } → `apply_referral_code`. Both run as the
 * signed-in user, whose session lives in the httpOnly cookie.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })
  const { data, error } = await supabase.rpc('my_referral')
  if (error) return NextResponse.json({ error: 'Could not load your referral.' }, { status: 502 })
  return NextResponse.json(data ?? null, { headers: { 'Cache-Control': 'private, no-store' } })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })
  const { code } = (await request.json().catch(() => ({}))) as { code?: unknown }
  const value = String(code ?? '').trim().toUpperCase().slice(0, 12)
  if (!value) return NextResponse.json({ ok: false, code: 'NOT_FOUND' })
  const { data, error } = await supabase.rpc('apply_referral_code', { p_code: value })
  if (error) return NextResponse.json({ error: 'Could not add that code.' }, { status: 502 })
  return NextResponse.json(data ?? null)
}
