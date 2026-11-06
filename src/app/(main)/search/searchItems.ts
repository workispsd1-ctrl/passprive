import type { MerchantCapabilityFields } from '@/lib/cashback'
import type { Fields } from '@/lib/search'
import { haversineKm } from '@/lib/utils'
import type { FeaturedRestaurant } from '@/lib/types/dining'
import type { SearchStore } from '@/app/api/search/dataset/route'

/** One search result, restaurant or store, in the shape the screen draws. */
export type SearchItem = {
  key: string
  id: string
  type: 'RESTAURANT' | 'STORE'
  /** a SERVICE store — opens the salon page, gets the wellness icon */
  wellness: boolean
  name: string
  href: string
  image: string | null
  /** "area, city" — the row's second line */
  area: string
  city: string | null
  distanceKm: number | null
  rating: number | null
  rating_count: number | null
  offer: string | null
  offerCount: number
  advertised: boolean
  merchantType: string
  raw: MerchantCapabilityFields
}

type Coords = { lat: number; lng: number } | null

const km = (c: Coords, lat: number | null | undefined, lng: number | null | undefined, fallback: number | null = null) =>
  c && lat != null && lng != null ? haversineKm(c.lat, c.lng, Number(lat), Number(lng)) : fallback

export function restaurantItem(r: FeaturedRestaurant, c: Coords): SearchItem {
  return {
    key: `restaurant-${r.id}`,
    id: r.id,
    type: 'RESTAURANT',
    wellness: false,
    name: r.name,
    href: `/dining/${r.slug ?? r.id}`,
    image: r.cover_image,
    area: [r.area, r.city].filter(Boolean).join(', '),
    city: r.city,
    distanceKm: km(c, r.latitude, r.longitude, r.distance_km ?? null),
    rating: r.rating,
    rating_count: r.rating_count,
    offer: r.offer_badge,
    offerCount: r.has_offer ? 1 : 0,
    advertised: r.is_advertised === true,
    merchantType: String(r.merchant_type ?? '').toLowerCase(),
    raw: r,
  }
}

function storeOffer(s: SearchStore): string | null {
  const o = s.store_offers?.[0]
  if (!o) return null
  if (!o.discount_value) return o.badge_text ?? o.title ?? null
  return String(o.offer_type ?? '').toLowerCase().startsWith('percent') ? `Flat ${o.discount_value}% OFF` : `Flat MUR ${o.discount_value} OFF`
}

export function storeItem(s: SearchStore, c: Coords): SearchItem {
  const wellness = String(s.store_type ?? '').toUpperCase() === 'SERVICE'
  return {
    key: `store-${s.id}`,
    id: s.id,
    type: 'STORE',
    wellness,
    name: s.name,
    // app parity: storeDetailsRouting.js — SERVICE stores open ServiceStoreDetails
    href: `/${wellness ? 'wellness' : 'stores'}/${s.slug ?? s.id}`,
    image: s.cover_image ?? s.logo_url,
    area: [s.location_name, s.city].filter(Boolean).join(', '),
    city: s.city,
    distanceKm: km(c, s.lat, s.lng),
    rating: s.rating ?? null,
    rating_count: s.rating_count ?? null,
    offer: storeOffer(s),
    offerCount: s.store_offers?.length ?? 0,
    advertised: s.is_advertised === true,
    merchantType: String(s.merchant_type ?? '').toLowerCase(),
    raw: s,
  }
}

/** app parity: GlobalSearchScreen.jsx indexItem buckets (restaurant / store). */
export function searchFields(sources: Map<string, FeaturedRestaurant | SearchStore>): Fields<SearchItem> {
  return item => {
    const src = sources.get(item.key)
    if (item.type === 'RESTAURANT') {
      const r = src as FeaturedRestaurant
      return {
        primary: [r.name],
        secondary: [r.area, r.city, r.slug],
        tertiary: [r.offer_badge, ...(r.cuisines ?? []), ...(r.mood ?? [])],
      }
    }
    const s = src as SearchStore
    return {
      primary: [s.name],
      secondary: [s.location_name, s.city, s.category, s.subcategory],
      tertiary: [s.address_line1, s.description, s.slug, storeOffer(s)],
    }
  }
}
