import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { debitWallet } from '@/lib/services/wallet'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { amount: number; restaurant_id?: string }

  if (!body.amount || body.amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const { error } = await debitWallet(user.id, body.amount, body.restaurant_id)

  if (error) {
    return NextResponse.json({ error }, { status: 400 })
  }

  return NextResponse.json({ paid: body.amount })
}
