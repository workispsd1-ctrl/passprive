import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { creditCashback, getUserCashbackInfo } from '@/lib/services/wallet'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    bill_amount: number
    restaurant_id?: string
    store_id?: string
  }

  if (!body.bill_amount || body.bill_amount <= 0) {
    return NextResponse.json({ error: 'Invalid bill_amount' }, { status: 400 })
  }

  const cashbackInfo = await getUserCashbackInfo(user.id, body.restaurant_id)
  if (!cashbackInfo) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (cashbackInfo.cashback_rate === 0) {
    return NextResponse.json(
      { error: 'This restaurant is not a PassPrivé partner. No cashback is available.' },
      { status: 400 },
    )
  }

  const cashbackAmount = Math.round((body.bill_amount * cashbackInfo.cashback_rate / 100) * 100) / 100

  const { error } = await creditCashback(
    user.id,
    cashbackAmount,
    body.restaurant_id,
    body.store_id,
  )

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({
    cashback_credited: cashbackAmount,
    cashback_rate: cashbackInfo.cashback_rate,
  })
}
