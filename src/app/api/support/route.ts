import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { topic, name, email, mobile, message } = await request.json()

  if (!topic || !name || !email || !mobile || !message) {
    return Response.json({ error: 'All fields are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const fullMessage = mobile ? `Mobile: ${mobile}\n\n${message}` : message

  const { error } = await supabase.from('feedback').insert({
    category: topic,
    user_name: name,
    user_email: email,
    message: fullMessage,
    user_id: user?.id ?? null,
  })

  if (error) {
    return Response.json({ error: 'Failed to submit request' }, { status: 500 })
  }

  return Response.json({ ok: true }, { status: 201 })
}
