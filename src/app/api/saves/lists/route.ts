import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const LISTS_TABLE = 'user_hotlists'
const ITEMS_TABLE = 'user_hotlist_items'

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
      .order('created_at', { ascending: true }),
    entityId
      ? supabase
          .from(ITEMS_TABLE)
          .select('hotlist_id')
          .eq('user_id', user.id)
          .eq('entity_id', entityId)
      : Promise.resolve({ data: [] as { hotlist_id: string }[] }),
  ])

  const savedIn = new Set((items ?? []).map((i) => String(i.hotlist_id)))
  return NextResponse.json({
    lists: (lists ?? []).map((l) => ({
      id: String(l.id),
      name: l.name as string,
      saved: savedIn.has(String(l.id)),
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
