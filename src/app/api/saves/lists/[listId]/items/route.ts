import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type EntityType = 'STORE' | 'RESTAURANT'

/**
 * Batch add / remove venues in one hotlist (the "Add to List" modal's Done,
 * and undoing a removal). Responds with which of the touched ids are still
 * saved in any list, so the client can update hearts elsewhere.
 */
export async function POST(request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as {
    add?: { id?: string; type?: EntityType }[]
    remove?: string[]
  } | null
  const add = (body?.add ?? []).filter(
    (a): a is { id: string; type: EntityType } => !!a?.id && (a.type === 'STORE' || a.type === 'RESTAURANT'),
  )
  const remove = (body?.remove ?? []).filter((id): id is string => typeof id === 'string' && !!id)

  // the list must be the caller's
  const { data: list } = await supabase
    .from('user_hotlists')
    .select('id')
    .eq('user_id', user.id)
    .eq('id', listId)
    .maybeSingle()
  if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 })

  if (add.length) {
    const { error } = await supabase.from('user_hotlist_items').upsert(
      add.map(a => ({ hotlist_id: listId, user_id: user.id, entity_type: a.type, entity_id: a.id })),
      { onConflict: 'hotlist_id,entity_type,entity_id', ignoreDuplicates: true },
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (remove.length) {
    const { error } = await supabase
      .from('user_hotlist_items')
      .delete()
      .eq('user_id', user.id)
      .eq('hotlist_id', listId)
      .in('entity_id', remove)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const touched = [...new Set([...add.map(a => a.id), ...remove])]
  const savedAnywhere: Record<string, boolean> = Object.fromEntries(touched.map(id => [id, false]))
  if (touched.length) {
    const { data } = await supabase
      .from('user_hotlist_items')
      .select('entity_id')
      .eq('user_id', user.id)
      .in('entity_id', touched)
    for (const r of data ?? []) savedAnywhere[String(r.entity_id)] = true
  }

  return NextResponse.json({ ok: true, savedAnywhere })
}
