import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { REVEAL_KINDS, type RedeemResult, type RevealKind } from '@/lib/deals'

type Body = {
  action?: 'precheck' | 'reveal' | 'pin_status' | 'pin' | 'nfc'
  kind?: string
  id?: string
  pin?: string
  token?: string
}

const FAILED = 'Could not redeem this deal right now. Please try again.'

function row<T>(data: unknown): T | null {
  return ((Array.isArray(data) ? data[0] : data) as T | undefined) ?? null
}

/**
 * Deal Reveal / redeem RPCs — app parity: dealReveals.js redeemPrecheck /
 * fetchRedeemPinStatus / redeemWithPin and nfcRedeem.js redeemWithNfc. The
 * RPCs do every check (quota, per-merchant limit, PIN lockout) server-side.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ allowed: false, reason: 'Please sign in to redeem this deal.', signedOut: true }, { status: 401 })

  if (body.action === 'pin_status') {
    const { data, error } = await supabase.rpc('redeem_pin_status')
    return NextResponse.json(error ? {} : (row<{ locked_until?: string | null }>(data) ?? {}))
  }

  const kind = body.kind as RevealKind
  if (!REVEAL_KINDS.includes(kind) || !body.id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  if (body.action === 'precheck') {
    const { data, error } = await supabase.rpc('redeem_precheck', { p_kind: kind, p_id: body.id })
    // No verdict → let the reveal through; redeeming re-checks (app parity).
    return NextResponse.json(error ? null : row<RedeemResult>(data))
  }

  if (body.action === 'reveal') {
    // app parity: dealReveals.js revealDealPercent — the server picks the
    // percent within the viewer's plan cap; null means "try again".
    const { data, error } = await supabase.rpc('reveal_deal_percent', { p_kind: kind, p_id: body.id })
    const percent = error ? 0 : Number(row<{ percent?: number | string }>(data)?.percent)
    return NextResponse.json({ percent: percent > 0 ? percent : null })
  }

  let res
  if (body.action === 'pin') {
    if (!/^\d{4}$/.test(String(body.pin ?? ''))) return NextResponse.json({ allowed: false, reason: 'incorrect pin' })
    res = await supabase.rpc('redeem_with_pin', { p_kind: kind, p_id: body.id, p_pin: String(body.pin) })
  } else if (body.action === 'nfc') {
    if (!/^[a-f0-9]{64}$/i.test(String(body.token ?? ''))) return NextResponse.json({ allowed: false, reason: 'unknown tag' })
    res = await supabase.rpc('redeem_with_nfc', { p_kind: kind, p_id: body.id, p_token: String(body.token).toLowerCase() })
  } else {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  if (res.error) {
    const signedOut = res.error.code === '42501' || /permission denied|sign in/i.test(res.error.message || '')
    return NextResponse.json({ allowed: false, reason: signedOut ? 'Please sign in to redeem this deal.' : FAILED })
  }
  return NextResponse.json(row<RedeemResult>(res.data) ?? { allowed: false, reason: FAILED })
}
