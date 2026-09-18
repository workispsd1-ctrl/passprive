import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ITEMS_TABLE = 'user_hotlist_items'

/** Add or remove an entity from a specific hotlist. */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 401 })
  }

  const { listId, entityId, entityType, add } = (await request.json()) as {
    listId?: string
    entityId?: string
    entityType?: 'STORE' | 'RESTAURANT'
    add?: boolean
  }
  if (
    !listId ||
    !entityId ||
    (entityType !== 'STORE' && entityType !== 'RESTAURANT')
  ) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  if (add) {
    const { error } = await supabase.from(ITEMS_TABLE).upsert(
      {
        hotlist_id: listId,
        user_id: user.id,
        entity_type: entityType,
        entity_id: entityId,
      },
      { onConflict: 'hotlist_id,entity_type,entity_id', ignoreDuplicates: true },
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase
      .from(ITEMS_TABLE)
      .delete()
      .eq('user_id', user.id)
      .eq('hotlist_id', listId)
      .eq('entity_id', entityId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, saved: !!add })
}
