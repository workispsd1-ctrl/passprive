import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { cachedCatalog, unwrap } from '@/lib/catalogCache'
import { floorLabel, isInMall, sortMalls, type Mall } from '@/lib/malls'
import { haversineKm } from '@/lib/utils'
import type { Coords } from '@/lib/locationCookie'
import type { FeaturedRestaurant } from '@/lib/types/dining'
import type { StoreRow } from '@/lib/types/stores'

const MALL_SELECT = 'id, name, slug, description, cover_image, logo_url, location_name, city, lat, lng, google_place_id, phone, parking_available, amenities, opening_hours, sort_order'
const STORE_SELECT = 'id, name, slug, category, subcategory, location_name, city, logo_url, cover_image, description, lat, lng, merchant_type, merchant_plan, pay_bill_enabled, service_level, on_boarded, booking_enabled, cashback_enabled, is_promoted, store_type, is_top_brand, full_address, address_line1, store_offers(id, title, badge_text, discount_value, offer_type)'
const FEED_LIMIT = 500

export type MallStore = StoreRow & { floor: string | null; is_top_brand: boolean | null }
export type MallPlaces = { dining: FeaturedRestaurant[]; shopping: MallStore[]; wellness: MallStore[] }

const withDistance = (mall: Mall, coords?: Coords | null): Mall => ({
  ...mall,
  distance: coords && mall.lat != null && mall.lng != null ? haversineKm(coords.lat, coords.lng, Number(mall.lat), Number(mall.lng)) : null,
})

/**
 * The rail's title, or null while the section is off — app parity:
 * useSectionOrder("Home Screen"): malls show only when enabled there, and aren't
 * in the app's default sections, so a failed read hides them too.
 */
export const getMallsSectionTitle = cachedCatalog('malls-section-title', async (): Promise<string | null> => {
  const supabase = createPublicClient()
  const screen = unwrap(await supabase.from('session_sorting').select('id').eq('name', 'Home Screen').maybeSingle())
  if (!screen) return null
  const data = unwrap(await supabase
    .from('session_sorting_titles')
    .select('title')
    .eq('screen_id', screen.id)
    .eq('section_key', 'malls')
    .eq('enabled', true)
    .maybeSingle())
  return data ? data.title || 'Explore Malls' : null
}, null)

const getMallRows = cachedCatalog('malls', async (): Promise<Mall[]> =>
  (unwrap(await createPublicClient().from('malls').select(MALL_SELECT).eq('is_active', true)) ?? []) as Mall[], [])

/** The malls rail, nearest first — app parity: components/Home/MallsNearYou.jsx. */
export async function getActiveMalls(coords?: Coords | null): Promise<Mall[]> {
  return sortMalls((await getMallRows()).map(m => withDistance(m, coords)))
}

type MallRestaurantRow = { id: string; full_address: string | null; area: string | null; latitude: number | null; longitude: number | null }
type MallStoreRow = StoreRow & { store_type: string | null; is_top_brand: boolean | null; full_address: string | null; address_line1: string | null }

/** Every active restaurant's address/coords — the same for every mall page, so shared. */
const getRestaurantLocations = cachedCatalog('restaurant-locations', async (): Promise<MallRestaurantRow[]> =>
  (unwrap(await createPublicClient().from('restaurants').select('id, full_address, area, latitude, longitude').eq('is_active', true)) ?? []) as MallRestaurantRow[], [])

const getMallCandidateStores = cachedCatalog('mall-stores', async (): Promise<MallStoreRow[]> =>
  (unwrap(await createPublicClient().from('stores').select(STORE_SELECT).eq('is_active', true)) ?? []) as unknown as MallStoreRow[], [])

export async function getMallBySlugOrId(slugOrId: string, coords?: Coords | null): Promise<Mall | null> {
  const supabase = await createClient()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)
  const { data } = await supabase
    .from('malls')
    .select(MALL_SELECT)
    .eq(isUuid ? 'id' : 'slug', slugOrId)
    .eq('is_active', true)
    .maybeSingle()
  return data ? withDistance(data as Mall, coords) : null
}

/** What's inside — app parity: MallDetails.jsx loadMallPlaces. */
export async function getMallPlaces(mall: Mall, coords?: Coords | null): Promise<MallPlaces> {
  const supabase = await createClient()
  const [restaurantRows, storeRows, { data: links }, { data: feed }] = await Promise.all([
    getRestaurantLocations(),
    getMallCandidateStores(),
    supabase.from('mall_stores').select('store_id, floor').eq('mall_id', mall.id),
    supabase.rpc('restaurant_feed', {
      in_lat: coords?.lat ?? null,
      in_lng: coords?.lng ?? null,
      in_limit: FEED_LIMIT,
      in_offset: 0,
      in_sort: coords ? 'distance' : 'newest',
    }),
  ])

  const inside = new Set(
    restaurantRows
      .filter(r => isInMall({ address: [r.full_address, r.area], lat: r.latitude, lng: r.longitude }, mall))
      .map(r => String(r.id)),
  )
  const floors = new Map((links ?? []).map(l => [String(l.store_id), floorLabel(l.floor)]))
  const stores = storeRows
    .filter(s => floors.has(String(s.id)) || isInMall({ address: [s.full_address, s.address_line1, s.location_name], lat: s.lat, lng: s.lng }, mall))
    .map(s => ({ ...s, floor: floors.get(String(s.id)) ?? null }))

  return {
    dining: ((feed ?? []) as FeaturedRestaurant[]).filter(r => inside.has(String(r.id))),
    shopping: stores.filter(s => s.store_type !== 'SERVICE'),
    wellness: stores.filter(s => s.store_type === 'SERVICE'),
  }
}
