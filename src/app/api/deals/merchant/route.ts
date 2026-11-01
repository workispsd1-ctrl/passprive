import { NextResponse } from 'next/server'
import { getMerchantDeals } from '@/lib/services/merchantDeals'

/** Deal Reveal rail for a merchant page — read with the visitor's cookies (tier deals + quota). */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const restaurantId = params.get('restaurantId')
  const storeId = params.get('storeId')
  if (!restaurantId && !storeId) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  const state = await getMerchantDeals({ restaurantId, storeId })
  return NextResponse.json(state, { headers: { 'Cache-Control': 'private, no-store' } })
}
