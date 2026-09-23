import { createClient } from '@/lib/supabase/server'
import { sortByMerchant } from '@/lib/utils'
import type {
  StoreRow,
  StoreMoodCategory,
  Store,
  MediaAsset,
  OpeningHour,
  CatalogueItem,
  StoreTag,
  StoreOffer,
  SocialLink,
  SectionStore,
  HomeSection,
  StoreDetail,
  EditorialCollection,
  NewKickInStore,
} from '@/lib/types/stores'
import type { FeaturedRestaurant } from '@/lib/types/dining'

export async function getNewKickInStores(
  params: { userLat?: number; userLng?: number; city?: string; limit?: number } = {}
): Promise<NewKickInStore[]> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_new_kick_in_stores', {
    p_user_lat: params.userLat ?? null,
    p_user_lng: params.userLng ?? null,
    p_city: params.city ?? null,
    p_limit: params.limit ?? 6,
  })
  return (data ?? []) as NewKickInStore[]
}

export async function getActiveStores(): Promise<StoreRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('stores')
    .select('id, name, slug, category, subcategory, location_name, city, logo_url, cover_image, description, lat, lng, merchant_type, merchant_plan, pay_bill_enabled, service_level, on_boarded, store_offers(id, title, badge_text, discount_value, offer_type)')
    .eq('is_active', true)
    .order('sort_order')
    .order('name')
  return (data ?? []) as StoreRow[]
}

/**
 * "Discover top brands" — app parity: components/StoresHome/TrendingNow.jsx.
 * `is_top_brand` exists but is rarely curated, so (matching the app's own
 * "Trending now" rail) this just pulls active product stores and ranks them
 * by merchant tier instead of depending on that flag being set.
 */
export async function getTopBrandStores(limit = 12): Promise<StoreRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('stores')
    .select('id, name, slug, category, subcategory, location_name, city, logo_url, cover_image, description, lat, lng, merchant_type, merchant_plan, pay_bill_enabled, service_level, on_boarded')
    .eq('is_active', true)
    .eq('store_type', 'PRODUCT')
    .order('sort_order')
    .order('name')
    .limit(limit)
  return sortByMerchant((data ?? []) as StoreRow[])
}

export type StorePromotionalCollection = {
  id: string
  title: string
  subtitle: string | null
  hasBanner: boolean
}

/**
 * "Shop the ___ Merch" promo banners — app parity:
 * components/StoresHome/StorePromotionalCards.jsx. Unlike the dining
 * version, the app doesn't curate a per-collection store list — every active
 * collection just anchors the same top-of-list stores rail.
 */
export async function getShoppingPromotionalCollections(): Promise<StorePromotionalCollection[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('promotional_collections')
    .select('id, title, subtitle, starts_at, ends_at, banner_image_url')
    .eq('is_active', true)
    .contains('screens', ['shopping'])
    .order('sort_order', { ascending: true })

  const now = Date.now()
  return (data ?? [])
    // Only the "end of season sale" campaign should show here — other
    // shopping-screen collections (e.g. the football/fifa one) are excluded.
    .filter((c) => !/fifa|football/i.test(c.title ?? ''))
    .filter((c) => {
      const start = c.starts_at ? Date.parse(c.starts_at) : NaN
      const end = c.ends_at ? Date.parse(c.ends_at) : NaN
      return (Number.isNaN(start) || start <= now) && (Number.isNaN(end) || end >= now)
    })
    .map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      hasBanner: !!c.banner_image_url,
    }))
}

export async function getStoreMoodCategories(): Promise<StoreMoodCategory[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('store_mood_categories')
    .select('id, key, slug, title, image_url, light_theme_image_url, dark_theme_image_url, sort_order')
    .eq('is_active', true)
    .order('sort_order')
  const allCats = (data ?? []) as StoreMoodCategory[]
  return [
    ...allCats.filter(c => c.key === 'ALL_STORES'),
    ...allCats.filter(c => c.key !== 'ALL_STORES'),
  ]
}

export async function getStoreBySlugOrId(slugOrId: string): Promise<StoreDetail | null> {
  const supabase = await createClient()
  const SELECT = 'id,name,slug,description,category,subcategory,location_name,address_line1,city,logo_url,cover_image,phone,whatsapp,website'

  let { data: store } = await supabase
    .from('stores')
    .select(SELECT)
    .eq('slug', slugOrId)
    .eq('is_active', true)
    .maybeSingle()

  if (!store) {
    const res = await supabase
      .from('stores')
      .select(SELECT)
      .eq('id', slugOrId)
      .eq('is_active', true)
      .maybeSingle()
    store = res.data
  }

  if (!store) return null

  const [galleryRes, hoursRes, itemsRes, tagsRes, offersRes, socialRes] = await Promise.allSettled([
    supabase.from('store_media_assets').select('file_url, sort_order').eq('store_id', store.id).eq('asset_type', 'gallery').eq('is_active', true).order('sort_order'),
    supabase.from('store_opening_hours').select('day_of_week, open_time, close_time, is_closed').eq('store_id', store.id).order('day_of_week'),
    supabase.from('store_catalogue_items').select('id, category_id, title, price, description, image_url, is_available, updated_at').eq('store_id', store.id).eq('is_available', true).order('sort_order'),
    supabase.from('store_tags').select('tag_value').eq('store_id', store.id).eq('tag_type', 'tag'),
    supabase.from('store_offers').select('id, title, description, code').eq('store_id', store.id),
    supabase.from('store_social_links').select('platform, url').eq('store_id', store.id).order('sort_order'),
  ])

  return {
    store: store as Store,
    gallery:  galleryRes.status  === 'fulfilled' ? (galleryRes.value.data  ?? []) as MediaAsset[]   : [],
    hours:    hoursRes.status    === 'fulfilled' ? (hoursRes.value.data    ?? []) as OpeningHour[]   : [],
    items:    itemsRes.status    === 'fulfilled' ? (itemsRes.value.data    ?? []) as CatalogueItem[] : [],
    tags:     tagsRes.status     === 'fulfilled' ? (tagsRes.value.data     ?? []) as StoreTag[]      : [],
    offers:   offersRes.status   === 'fulfilled' ? (offersRes.value.data   ?? []) as StoreOffer[]    : [],
    socials:  socialRes.status   === 'fulfilled' ? (socialRes.value.data   ?? []) as SocialLink[]    : [],
  }
}

export async function getEditorialCollections(
  entityType?: 'STORE' | 'RESTAURANT' | 'BOTH' | ('STORE' | 'RESTAURANT' | 'BOTH')[]
): Promise<EditorialCollection[]> {
  const supabase = await createClient()

  // Matches the app's fetchEditorialCollections
  // (components/Home/WhatsHotOnPassPrive.jsx): active rows, featured first.
  let query = supabase
    .from('editorial_collections')
    .select('id, slug, title, subtitle, description, cover_image_url, badge_text, source_name, entity_type, city, area, sort_order, is_featured, save_count')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (entityType) {
    const types = Array.isArray(entityType) ? entityType : [entityType]
    query = query.in('entity_type', types)
  }

  const { data } = await query
  return (data ?? []) as EditorialCollection[]
}

/**
 * One editorial collection with its ranked restaurants/stores — app parity:
 * OfferRestaurantsScreen (`editorial_collection`): the collection row by slug,
 * then `editorial_collection_items` (active, by sort_order), then the entities
 * fetched by id and kept in that rank order. (The app's
 * `get_editorial_collection_items` RPC isn't deployed; this is its fallback.)
 */
export async function getEditorialCollectionBySlug(slug: string): Promise<{
  collection: EditorialCollection
  restaurants: FeaturedRestaurant[]
  stores: StoreRow[]
} | null> {
  const supabase = await createClient()
  const { data: collection } = await supabase
    .from('editorial_collections')
    .select('id, slug, title, subtitle, description, cover_image_url, badge_text, source_name, entity_type, city, area, sort_order, is_featured, save_count')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (!collection) return null

  const { data: items } = await supabase
    .from('editorial_collection_items')
    .select('restaurant_id, store_id, sort_order')
    .eq('collection_id', collection.id)
    .eq('is_active', true)
    .order('sort_order')

  const restaurantIds = (items ?? []).map((i) => i.restaurant_id).filter(Boolean) as string[]
  const storeIds = (items ?? []).map((i) => i.store_id).filter(Boolean) as string[]

  const [restaurantRes, storeRes] = await Promise.all([
    restaurantIds.length
      ? supabase
          .from('restaurants')
          .select('id, name, slug, area, city, cover_image, cost_for_two, is_pure_veg, is_advertised, ad_priority, ad_badge_text, merchant_type, merchant_plan, pay_bill_enabled, latitude, longitude, booking_enabled')
          .in('id', restaurantIds)
          .eq('is_active', true)
      : Promise.resolve({ data: [] }),
    storeIds.length
      ? supabase
          .from('stores')
          .select('id, name, slug, category, subcategory, location_name, city, logo_url, cover_image, description, lat, lng, merchant_type, merchant_plan, pay_bill_enabled, service_level, on_boarded, store_offers(id, title, badge_text, discount_value, offer_type)')
          .in('id', storeIds)
          .eq('is_active', true)
      : Promise.resolve({ data: [] }),
  ])

  const rank = (ids: string[]) => new Map(ids.map((id, i) => [id, i]))
  const rr = rank(restaurantIds)
  const sr = rank(storeIds)

  // Table rows lack the feed's rating/mood/offer aggregates — default them so
  // the shared card renders (rating badge is hidden at 0).
  const restaurants = ((restaurantRes.data ?? []) as Record<string, unknown>[])
    .map((r) => ({
      cuisines: [],
      rating: 0,
      rating_count: 0,
      mood: [],
      offer_badge: null,
      has_offer: false,
      repeat_rewards_enabled: false,
      booking_service_type: null,
      ...r,
    }) as unknown as FeaturedRestaurant)
    .sort((a, b) => (rr.get(a.id) ?? 0) - (rr.get(b.id) ?? 0))
  const stores = ((storeRes.data ?? []) as unknown as StoreRow[]).sort(
    (a, b) => (sr.get(a.id) ?? 0) - (sr.get(b.id) ?? 0),
  )

  return { collection: collection as EditorialCollection, restaurants, stores }
}

export async function getHomeSections(): Promise<HomeSection[]> {
  const supabase = await createClient()

  const { data: sections } = await supabase
    .from('stores_home_sections')
    .select('id, title, subtitle')
    .eq('is_active', true)
    .order('created_at')

  if (!sections?.length) return []

  const { data: items } = await supabase
    .from('stores_home_section_items')
    .select('section_id, store_id, sort_order, stores(name, slug, logo_url, cover_image, location_name, city, lat, lng, store_offers(discount_value, badge_text, offer_type))')
    .in('section_id', sections.map(s => s.id))
    .eq('is_active', true)
    .order('sort_order')

  return sections.map(section => ({
    ...section,
    items: ((items ?? []) as unknown as SectionStore[]).filter(i => i.section_id === section.id),
  }))
}
