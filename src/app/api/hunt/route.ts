import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Lemon hunt — app parity: utils/treasureHunt.js. GET → `treasure_hunt_state`
 * (the live hunt, its spots and what this member found); POST { hunt, spot } →
 * `claim_treasure_spot`. Signed-in members only, as in the app.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(null)
  const { data, error } = await supabase.rpc('treasure_hunt_state')
  if (error) return NextResponse.json({ error: 'unavailable' }, { status: 502 })
  return NextResponse.json(data ?? null, { headers: { 'Cache-Control': 'private, no-store' } })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, code: 'SIGNED_OUT' }, { status: 401 })
  const { hunt, spot } = (await request.json().catch(() => ({}))) as { hunt?: unknown; spot?: unknown }
  if (!hunt || !spot) return NextResponse.json({ ok: false, code: 'BAD_SPOT' })
  const { data, error } = await supabase.rpc('claim_treasure_spot', { p_hunt: hunt, p_spot: spot })
  if (error) return NextResponse.json({ ok: false }, { status: 502 })
  return NextResponse.json(data ?? { ok: false })
}
