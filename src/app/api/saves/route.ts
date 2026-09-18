import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Saved (favourited) entity ids for the current user — from user_hotlist_items,
// the same table the app's savedRestaurants service uses.
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ items: [] })

  const { data } = await supabase
    .from('user_hotlist_items')
    .select('entity_id, entity_type')
    .eq('user_id', user.id)

  const items = (data ?? []).map((r) => ({
    id: String(r.entity_id),
    type: String(r.entity_type).toUpperCase() === 'STORE' ? 'STORE' : 'RESTAURANT',
  }))
  return NextResponse.json({ items })
}
