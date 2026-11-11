import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Delete one of the user's hotlists and everything saved in it. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })

  const deleteList = () =>
    supabase.from('user_hotlists').delete().eq('user_id', user.id).eq('id', listId).select('id')
  const deleteItems = () =>
    supabase.from('user_hotlist_items').delete().eq('user_id', user.id).eq('hotlist_id', listId)

  let { data, error } = await deleteList()
  // items reference the list — if the FK doesn't cascade, clear them and retry
  if (error?.code === '23503') {
    const itemsRes = await deleteItems()
    if (itemsRes.error) return NextResponse.json({ error: itemsRes.error.message }, { status: 500 })
    ;({ data, error } = await deleteList())
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // RLS denials delete nothing without erroring — report it so the UI restores the list
  if (!data?.length) return NextResponse.json({ error: 'List could not be deleted' }, { status: 403 })

  // with a cascading FK this is a no-op; otherwise don't leave orphans behind
  await deleteItems()
  return NextResponse.json({ ok: true })
}
