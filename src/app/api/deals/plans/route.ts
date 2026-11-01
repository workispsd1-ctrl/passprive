import { NextResponse } from 'next/server'
import { getRevealPlans } from '@/lib/services/merchantDeals'

/** Monthly reveal limits per plan, for the quota sheet. */
export async function GET() {
  return NextResponse.json({ plans: await getRevealPlans() })
}
