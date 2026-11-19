import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Accept or decline a merchant's new time — app parity: BookingProposalBanner.jsx
 * useProposalResponse (b2ff80a: `respond_store_proposal` for store appointments).
 * When accepting leaves a cover charge to pay (`status: 'cover_requested'`), the
 * amount due comes back too, so the page can go straight to payment.
 */
export async function respondToProposal(request: Request, kind: 'restaurant' | 'store', id: string) {
  const { accept } = (await request.json().catch(() => ({}))) as { accept?: unknown }
  if (typeof accept !== 'boolean') return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = kind === 'store'
    ? await supabase.rpc('respond_store_proposal', { p_order_id: id, p_accept: accept })
    : await supabase.rpc('respond_booking_proposal', { p_booking_id: id, p_accept: accept })
  const result = data as { ok?: boolean; error?: string; status?: string } | null
  if (error || !result?.ok) return NextResponse.json({ error: result?.error ?? 'failed' }, { status: 409 })

  const coverRequested = accept && result.status === 'cover_requested'
  let coverDue = 0
  if (coverRequested) {
    // app parity: ProposalRequestBox payAfterAccept — the amount now asked for on the booking
    const { data: row } = await supabase
      .from(kind === 'store' ? 'store_orders' : 'restaurant_bookings')
      .select('cover_request_amount')
      .eq('id', id)
      .maybeSingle()
    coverDue = Number(row?.cover_request_amount) || 0
  }
  return NextResponse.json({ ok: true, status: result.status ?? null, coverRequested, coverDue })
}
