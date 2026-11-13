import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Decline a merchant's cover-charge request, which cancels the booking —
 * app parity: CoverRequestBox `respond_cover_request` / `respond_store_cover_request`.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { id?: string; kind?: string } | null
  if (!body?.id || (body.kind !== 'restaurant' && body.kind !== 'store')) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = body.kind === 'store'
    ? await supabase.rpc('respond_store_cover_request', { p_order_id: body.id, p_accept: false })
    : await supabase.rpc('respond_cover_request', { p_booking_id: body.id, p_accept: false })
  const result = data as { ok?: boolean; error?: string } | null
  if (error || !result?.ok) return NextResponse.json({ error: result?.error ?? 'failed' }, { status: 409 })
  return NextResponse.json({ ok: true })
}
