import { createClient } from '@/lib/supabase/server'
import { getActiveStores } from '@/lib/services/stores'
import { toRpcArgs, type Coords } from '@/lib/restaurantFilters'
import { canBook, canPayBill, isCashbackEnabled, type MerchantCapabilityFields } from '@/lib/cashback'
import { isDealLive, isOfferLive, isRepeatRewardOffer, offerBenefitLabel, offerStripText, type MerchantOffer } from '@/lib/deals'
import { haversineKm } from '@/lib/utils'
import type { FeaturedRestaurant } from '@/lib/types/dining'

export type DealsMode = 'deals' | 'cashback'
export type DealsCategory = 'dining' | 'shopping' | 'wellness'

export type DealsModeItem = {
  key: string
  kind: 'restaurant' | 'store'
  group: DealsCategory
  href: string
  /** where "Book Now" goes, when the merchant takes bookings */
  bookHref: string | null
  bookLabel: 'Book Now' | 'Request Booking' | null
  title: string
  media: string | null
  subtitle: string
  rating: number
  distanceKm: number | null
  costForTwo: number | null
  /** strip texts, best saving first */
  offers: string[]
  acceptsCashback: boolean
}

type IndexOffer = Pick<MerchantOffer, 'badge_text' | 'offer_type' | 'discount_value' | 'title' | 'start_at' | 'end_at'> & {
  metadata?: Record<string, unknown> | null
}

const REFERENCE_BILL = 1000

/** app parity: merchantOffers.js offerValue on an index row (no tier row). */
function score(offer: IndexOffer): number {
  const type = String(offer.offer_type ?? '').toLowerCase()
  const value = Number(offer.discount_value)
  if (!Number.isFinite(value) || value <= 0) return 0
  return type.startsWith('percent') ? (REFERENCE_BILL * value) / 100 : type === 'flat' ? value : 0
}

/**
 * Every merchant with something revealable right now — app parity:
 * DealsCashbackScreen.jsx loadDealsIndex (fetchLiveDealsIndex + tierDealIds):
 * live offers at merchants with deals switched on, plus live restaurant deals
 * that have a benefit for the viewer's tier (signed-in viewers only).
 */
async function loadDealsIndex(): Promise<Map<string, string[]>> {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [ro, rd, so, quotaRes] = await Promise.all([
    supabase
      .from('restaurant_offers')
      .select('id, restaurant_id, title, badge_text, offer_type, discount_value, start_at, end_at, metadata, restaurants!inner(deals_enabled)')
      .eq('is_active', true)
      .eq('restaurants.deals_enabled', true)
      .or(`end_at.is.null,end_at.gt.${now}`),
    supabase
      .from('restaurant_deals')
      .select('id, restaurant_id, title, badge_text, deal_type, starts_at, ends_at, restaurants!inner(deals_enabled)')
      .eq('is_active', true)
      .eq('restaurants.deals_enabled', true)
      .or(`ends_at.is.null,ends_at.gt.${now}`),
    supabase
      .from('store_offers')
      .select('id, store_id, title, badge_text, offer_type, discount_value, start_at, end_at, metadata, stores!inner(deals_enabled)')
      .eq('is_active', true)
      .eq('stores.deals_enabled', true)
      .or(`end_at.is.null,end_at.gt.${now}`),
    user ? supabase.rpc('deal_reveal_quota', { p_user_id: user.id }) : Promise.resolve({ data: null }),
  ])

  const quota = (Array.isArray(quotaRes.data) ? quotaRes.data[0] : quotaRes.data) as { tier?: string | null } | null
  const tier = String(quota?.tier ?? '').trim().toLowerCase()
  type DealRow = { id: string; restaurant_id: string; title: string | null; badge_text: string | null; deal_type: string | null; starts_at: string | null; ends_at: string | null }
  const deals = ((rd.data ?? []) as DealRow[]).filter(d => isDealLive(d))
  let myDeals = new Set<string>()
  if (tier && deals.length) {
    const { data } = await supabase
      .from('restaurant_deal_tiers')
      .select('deal_id')
      .in('deal_id', deals.map(d => d.id))
      .eq('tier', tier)
      .eq('is_active', true)
    myDeals = new Set(((data ?? []) as { deal_id: string }[]).map(r => String(r.deal_id)))
  }

  const byKey = new Map<string, IndexOffer[]>()
  const add = (key: string, offer: IndexOffer) => {
    const list = byKey.get(key) ?? []
    list.push(offer)
    byKey.set(key, list)
  }
  const keep = (o: IndexOffer & { id: string }) =>
    isOfferLive({ ...o, is_active: true }) && !!offerBenefitLabel(o as MerchantOffer) && !isRepeatRewardOffer(o)
  for (const o of (ro.data ?? []) as (IndexOffer & { id: string; restaurant_id: string })[]) {
    if (keep(o)) add(`restaurant:${o.restaurant_id}`, o)
  }
  for (const o of (so.data ?? []) as (IndexOffer & { id: string; store_id: string })[]) {
    if (keep(o)) add(`store:${o.store_id}`, o)
  }
  for (const d of deals) {
    if (myDeals.has(String(d.id))) {
      add(`restaurant:${d.restaurant_id}`, { title: d.title, badge_text: d.badge_text, offer_type: d.deal_type, discount_value: null })
    }
  }

  const index = new Map<string, string[]>()
  for (const [key, list] of byKey) {
    const texts = list
      .map((offer, i) => ({ offer, i, s: score(offer) }))
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .map(({ offer }) => stripLabel(offer))
      .filter(Boolean)
    if (texts.length) index.set(key, texts)
  }
  return index
}

/** Lead with the saving — "13% OFF · In-store" — rather than a bare badge like "In-store". */
function stripLabel(offer: IndexOffer): string {
  const benefit = offerBenefitLabel(offer as MerchantOffer)
  const badge = String(offer.badge_text ?? '').trim()
  const saving = /OFF$/.test(benefit) ? benefit : ''
  if (saving && badge && !badge.toUpperCase().includes(saving.replace(' OFF', ''))) return `${saving} · ${badge}`
  return saving || offerStripText(offer)
}

function acceptsCashback(e: MerchantCapabilityFields) {
  return canPayBill(e) && isCashbackEnabled(e)
}

function isWellness(category: string | null) {
  return String(category ?? '').split(',').some(part => part.trim().toLowerCase() === 'salon & wellness')
}

/**
 * Deals Mode / Use Cashback lists — app parity: DealsCashbackScreen.jsx
 * loadModeMerchants. Deals mode keeps merchants with a live revealable offer;
 * cashback mode keeps merchants where Privé Credits pay the bill. Nearest first.
 */
export async function getDealsModeItems(mode: DealsMode, coords: Coords | null): Promise<DealsModeItem[]> {
  const supabase = await createClient()
  const [index, feedRes, stores] = await Promise.all([
    loadDealsIndex().catch(() => new Map<string, string[]>()),
    supabase.rpc('restaurant_feed', toRpcArgs({}, 500, 0, coords)),
    getActiveStores(),
  ])
  const restaurants = (feedRes.data ?? []) as FeaturedRestaurant[]

  const items: DealsModeItem[] = []
  for (const r of restaurants) {
    const offers = index.get(`restaurant:${r.id}`) ?? []
    if (mode === 'cashback' ? !acceptsCashback(r) : !offers.length) continue
    const slug = r.slug ?? r.id
    const bookable = canBook(r)
    const distance =
      coords && r.latitude != null && r.longitude != null
        ? haversineKm(coords.lat, coords.lng, Number(r.latitude), Number(r.longitude))
        : (r.distance_km ?? null)
    items.push({
      key: `r-${r.id}`,
      kind: 'restaurant',
      group: 'dining',
      href: `/dining/${slug}`,
      bookHref: bookable ? `/dining/${slug}/book` : null,
      bookLabel: bookable ? (r.booking_service_type === 'instant' ? 'Book Now' : 'Request Booking') : null,
      title: r.name,
      media: r.cover_image,
      subtitle: [r.is_pure_veg ? 'Pure veg' : r.cuisines.slice(0, 2).join(', '), r.city].filter(Boolean).join(' • '),
      rating: Number(r.rating) || 0,
      distanceKm: distance,
      costForTwo: r.cost_for_two,
      offers,
      acceptsCashback: acceptsCashback(r),
    })
  }

  for (const s of stores) {
    const offers = index.get(`store:${s.id}`) ?? []
    if (mode === 'cashback' ? !acceptsCashback(s) : !offers.length) continue
    const wellness = isWellness(s.category)
    const slug = s.slug ?? s.id
    const bookable = wellness && canBook(s)
    items.push({
      key: `s-${s.id}`,
      kind: 'store',
      group: wellness ? 'wellness' : 'shopping',
      href: `/${wellness ? 'wellness' : 'stores'}/${slug}`,
      bookHref: bookable ? `/wellness/${slug}` : null,
      bookLabel: bookable ? 'Request Booking' : null,
      title: s.name,
      media: s.cover_image ?? s.logo_url,
      subtitle: [s.category, s.city].filter(Boolean).join(' • '),
      rating: 0,
      distanceKm: coords && s.lat != null && s.lng != null ? haversineKm(coords.lat, coords.lng, Number(s.lat), Number(s.lng)) : null,
      costForTwo: null,
      offers,
      acceptsCashback: acceptsCashback(s),
    })
  }

  return items.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
}
