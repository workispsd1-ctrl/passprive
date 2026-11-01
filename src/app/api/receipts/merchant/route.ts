import { NextResponse } from 'next/server'
import { getReceiptMerchantState } from '@/lib/services/receipts'

/** Receipt cashback banner state for a merchant page (quote, latest claim, Black plan). */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const restaurantId = params.get('restaurantId')
  const storeId = params.get('storeId')
  if (!restaurantId && !storeId) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  const state = await getReceiptMerchantState({ restaurantId, storeId })
  return NextResponse.json(state, { headers: { 'Cache-Control': 'private, no-store' } })
}
