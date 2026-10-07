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
  ServiceStore,
  ServiceCategory,
  ServiceItem,
  ServiceOffer,
  ServiceReview,
  ServiceStoreDetail,
} from '@/lib/types/stores'
import type { FeaturedRestaurant } from '@/lib/types/dining'

// app parity: Home/NewKickInStores.jsx NEW_KICK_RADIUS_KM (= locationScope's NEARBY_RADIUS_KM)
const NEW_KICK_RADIUS_KM = 15

export async function getNewKickInStores(
  params: { userLat?: number; userLng?: number; city?: string; limit?: number } = {}
): Promise<NewKickInStore[]> {
  const supabase = await createClient()
  const requestedLimit = params.limit ?? 6
  const hasCoords = params.userLat != null && params.userLng != null
  const { data } = await supabase.rpc('get_new_kick_in_stores', {
    p_user_lat: params.userLat ?? null,
    p_user_lng: params.userLng ?? null,
    p_city: params.city ?? null,
    // the RPC doesn't scope by distance itself, so over-fetch when we have
    // coords to filter with — enough candidates survive the 15km cut below.
    p_limit: hasCoords ? Math.max(requestedLimit, 30) : requestedLimit,
  })
  const rows = (data ?? []) as NewKickInStore[]
  if (!hasCoords) return rows.slice(0, requestedLimit)

  const scoped = rows.filter((s) => s.distance_km != null && s.distance_km <= NEW_KICK_RADIUS_KM)
  return (scoped.length ? scoped : rows).slice(0, requestedLimit)
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

/**
 * Wellness stores — app parity: WellnessHome.jsx's `isSalonStore` /
 * WellnessPromotionalCards.jsx's `isWellnessStore` — both filter on the exact
 * `category` value "Salon & Wellness".
 */
export async function getWellnessStores(): Promise<StoreRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('stores')
    .select('id, name, slug, category, subcategory, location_name, city, logo_url, cover_image, description, lat, lng, merchant_type, merchant_plan, pay_bill_enabled, service_level, on_boarded, store_offers(id, title, badge_text, discount_value, offer_type)')
    .eq('is_active', true)
    .eq('category', 'Salon & Wellness')
    .order('sort_order')
    .order('name')
  return (data ?? []) as StoreRow[]
}

/**
 * "Time for a Glow Up" — app parity: WellnessPromotionalCards.jsx, which
 * filters `promotional_collections` on slug 'glow-up' specifically (the
 * shopping screen's version filters by `screens` instead).
 */
export async function getWellnessPromotionalCollections(): Promise<StorePromotionalCollection[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('promotional_collections')
    .select('id, title, subtitle, starts_at, ends_at, banner_image_url')
    .eq('is_active', true)
    .contains('screens', ['wellness'])
    .order('sort_order', { ascending: true })

  const now = Date.now()
  return (data ?? [])
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

/** app parity: ServiceStoreDetails.jsx `isOfferActiveNow` */
function isActiveNow(start: string | null | undefined, end: string | null | undefined): boolean {
  const now = Date.now()
  const s = start ? Date.parse(start) : NaN
  const e = end ? Date.parse(end) : NaN
  return (Number.isNaN(s) || s <= now) && (Number.isNaN(e) || e >= now)
}

/**
 * Wellness / service store detail — app parity: screens/ServiceStoreDetails.jsx.
 * Same sources the app reads: the store row (+ `top_items`), gallery, opening
 * hours, the service catalogue (`store_services` → `store_service_items`, titled
 * and imaged from the master `service_categories`), in-store offers, the
 * platform-wide bank offers from `offers`, and approved reviews.
 */
export async function getServiceStoreBySlugOrId(slugOrId: string): Promise<ServiceStoreDetail | null> {
  const supabase = await createClient()
  const SELECT = 'id,name,slug,description,category,subcategory,location_name,address_line1,city,logo_url,cover_image,phone,whatsapp,website,lat,lng,merchant_type,merchant_plan,pay_bill_enabled,service_level,on_boarded,top_items'

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

  const [galleryRes, hoursRes, servicesRes, masterRes, itemsRes, storeOffersRes, offersRes, reviewsRes] =
    await Promise.allSettled([
      supabase.from('store_media_assets').select('file_url, sort_order').eq('store_id', store.id).eq('asset_type', 'gallery').eq('is_active', true).order('sort_order'),
      supabase.from('store_opening_hours').select('day_of_week, open_time, close_time, is_closed').eq('store_id', store.id).order('day_of_week'),
      supabase.from('store_services').select('id, title, description, category, base_price, sort_order').eq('store_id', store.id).eq('is_active', true).order('sort_order', { ascending: true }),
      supabase.from('service_categories').select('key, slug, title, subtitle, light_theme_image_url, dark_theme_image_url').eq('is_active', true),
      supabase.from('store_service_items').select('id, service_id, title, description, price, duration_minutes, service_for, sort_order, is_active').eq('store_id', store.id).order('sort_order', { ascending: true }),
      supabase.from('store_offers').select('id, title, description, offer_type, discount_value, start_at, end_at, is_active').eq('store_id', store.id).eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('offers').select('id, source_type, title, short_title, subtitle, description, benefit_value, benefit_percent, logo_url, starts_at, ends_at, is_active, status, sponsor_name').order('priority', { ascending: true }),
      supabase.from('restaurant_reviews').select('id, rating, review_text, username_snapshot, service_rating, created_at').eq('restaurant_id', store.id).eq('is_approved', true).order('created_at', { ascending: false }).limit(200),
    ])

  const rows = <T,>(r: PromiseSettledResult<{ data: T[] | null }>): T[] =>
    r.status === 'fulfilled' ? (r.value.data ?? []) : []

  // Category images may be stored as bare "bucket/path" storage keys.
  const publicImage = (raw: string | null | undefined): string | null => {
    const v = raw?.trim()
    if (!v) return null
    if (/^https?:\/\//i.test(v)) return v
    const [bucket, ...rest] = v.replace(/^\/+/, '').replace(/^storage\/v1\/object\/public\//, '').split('/').filter(Boolean)
    if (!bucket || !rest.length) return null
    return supabase.storage.from(bucket).getPublicUrl(rest.join('/')).data.publicUrl
  }

  type MasterCategory = { key: string | null; slug: string | null; title: string | null; subtitle: string | null; light_theme_image_url: string | null; dark_theme_image_url: string | null }
  const master = rows<MasterCategory>(masterRes)
  const byKey = new Map(master.filter(c => c.key?.trim()).map(c => [c.key!.trim().toUpperCase(), c]))
  const bySlug = new Map(master.filter(c => c.slug?.trim()).map(c => [c.slug!.trim().toLowerCase(), c]))

  type ItemRow = ServiceItem & { service_id: string | null; is_active: boolean | null }
  const items = rows<ItemRow>(itemsRes).filter(i => i.is_active !== false && i.title)

  type ServiceRow = { id: string; title: string | null; description: string | null; category: string | null; base_price: number | null }
  const categories: ServiceCategory[] = rows<ServiceRow>(servicesRes).map((service, index) => {
    const key = (service.category ?? '').trim()
    const m = (key && (byKey.get(key.toUpperCase()) ?? bySlug.get(key.toLowerCase()))) || null
    return {
      id: String(service.id),
      title: m?.title || service.title || `Services ${index + 1}`,
      subtitle: m?.subtitle || service.description || null,
      image: publicImage(m?.light_theme_image_url) ?? publicImage(m?.dark_theme_image_url),
      starting_from: service.base_price ?? null,
      items: items
        .filter(i => String(i.service_id) === String(service.id))
        .map(({ id, title, description, price, duration_minutes, service_for }) => ({
          id: String(id), title, description, price, duration_minutes, service_for,
        })),
    }
  })

  type StoreOfferRow = { id: string; title: string | null; description: string | null; offer_type: string | null; discount_value: number | null; start_at: string | null; end_at: string | null }
  const inStoreOffers: ServiceOffer[] = rows<StoreOfferRow>(storeOffersRes)
    .filter(o => isActiveNow(o.start_at, o.end_at))
    .map(o => ({
      id: String(o.id),
      title: o.title || 'Store offer',
      description: o.description,
      discount_type: (o.offer_type ?? '').toLowerCase() === 'percentage' ? 'PERCENT' : 'FLAT',
      discount_value: Number.isFinite(Number(o.discount_value)) ? Number(o.discount_value) : null,
    }))

  // app parity: the app reads platform-wide bank offers here (not store-scoped).
  type UnifiedOfferRow = { id: string; source_type: string | null; title: string | null; short_title: string | null; subtitle: string | null; description: string | null; benefit_value: number | null; benefit_percent: number | null; logo_url: string | null; starts_at: string | null; ends_at: string | null; is_active: boolean | null; status: string | null; sponsor_name: string | null }
  const bankOffers: ServiceOffer[] = rows<UnifiedOfferRow>(offersRes)
    .filter(o => o.is_active === true || (o.status ?? '').trim().toUpperCase() === 'ACTIVE')
    .filter(o => isActiveNow(o.starts_at, o.ends_at))
    .filter(o => {
      const t = (o.source_type ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_')
      return t === 'BANK' || t.includes('BANK_') || t.includes('_BANK')
    })
    .map(o => {
      const pct = Number(o.benefit_percent)
      const flat = Number(o.benefit_value)
      return {
        id: String(o.id),
        title: o.title || o.short_title || 'Bank offer',
        description: o.description || o.subtitle || null,
        discount_type: pct > 0 ? 'PERCENT' : 'FLAT',
        discount_value: pct > 0 ? pct : Number.isFinite(flat) ? flat : null,
        sponsor_name: o.sponsor_name,
        logo_url: o.logo_url,
      }
    })

  const s = store as unknown as ServiceStore & { top_items: unknown }
  const topItems = Array.isArray(s.top_items)
    ? (s.top_items as unknown[]).filter((v): v is string => typeof v === 'string' && !!v.trim()).map(v => v.trim())
    : []

  return {
    store: { ...s, top_items: topItems },
    gallery: [s.cover_image, ...rows<MediaAsset>(galleryRes).map(g => g.file_url)].filter((v): v is string => !!v),
    hours: rows<OpeningHour>(hoursRes),
    categories,
    inStoreOffers,
    bankOffers,
    reviews: rows<ServiceReview>(reviewsRes),
  }
}

/**
 * Booking settings for a service store — app parity: ReviewStoreBooking.jsx's
 * `stores` lookup (cover charge + custom booking terms). Queried on its own
 * so a store without these columns set still books with the defaults.
 */
export async function getStoreBookingSettings(storeId: string): Promise<{
  coverChargeEnabled: boolean
  coverChargeAmount: number | null
  bookingTerms: string[]
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('cover_charge_enabled, cover_charge_amount, booking_terms')
    .eq('id', storeId)
    .maybeSingle()
  if (error || !data) return { coverChargeEnabled: false, coverChargeAmount: null, bookingTerms: [] }
  return {
    coverChargeEnabled: data.cover_charge_enabled === true,
    coverChargeAmount: data.cover_charge_amount != null ? Number(data.cover_charge_amount) : null,
    bookingTerms: Array.isArray(data.booking_terms)
      ? (data.booking_terms as unknown[]).filter((t): t is string => typeof t === 'string' && !!t.trim())
      : [],
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
