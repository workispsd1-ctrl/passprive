import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Accept or decline a new time from the restaurant — app parity: BookingProposalBanner.jsx. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { accept } = (await request.json().catch(() => ({}))) as { accept?: unknown }
  if (typeof accept !== 'boolean') return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase.rpc('respond_booking_proposal', { p_booking_id: id, p_accept: accept })
  const result = data as { ok?: boolean; error?: string } | null
  if (error || !result?.ok) return NextResponse.json({ error: result?.error ?? 'failed' }, { status: 409 })
  return NextResponse.json({ ok: true })
}
