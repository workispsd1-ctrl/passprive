import { createClient } from '@/lib/supabase/server'

/**
 * Favourites lists ("hotlists") — the app's `user_hotlists` /
 * `user_hotlist_items` tables (services/savedRestaurants.js), resolved to the
 * cards the SavedRestaurants + SavedListDetail screens render.
 */

export type Section = 'dining' | 'wellness' | 'stores'

export type Venue = {
  id: string
  type: 'RESTAURANT' | 'STORE'
  section: Section
  name: string
  href: string
  image: string | null
  location: string | null
  category: string | null
  rating: number | null
}

export type Hotlist = {
  id: string
  name: string
  createdAt: string | null
  items: Venue[]
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Row = { hotlist_id: string; entity_id: string; entity_type: string }

function avgBy(rows: { id: string; rating: number | null }[]) {
  const acc = new Map<string, { sum: number; n: number }>()
  for (const r of rows) {
    const v = Number(r.rating)
    if (!v) continue
    const cur = acc.get(r.id) ?? { sum: 0, n: 0 }
    acc.set(r.id, { sum: cur.sum + v, n: cur.n + 1 })
  }
  return new Map([...acc].map(([id, { sum, n }]) => [id, Math.round((sum / n) * 10) / 10]))
}

/** Resolve saved entity ids to venue cards. Ids are looked up in both tables:
 *  the app infers entity_type from the tapped object, so it isn't reliable. */
async function resolveVenues(ids: string[]): Promise<Map<string, Venue>> {
  const valid = [...new Set(ids)].filter(id => UUID_RE.test(id))
  const out = new Map<string, Venue>()
  if (!valid.length) return out

  const supabase = await createClient()
  const [rests, stores, restReviews, storeReviews] = await Promise.all([
    // cuisines live in restaurant_tags (tag_type 'cuisine'), not on restaurants — as visitRewards.ts reads them
    supabase.from('restaurants').select('id, name, slug, cover_image, area, city, restaurant_tags(tag_type, tag_value)').in('id', valid),
    supabase
      .from('stores')
      .select('id, name, slug, cover_image, logo_url, category, location_name, city, store_type')
      .in('id', valid),
    supabase.from('restaurant_reviews').select('restaurant_id, rating').in('restaurant_id', valid).eq('is_approved', true),
    supabase.from('store_reviews').select('store_id, rating').in('store_id', valid).eq('is_approved', true),
  ])
  if (rests.error) console.error('[hotlists] restaurants query failed:', rests.error.message)
  if (stores.error) console.error('[hotlists] stores query failed:', stores.error.message)

  const restRating = avgBy((restReviews.data ?? []).map(r => ({ id: String(r.restaurant_id), rating: r.rating })))
  const storeRating = avgBy((storeReviews.data ?? []).map(r => ({ id: String(r.store_id), rating: r.rating })))

  for (const r of rests.data ?? []) {
    const id = String(r.id)
    const cuisines = ((r.restaurant_tags ?? []) as { tag_type: string; tag_value: string }[])
      .filter(t => t.tag_type === 'cuisine' && t.tag_value)
      .map(t => t.tag_value)
    out.set(id, {
      id,
      type: 'RESTAURANT',
      section: 'dining',
      name: r.name,
      href: `/dining/${r.slug ?? id}`,
      image: r.cover_image ?? null,
      location: [r.area, r.city].filter(Boolean).join(', ') || null,
      category: cuisines[0] ?? null,
      rating: restRating.get(id) ?? null,
    })
  }
  for (const s of stores.data ?? []) {
    const id = String(s.id)
    // store_type "SERVICE" = wellness (app parity: utils/wellnessStore.js)
    const isWellness = String(s.store_type ?? '').trim().toUpperCase() === 'SERVICE'
    out.set(id, {
      id,
      type: 'STORE',
      section: isWellness ? 'wellness' : 'stores',
      name: s.name,
      href: `/${isWellness ? 'wellness' : 'stores'}/${s.slug ?? id}`,
      image: s.cover_image ?? s.logo_url ?? null,
      location: [s.location_name, s.city].filter(Boolean).join(', ') || null,
      category: s.category ?? null,
      rating: storeRating.get(id) ?? null,
    })
  }
  return out
}

/** Every list the user has, newest first (app parity: fetchRemoteHotlistsState). */
export async function getHotlists(userId: string): Promise<Hotlist[]> {
  const supabase = await createClient()
  const [listsRes, itemsRes] = await Promise.all([
    supabase.from('user_hotlists').select('id, name, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase
      .from('user_hotlist_items')
      .select('hotlist_id, entity_id, entity_type')
      .eq('user_id', userId)
      .order('added_at', { ascending: false }),
  ])
  if (listsRes.error) console.error('[hotlists] lists query failed:', listsRes.error.message)
  if (itemsRes.error) console.error('[hotlists] items query failed:', itemsRes.error.message)

  const rows = (itemsRes.data ?? []) as Row[]
  const venues = await resolveVenues(rows.map(r => String(r.entity_id)))

  const byList = new Map<string, Venue[]>()
  for (const r of rows) {
    const v = venues.get(String(r.entity_id))
    if (!v) continue // merchant no longer exists
    const key = String(r.hotlist_id)
    const arr = byList.get(key) ?? []
    if (!arr.some(x => x.id === v.id)) arr.push(v)
    byList.set(key, arr)
  }

  return (listsRes.data ?? []).map(l => ({
    id: String(l.id),
    name: l.name as string,
    createdAt: (l.created_at as string | null) ?? null,
    items: byList.get(String(l.id)) ?? [],
  }))
}

/** One list with its venues, or null when it isn't the user's. */
export async function getHotlist(userId: string, listId: string): Promise<Hotlist | null> {
  if (!UUID_RE.test(listId)) return null
  const supabase = await createClient()
  const [listRes, itemsRes] = await Promise.all([
    supabase.from('user_hotlists').select('id, name, created_at').eq('user_id', userId).eq('id', listId).maybeSingle(),
    supabase
      .from('user_hotlist_items')
      .select('hotlist_id, entity_id, entity_type')
      .eq('user_id', userId)
      .eq('hotlist_id', listId)
      .order('added_at', { ascending: false }),
  ])
  if (!listRes.data) return null

  const rows = (itemsRes.data ?? []) as Row[]
  const venues = await resolveVenues(rows.map(r => String(r.entity_id)))
  const items = [...new Set(rows.map(r => String(r.entity_id)))]
    .map(id => venues.get(id))
    .filter((v): v is Venue => !!v)

  return {
    id: String(listRes.data.id),
    name: listRes.data.name as string,
    createdAt: (listRes.data.created_at as string | null) ?? null,
    items,
  }
}
