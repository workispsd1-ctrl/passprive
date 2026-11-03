import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readReceiptPhoto } from '@/lib/services/receipts'

/**
 * Reads a bill photo with the shared `receipt-ai` function — app parity:
 * utils/receipts.js aiReadReceipt. The function holds the daily limit.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to submit a receipt' }, { status: 401 })

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: 'Choose a photo of your receipt.' }, { status: 400 })
  const photo = await readReceiptPhoto(file)
  if ('error' in photo) return NextResponse.json({ error: photo.error }, { status: 400 })

  const { data, error } = await supabase.functions.invoke('receipt-ai', {
    body: { image: Buffer.from(await file.arrayBuffer()).toString('base64'), mime: file.type || 'image/jpeg' },
  })
  if (error || !data || data.error) return NextResponse.json({ error: 'unreadable' }, { status: 502 })
  return NextResponse.json(data)
}
