import { createClient } from '@/lib/supabase/server'

export type SavedItem = {
  id: string
  type: 'RESTAURANT' | 'STORE'
  /** 'dining' | 'wellness' | 'stores' */
  section: 'dining' | 'wellness' | 'stores'
  name: string
  href: string
  image: string | null
  meta: string | null
  tagline: string | null
}

const WELLNESS_CATEGORY = 'salon & wellness'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Everything the user has favourited, resolved to cards — the same
 * `user_hotlist_items` rows the app's SavedRestaurants screen reads, split
 * into dining / wellness (category "Salon & Wellness") / other stores.
 */
export async function getSavedItems(userId: string): Promise<SavedItem[]> {
  const supabase = await createClient()
  const { data: rows, error } = await supabase
    .from('user_hotlist_items')
    .select('entity_id, entity_type')
    .eq('user_id', userId)
  if (error) console.error('[savedItems] hotlist query failed:', error.message)
  if (!rows?.length) return []

  const order = rows.map(r => String(r.entity_id))
  // Look every id up in both tables: the app infers entity_type from the
  // tapped object, so a restaurant can be stored as STORE (and vice versa).
  // Non-UUID ids would make Postgres reject the whole `in` filter, so drop them.
  const ids = [...new Set(order)].filter(id => UUID_RE.test(id))
  if (!ids.length) return []

  const [restaurantsRes, storesRes] = await Promise.all([
    supabase.from('restaurants').select('id, name, slug, cover_image, area, city').in('id', ids),
    supabase.from('stores').select('id, name, slug, cover_image, category, subcategory, location_name, city').in('id', ids),
  ])
  if (restaurantsRes.error) console.error('[savedItems] restaurants query failed:', restaurantsRes.error.message)
  if (storesRes.error) console.error('[savedItems] stores query failed:', storesRes.error.message)

  const items = new Map<string, SavedItem>()
  for (const r of restaurantsRes.data ?? []) {
    items.set(String(r.id), {
      id: String(r.id),
      type: 'RESTAURANT',
      section: 'dining',
      name: r.name,
      href: `/dining/${r.slug ?? r.id}`,
      image: r.cover_image ?? null,
      meta: [r.area, r.city].filter(Boolean).join(', ') || null,
      tagline: null,
    })
  }
  for (const s of storesRes.data ?? []) {
    const isWellness = (s.category ?? '').trim().toLowerCase() === WELLNESS_CATEGORY
    items.set(String(s.id), {
      id: String(s.id),
      type: 'STORE',
      section: isWellness ? 'wellness' : 'stores',
      name: s.name,
      href: `/${isWellness ? 'wellness' : 'stores'}/${s.slug ?? s.id}`,
      image: s.cover_image ?? null,
      meta: s.location_name ?? s.city ?? null,
      tagline: [s.category, s.subcategory].filter(Boolean).join(', ') || null,
    })
  }

  // keep the saved order, drop anything that no longer exists
  return [...new Set(order)].map(id => items.get(id)).filter((i): i is SavedItem => !!i)
}
