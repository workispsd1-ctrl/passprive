import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ITEMS_TABLE = 'user_hotlist_items'
const LISTS_TABLE = 'user_hotlists'
const DEFAULT_LIST_NAME = 'All Saves'

/**
 * Toggle a favourite — ported from the app's `toggleSavedRestaurant`.
 * Runs server-side so it uses the (httpOnly) auth cookies.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Please log in to save.' }, { status: 401 })
  }

  const { entityId, entityType } = (await request.json()) as {
    entityId?: string
    entityType?: 'STORE' | 'RESTAURANT'
  }
  if (!entityId || (entityType !== 'STORE' && entityType !== 'RESTAURANT')) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const { data: existing, error: selErr } = await supabase
    .from(ITEMS_TABLE)
    .select('id')
    .eq('user_id', user.id)
    .eq('entity_id', entityId)
    .limit(1)
  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 })
  }

  if (existing && existing.length) {
    const { error } = await supabase
      .from(ITEMS_TABLE)
      .delete()
      .eq('user_id', user.id)
      .eq('entity_id', entityId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ saved: false })
  }

  // find or create the user's default hotlist
  let hotlistId: string | null = null
  const { data: lists } = await supabase
    .from(LISTS_TABLE)
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
  if (lists?.[0]?.id) {
    hotlistId = String(lists[0].id)
  } else {
    const { data: created, error } = await supabase
      .from(LISTS_TABLE)
      .insert({ user_id: user.id, name: DEFAULT_LIST_NAME })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    hotlistId = created?.id ? String(created.id) : null
  }
  if (!hotlistId) {
    return NextResponse.json({ error: 'Unable to save right now' }, { status: 500 })
  }

  const { error: insErr } = await supabase.from(ITEMS_TABLE).insert({
    hotlist_id: hotlistId,
    user_id: user.id,
    entity_type: entityType,
    entity_id: entityId,
  })
  if (insErr && insErr.code !== '23505') {
    return NextResponse.json({ error: insErr.message }, { status: 500 })
  }
  return NextResponse.json({ saved: true })
}
