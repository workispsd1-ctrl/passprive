import { createClient } from '@/lib/supabase/server'
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
    .select('section_id, store_id, sort_order, stores(name, slug, logo_url, location_name, city, lat, lng)')
    .in('section_id', sections.map(s => s.id))
    .eq('is_active', true)
    .order('sort_order')

  return sections.map(section => ({
    ...section,
    items: ((items ?? []) as unknown as SectionStore[]).filter(i => i.section_id === section.id),
  }))
}
