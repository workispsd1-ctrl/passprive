import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const LISTS_TABLE = 'user_hotlists'
const ITEMS_TABLE = 'user_hotlist_items'
const THUMB_COUNT = 4
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** The user's hotlists, each flagged whether it contains `entityId`. */
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ lists: [] })

  const entityId = new URL(request.url).searchParams.get('entityId')

  const [{ data: lists }, { data: items }] = await Promise.all([
    supabase
      .from(LISTS_TABLE)
      .select('id, name')
      .eq('user_id', user.id)
      // newest first — app parity: fetchRemoteHotlistsState
      .order('created_at', { ascending: false }),
    supabase
      .from(ITEMS_TABLE)
      .select('hotlist_id, entity_id')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false }),
  ])

  // per list: whether it holds `entityId`, and its newest few entities for the thumbnail stack
  const savedIn = new Set<string>()
  const firstIds = new Map<string, string[]>()
  for (const i of items ?? []) {
    const listId = String(i.hotlist_id)
    const eid = String(i.entity_id)
    if (entityId && eid === entityId) savedIn.add(listId)
    const ids = firstIds.get(listId) ?? []
    if (ids.length < THUMB_COUNT && !ids.includes(eid)) ids.push(eid)
    firstIds.set(listId, ids)
  }

  const allIds = [...new Set([...firstIds.values()].flat())].filter((id) => UUID_RE.test(id))
  const images = new Map<string, string>()
  if (allIds.length) {
    const [rests, stores] = await Promise.all([
      supabase.from('restaurants').select('id, cover_image').in('id', allIds),
      supabase.from('stores').select('id, cover_image, logo_url').in('id', allIds),
    ])
    for (const r of rests.data ?? []) if (r.cover_image) images.set(String(r.id), r.cover_image)
    for (const s of stores.data ?? []) {
      const img = s.cover_image ?? s.logo_url
      if (img) images.set(String(s.id), img)
    }
  }

  return NextResponse.json({
    lists: (lists ?? []).map((l) => ({
      id: String(l.id),
      name: l.name as string,
      saved: savedIn.has(String(l.id)),
      thumbs: (firstIds.get(String(l.id)) ?? [])
        .map((id) => images.get(id))
        .filter((u): u is string => !!u),
    })),
  })
}

/** Create a new hotlist. */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 401 })
  }

  const { name } = (await request.json()) as { name?: string }
  const clean = String(name ?? '').trim().replace(/\s+/g, ' ')
  if (!clean) {
    return NextResponse.json({ error: 'List name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from(LISTS_TABLE)
    .insert({ user_id: user.id, name: clean })
    .select('id, name')
    .single()

  if (error) {
    const dup =
      error.code === '23505' ||
      error.message.toLowerCase().includes('duplicate')
    return NextResponse.json(
      { error: dup ? 'A list with that name already exists' : error.message },
      { status: dup ? 409 : 500 },
    )
  }

  return NextResponse.json({ list: { id: String(data.id), name: data.name } })
}
