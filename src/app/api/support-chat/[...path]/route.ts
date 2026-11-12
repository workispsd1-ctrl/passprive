import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const API_BASE = (process.env.PAYMENTS_API_URL ?? 'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '')

/**
 * Support chat relay — app parity: utils/supportChatApi.js. The browser can't
 * read the httpOnly auth cookie, so these calls go through here and carry the
 * signed-in user's token; guests pass the app's `guest_identifier` instead.
 *
 *   POST session              → /api/support-chat/session
 *   POST message              → /api/support-chat/message
 *   GET  conversation/:chatId → /api/support-chat/conversation/:chatId
 *   GET  bookings?limit=N     → the user's recent bookings for the opening prompt
 */
async function relay(req: NextRequest, path: string[], method: 'GET' | 'POST') {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  let target: string | null = null
  if (method === 'POST' && path.length === 1 && (path[0] === 'session' || path[0] === 'message')) {
    target = `/api/support-chat/${path[0]}`
  } else if (method === 'GET' && path.length === 2 && path[0] === 'conversation') {
    const guest = req.nextUrl.searchParams.get('guest_identifier')
    target = `/api/support-chat/conversation/${encodeURIComponent(path[1])}`
    if (!session && guest) target += `?guest_identifier=${encodeURIComponent(guest)}`
  }
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' }
  if (session) headers.Authorization = `Bearer ${session.access_token}`

  let body: string | undefined
  if (method === 'POST') {
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    // a signed-in user is identified by the token, never by a guest id
    if (session) delete payload.guest_identifier
    body = JSON.stringify(payload)
  }

  let upstream: Response
  try {
    upstream = await fetch(`${API_BASE}${target}`, { method, headers, body, signal: AbortSignal.timeout(20000), cache: 'no-store' })
  } catch {
    return NextResponse.json({ error: 'Support chat is unavailable right now.' }, { status: 503 })
  }
  const data = await upstream.json().catch(() => null)
  return NextResponse.json(data ?? {}, { status: upstream.status })
}

function titleCaseStatus(value: unknown) {
  const cleaned = String(value || '').trim().replace(/[_-]+/g, ' ')
  return cleaned ? cleaned.replace(/\b\w/g, c => c.toUpperCase()) : 'Pending'
}

/** app parity: SupportChatScreen loadBookingOptions — the user's own dining bookings and store orders. */
async function bookings(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ options: [], hasMore: false })
  const limit = Math.min(60, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 3))

  const [dining, store] = await Promise.all([
    supabase.from('restaurant_bookings').select('id, status, booking_code, created_at, restaurants(name)')
      .eq('customer_user_id', user.id).order('created_at', { ascending: false }).limit(limit),
    supabase.from('store_orders').select('id, status, created_at, stores(name)')
      .eq('customer_user_id', user.id).order('created_at', { ascending: false }).limit(limit),
  ])
  type Row = { id: string; status: string | null; created_at: string; booking_code?: string | null; restaurants?: { name?: string } | null; stores?: { name?: string } | null }
  const diningRows = (dining.data ?? []) as unknown as Row[]
  const storeRows = (store.data ?? []) as unknown as Row[]
  const options = [
    ...diningRows.map(r => ({ id: `dine-${r.id}`, title: r.restaurants?.name || 'Restaurant', statusLabel: titleCaseStatus(r.status), bookingRef: r.booking_code || r.id, createdAt: r.created_at })),
    ...storeRows.map(r => ({ id: `store-${r.id}`, title: r.stores?.name || 'Store', statusLabel: titleCaseStatus(r.status), bookingRef: r.id, createdAt: r.created_at })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return NextResponse.json({ options, hasMore: diningRows.length === limit || storeRows.length === limit })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  if (path.length === 1 && path[0] === 'bookings') return bookings(req)
  return relay(req, path, 'GET')
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return relay(req, (await params).path, 'POST')
}
