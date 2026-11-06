import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getHeaderLocation } from '@/lib/location'
import { toRpcArgs } from '@/lib/restaurantFilters'
import type { FeaturedRestaurant } from '@/lib/types/dining'
import type { StoreRow } from '@/lib/types/stores'

export type SearchStore = StoreRow & { address_line1: string | null; rating?: number | null; rating_count?: number | null }
export type SearchDataset = { restaurants: FeaturedRestaurant[]; stores: SearchStore[] }

const STORE_SELECT =
  'id, name, slug, category, subcategory, location_name, address_line1, city, logo_url, cover_image, description, lat, lng, merchant_type, merchant_plan, pay_bill_enabled, service_level, on_boarded, booking_enabled, cashback_enabled, is_promoted, is_advertised, store_type, booking_service_type, store_subscriptions(status, repeat_rewards_enabled, starts_at, expires_at), store_offers(id, title, badge_text, discount_value, offer_type)'

/**
 * Everything the search screen ranks — app parity: GlobalSearchScreen.jsx
 * `_fetchAndCache`: every restaurant and every active store (not location
 * scoped), the user's city first, then by rating.
 */
export async function GET() {
  const supabase = await createClient()
  const loc = await getHeaderLocation()
  const [feed, stores] = await Promise.all([
    supabase.rpc('restaurant_feed', toRpcArgs({}, 1000, 0, loc?.coords ?? null)),
    supabase.from('stores').select(STORE_SELECT).eq('is_active', true).limit(1000),
  ])

  const city = (loc?.city ?? '').trim().toLowerCase()
  const byCityThenRating = (a: { city?: string | null; rating?: number | null }, b: { city?: string | null; rating?: number | null }) => {
    const ac = city && (a.city ?? '').trim().toLowerCase() === city ? 1 : 0
    const bc = city && (b.city ?? '').trim().toLowerCase() === city ? 1 : 0
    return bc - ac || (Number(b.rating) || 0) - (Number(a.rating) || 0)
  }

  const body: SearchDataset = {
    restaurants: ((feed.data ?? []) as FeaturedRestaurant[]).sort(byCityThenRating),
    stores: ((stores.data ?? []) as SearchStore[]).sort(byCityThenRating),
  }
  return NextResponse.json(body, { headers: { 'Cache-Control': 'private, max-age=300' } })
}
