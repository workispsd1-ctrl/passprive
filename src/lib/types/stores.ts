export type StoreRow = {
  id: string
  name: string
  slug: string
  category: string | null
  subcategory: string | null
  location_name: string | null
  city: string | null
  logo_url: string | null
  cover_image: string | null
  description: string | null
  lat: number | null
  lng: number | null
  merchant_type: 'preferred' | 'verified' | null
  merchant_plan: string | null
  pay_bill_enabled: boolean | null
  service_level: string | null
  on_boarded: boolean | null
  store_offers?: StoreOffer[]
}

export type NewKickInStore = {
  store_id: string
  store_name: string
  description: string | null
  city: string | null
  location_name: string | null
  category: string | null
  subcategory: string | null
  cover_image_url: string | null
  logo_url: string | null
  distance_km: number | null
  offers: Array<{
    id: string
    title: string
    badge_text: string | null
    discount_value: number | null
    offer_type: string | null
  }>
}

export type StoreMoodCategory = {
  id: string
  key: string
  slug: string
  title: string
  image_url: string | null
  light_theme_image_url: string | null
  dark_theme_image_url: string | null
  sort_order: number
}

export type Store = {
  id: string
  name: string
  slug: string | null
  description: string | null
  category: string | null
  subcategory: string | null
  location_name: string | null
  address_line1: string | null
  city: string | null
  logo_url: string | null
  cover_image: string | null
  phone: string | null
  whatsapp: string | null
  website: string | null
}

export type MediaAsset = { file_url: string; sort_order: number }

export type OpeningHour = {
  day_of_week: number
  open_time: string
  close_time: string
  is_closed: boolean
}

export type CatalogueItem = {
  id: string
  category_id: string
  title: string | null
  price: number | null
  description: string | null
  image_url: string | null
  is_available: boolean
  updated_at: string | null
}

export type StoreTag = { tag_value: string }

export type StoreOffer = {
  id: string
  title?: string
  description?: string
  code?: string
  badge_text?: string | null
  discount_value?: number | null
  offer_type?: string | null
}

export type SocialLink = { platform: string; url: string }

export type SectionStore = {
  section_id: string
  store_id: string
  sort_order: number
  stores: {
    name: string
    slug: string
    logo_url: string | null
    cover_image: string | null
    location_name: string | null
    city: string | null
    lat: number | null
    lng: number | null
    store_offers?: StoreOffer[]
  }
}

export type HomeSection = {
  id: string
  title: string
  subtitle: string | null
  items: SectionStore[]
}

export type EditorialCollection = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  cover_image_url: string | null
  badge_text: string | null
  source_name: string | null
  entity_type: 'STORE' | 'RESTAURANT' | 'BOTH'
  city: string | null
  area: string | null
  sort_order: number
  is_featured: boolean
  save_count: number
}

export type StoreDetail = {
  store: Store
  gallery: MediaAsset[]
  hours: OpeningHour[]
  items: CatalogueItem[]
  tags: StoreTag[]
  offers: StoreOffer[]
  socials: SocialLink[]
}
