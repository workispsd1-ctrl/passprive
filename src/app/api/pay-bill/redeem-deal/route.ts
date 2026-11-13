import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Redeem a deal onto the bill being paid — app parity: dealReveals.js
 * `redeemDealForBill` (`redeem_deal_for_bill`). Answers `{ allowed, reason }`.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { kind?: string; id?: string } | null
  if (!body?.kind || !body.id) return NextResponse.json({ allowed: false, reason: 'Missing deal' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ allowed: false, reason: 'Please log in' }, { status: 401 })

  const { data, error } = await supabase.rpc('redeem_deal_for_bill', { p_kind: body.kind, p_id: body.id })
  if (error) return NextResponse.json({ allowed: false, reason: 'Could not redeem this deal. Please try again.' })
  const row = ((Array.isArray(data) ? data[0] : data) ?? { allowed: false, reason: '' }) as { allowed?: boolean; reason?: string }
  return NextResponse.json({ allowed: !!row.allowed, reason: row.reason ?? '' })
}
