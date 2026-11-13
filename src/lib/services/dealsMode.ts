import { createClient } from '@/lib/supabase/server'
import { getActiveStores } from '@/lib/services/stores'
import { isWellnessStore } from '@/lib/storeType'
import { toRpcArgs, type Coords } from '@/lib/restaurantFilters'
import { canBook, canPayBill, isCashbackEnabled, type MerchantCapabilityFields } from '@/lib/cashback'
import { isDealLive, isOfferLive, isRepeatRewardOffer, offerBenefitLabel, offerStripText, type MerchantOffer } from '@/lib/deals'
import { haversineKm } from '@/lib/utils'
import type { FeaturedRestaurant } from '@/lib/types/dining'
import { getStampGate } from '@/lib/services/platformFlags'
import { capsOf, percentOf, type DealCard } from '@/lib/services/greatDeals'

export type DealsMode = 'deals' | 'cashback'
export type DealsCategory = 'dining' | 'shopping' | 'wellness'

/** A Great Deals card plus what the Deals Mode / Use Cashback filters need. */
export type DealsModeItem = DealCard & {
  /** "Booking available" — the merchant takes bookings */
  bookable: boolean
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


/**
 * Deals Mode / Use Cashback lists — app parity: DealsCashbackScreen.jsx
 * loadModeMerchants. Deals mode keeps merchants with a live revealable offer;
 * cashback mode keeps merchants where Privé Credits pay the bill. Nearest first.
 */
export async function getDealsModeItems(mode: DealsMode, coords: Coords | null): Promise<DealsModeItem[]> {
  const supabase = await createClient()
  const [index, feedRes, stores, stampGate] = await Promise.all([
    loadDealsIndex().catch(() => new Map<string, string[]>()),
    supabase.rpc('restaurant_feed', toRpcArgs({}, 500, 0, coords)),
    getActiveStores(),
    getStampGate(),
  ])
  const restaurants = (feedRes.data ?? []) as FeaturedRestaurant[]

  const items: DealsModeItem[] = []
  for (const r of restaurants) {
    const offers = index.get(`restaurant:${r.id}`) ?? []
    if (mode === 'cashback' ? !acceptsCashback(r) : !offers.length) continue
    const distance =
      coords && r.latitude != null && r.longitude != null
        ? haversineKm(coords.lat, coords.lng, Number(r.latitude), Number(r.longitude))
        : (r.distance_km ?? null)
    items.push({
      key: `r-${r.id}`,
      id: r.id,
      kind: 'restaurant',
      group: 'dining',
      name: r.name,
      href: `/dining/${r.slug ?? r.id}`,
      payHref: `/pay-bill?restaurant_id=${r.id}&restaurant_name=${encodeURIComponent(r.name)}`,
      image: r.cover_image,
      offers,
      maxPercent: Math.max(0, ...offers.map(percentOf)),
      rating: Number(r.rating) || 0,
      distanceKm: distance,
      area: r.area ?? r.city,
      tagline: r.is_pure_veg ? 'Pure veg' : r.cuisines.length ? r.cuisines.join(', ') : null,
      costForTwo: r.cost_for_two,
      stampSheet: stampGate(r.id) && (r.repeat_rewards_enabled || r.mood.some(m => m.toLowerCase().includes('stamp'))),
      trending: r.is_advertised,
      isVeg: r.is_pure_veg,
      cuisines: r.cuisines,
      caps: capsOf(r),
      bookable: canBook(r),
      acceptsCashback: acceptsCashback(r),
    })
  }

  for (const s of stores) {
    const offers = index.get(`store:${s.id}`) ?? []
    if (mode === 'cashback' ? !acceptsCashback(s) : !offers.length) continue
    const wellness = isWellnessStore(s)
    const slug = s.slug ?? s.id
    items.push({
      key: `s-${s.id}`,
      id: s.id,
      kind: 'store',
      group: wellness ? 'wellness' : 'shopping',
      name: s.name,
      href: `/${wellness ? 'wellness' : 'stores'}/${slug}`,
      payHref: `/pay-bill?store_id=${s.id}`,
      image: s.cover_image ?? s.logo_url,
      offers,
      maxPercent: Math.max(0, ...offers.map(percentOf)),
      rating: 0,
      distanceKm: coords && s.lat != null && s.lng != null ? haversineKm(coords.lat, coords.lng, Number(s.lat), Number(s.lng)) : null,
      area: s.location_name ?? s.city,
      tagline: [s.category, s.subcategory].filter(Boolean).join(', ') || null,
      costForTwo: null,
      stampSheet: (s.store_subscriptions?.some(x => x.repeat_rewards_enabled) ?? false) && stampGate(s.id),
      trending: !!s.is_advertised,
      isVeg: false,
      cuisines: [],
      caps: capsOf(s),
      bookable: wellness && canBook(s),
      acceptsCashback: acceptsCashback(s),
    })
  }

  return items.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
}
