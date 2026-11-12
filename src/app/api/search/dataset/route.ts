import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'
import { cachedCatalog, unwrap } from '@/lib/catalogCache'
import { getHeaderLocation } from '@/lib/location'
import { toRpcArgs } from '@/lib/restaurantFilters'
import type { FeaturedRestaurant } from '@/lib/types/dining'
import type { StoreRow } from '@/lib/types/stores'

export type SearchStore = StoreRow & { address_line1: string | null; rating?: number | null; rating_count?: number | null }
export type SearchDataset = { restaurants: FeaturedRestaurant[]; stores: SearchStore[] }

const STORE_SELECT =
  'id, name, slug, category, subcategory, location_name, address_line1, city, logo_url, cover_image, description, lat, lng, merchant_type, merchant_plan, pay_bill_enabled, service_level, on_boarded, booking_enabled, cashback_enabled, is_promoted, is_advertised, store_type, booking_service_type, store_subscriptions(status, repeat_rewards_enabled, starts_at, expires_at), store_offers(id, title, badge_text, discount_value, offer_type)'

/**
 * Every restaurant and every active store, shared by all visitors. The feed is
 * read without coordinates: the 1000 cap already covers every restaurant, and
 * the search screen measures distance itself from each row's lat/lng
 * (searchItems.ts), so one copy serves every location.
 */
const getSearchCatalog = cachedCatalog('search-dataset', async (): Promise<SearchDataset> => {
  const supabase = createPublicClient()
  const [feed, stores] = await Promise.all([
    supabase.rpc('restaurant_feed', toRpcArgs({}, 1000, 0, null)),
    supabase.from('stores').select(STORE_SELECT).eq('is_active', true).limit(1000),
  ])
  return {
    restaurants: (unwrap(feed) ?? []) as FeaturedRestaurant[],
    stores: (unwrap(stores) ?? []) as unknown as SearchStore[],
  }
}, { restaurants: [], stores: [] })

/**
 * Everything the search screen ranks — app parity: GlobalSearchScreen.jsx
 * `_fetchAndCache`: every restaurant and every active store (not location
 * scoped), the user's city first, then by rating.
 */
export async function GET() {
  const [catalog, loc] = await Promise.all([getSearchCatalog(), getHeaderLocation()])

  const city = (loc?.city ?? '').trim().toLowerCase()
  const byCityThenRating = (a: { city?: string | null; rating?: number | null }, b: { city?: string | null; rating?: number | null }) => {
    const ac = city && (a.city ?? '').trim().toLowerCase() === city ? 1 : 0
    const bc = city && (b.city ?? '').trim().toLowerCase() === city ? 1 : 0
    return bc - ac || (Number(b.rating) || 0) - (Number(a.rating) || 0)
  }

  const body: SearchDataset = {
    restaurants: catalog.restaurants.sort(byCityThenRating),
    stores: catalog.stores.sort(byCityThenRating),
  }
  return NextResponse.json(body, { headers: { 'Cache-Control': 'private, max-age=300' } })
}
