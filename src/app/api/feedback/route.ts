import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** "Share feedback" — app parity: FeedbackScreen.jsx (one per person, stored with the rating). */
export async function POST(request: Request) {
  const { rating, message } = (await request.json().catch(() => ({}))) as { rating?: number; message?: string }
  const text = String(message ?? '').trim()
  if (!Number.isInteger(rating) || Number(rating) < 1 || Number(rating) > 5 || !text) {
    return NextResponse.json({ error: 'Choose a rating and write a message.' }, { status: 400 })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in to continue.' }, { status: 401 })

  const { data: existing } = await supabase.from('feedback').select('id').eq('user_id', user.id).limit(1)
  if (existing?.length) return NextResponse.json({ alreadyGiven: true })

  const { error } = await supabase.from('feedback').insert({
    user_id: user.id,
    user_email: user.email ?? null,
    user_name: user.user_metadata?.full_name ?? null,
    message: `Rating: ${rating}/5\n\n${text}`,
  })
  if (error) return NextResponse.json({ error: 'Could not send your feedback. Please try again.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
