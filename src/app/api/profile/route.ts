import { NextResponse } from 'next/server'
import { getProfileSummary } from '@/lib/services/profileSummary'

/** Data for the profile drawer (loaded when it opens). */
export async function GET() {
  const summary = await getProfileSummary()
  if (!summary) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })
  return NextResponse.json(summary, { headers: { 'Cache-Control': 'no-store' } })
}
