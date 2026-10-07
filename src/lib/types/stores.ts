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

/** A service (salon / spa) store as the wellness detail page needs it. */
export type ServiceStore = Store & {
  lat: number | null
  lng: number | null
  merchant_type: 'preferred' | 'verified' | null
  merchant_plan: string | null
  pay_bill_enabled: boolean | null
  service_level: string | null
  on_boarded: boolean | null
  top_items: string[]
}

export type ServiceItem = {
  id: string
  title: string
  description: string | null
  price: number | null
  duration_minutes: number | null
  service_for: string | null
}

/** app parity: ServiceStoreDetails.jsx `loadServiceCatalogue` category shape */
export type ServiceCategory = {
  id: string
  title: string
  subtitle: string | null
  image: string | null
  starting_from: number | null
  items: ServiceItem[]
}

/** app parity: ServiceStoreDetails.jsx `mapStoreOfferToCardOffer` / `mapUnifiedOfferToCardOffer` */
export type ServiceOffer = {
  id: string
  title: string
  description: string | null
  discount_type: 'PERCENT' | 'FLAT'
  discount_value: number | null
  sponsor_name?: string | null
  logo_url?: string | null
}

export type ServiceReview = {
  id: string
  rating: number
  review_text: string | null
  username_snapshot: string | null
  service_rating: number | null
  created_at: string
}

export type ServiceStoreDetail = {
  store: ServiceStore
  gallery: string[]
  hours: OpeningHour[]
  categories: ServiceCategory[]
  inStoreOffers: ServiceOffer[]
  bankOffers: ServiceOffer[]
  reviews: ServiceReview[]
}
