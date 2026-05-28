import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { topic, name, email, mobile, message } = await request.json()

  if (!topic || !name || !email || !mobile || !message) {
    return Response.json({ error: 'All fields are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from('support_requests').insert({
    topic,
    name,
    email,
    mobile,
    message,
  })

  if (error) {
    return Response.json({ error: 'Failed to submit request' }, { status: 500 })
  }

  return Response.json({ ok: true }, { status: 201 })
}
