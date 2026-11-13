import { getStampGate } from '@/lib/services/platformFlags'
import { getRestaurantFeed } from '@/lib/services/dining'
import { getActiveStores } from '@/lib/services/stores'
import { getCollectStamps } from '@/lib/services/visitRewards'
import { getOffersForYou } from '@/lib/services/offersForYou'
import { isWellnessStore } from '@/lib/storeType'
import { isOfferLive, isRepeatRewardOffer, offerBenefitLabel, offerStripText, type MerchantOffer } from '@/lib/deals'
import { haversineKm } from '@/lib/utils'
import type { Coords } from '@/lib/restaurantFilters'
import { getCashbackPct, type MerchantCapabilityFields } from '@/lib/cashback'
import type { StampCardData } from '@/lib/stamps'
import type { OfferForYouCard } from '@/lib/types/offersForYou'

export type DealGroup = 'dining' | 'shopping' | 'wellness'

/** One restaurant or store, flattened for the Great Deals cards. */
export type DealCard = {
  key: string
  id: string
  kind: 'restaurant' | 'store'
  group: DealGroup
  name: string
  href: string
  /** where "Pay bill" goes */
  payHref: string
  image: string | null
  /** best offer first */
  offers: string[]
  /** biggest percentage off across the live offers (0 = none) — "Min 30% OFF" */
  maxPercent: number
  rating: number
  distanceKm: number | null
  area: string | null
  /** cuisines, or the store's category */
  tagline: string | null
  costForTwo: number | null
  stampSheet: boolean
  trending: boolean
  isVeg: boolean
  cuisines: string[]
  /** capability flags — the viewer's plan picks the cashback % on the client */
  caps: MerchantCapabilityFields
}

export type ExclusiveDeal = {
  key: string
  name: string
  logo: string
  href: string
  /** "FLAT" or "UP TO" */
  lead: string
  /** "Rs." prefix or "" */
  prefix: string
  value: string
  /** "OFF" or "% OFF" */
  suffix: string
}

export type StampDeal = StampCardData & { group: DealGroup }

export type GreatDealsData = {
  /** "Try new deals in dining": 20 restaurants, ones with a deal first */
  dining: DealCard[]
  /** "All offers" → Dining: every restaurant in scope with an offer or bill cashback */
  diningOffers: DealCard[]
  stores: DealCard[]
  stamps: StampDeal[]
  offersForYou: OfferForYouCard[]
  exclusive: ExclusiveDeal[]
}

/** app parity: utils/locationScope.js NEARBY_RADIUS_KM / FALLBACK_RADIUS_KM */
const NEARBY_RADIUS_KM = 15
const FALLBACK_RADIUS_KM = 30

type StoreOffer = MerchantOffer & { metadata?: Record<string, unknown> | null }

const percentOf = (text: string) => {
  const m = text.match(/(\d+(?:\.\d+)?)\s*%/)
  return m ? Number(m[1]) : 0
}

/** Lead with the saving — "Flat 13% OFF + In-store" — rather than a bare badge like "In-store". */
function stripLabel(o: StoreOffer): string {
  const benefit = offerBenefitLabel(o)
  const badge = String(o.badge_text ?? '').trim()
  if (/OFF$/.test(benefit)) {
    const saving = `Flat ${benefit}`
    return badge && !badge.toUpperCase().includes(benefit.replace(' OFF', '')) ? `${saving} + ${badge}` : saving
  }
  return offerStripText(o)
}

const capsOf = (e: MerchantCapabilityFields): MerchantCapabilityFields => ({
  merchant_type: e.merchant_type,
  merchant_plan: e.merchant_plan,
  pay_bill_enabled: e.pay_bill_enabled,
  service_level: e.service_level,
  on_boarded: e.on_boarded,
  booking_enabled: e.booking_enabled,
  cashback_enabled: e.cashback_enabled,
  is_promoted: e.is_promoted,
})

/**
 * Every restaurant in scope — app parity: fetchScopedFeed + locationScope
 * widenIfEmpty: within 15 km (30 km when none are that close), nearest
 * first; without a location, all of them.
 */
async function getDiningPool(coords: Coords | null) {
  if (!coords) return getRestaurantFeed({}, 0, 500, null)
  for (const radiusKm of [NEARBY_RADIUS_KM, FALLBACK_RADIUS_KM]) {
    const rows = await getRestaurantFeed({ sort: 'distance' }, 0, 200, coords, { radiusKm })
    if (rows.length) return rows
  }
  return []
}

/** Paid merchants first, then nearest — app parity: utils/badgedFirst.js badgedNearbyFirst. */
function badgedNearbyFirst(cards: DealCard[]): DealCard[] {
  const paid = (c: DealCard) => (String(c.caps.merchant_type ?? '').match(/preferred|verified/i) ? 0 : 1)
  return [...cards].sort((a, b) => paid(a) - paid(b) || (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
}

/**
 * Great Deals — app parity: screens/DealsScreen.jsx loadDeals: restaurants in
 * scope (fetchScopedFeed ignores its `hasOffer` filter, so every restaurant is
 * a candidate — here the ones with an offer or cashback lead the rail), every
 * active store (nearest, badged first),
 * stamp cards with progress, plus the "Offers for you" bank cards. The
 * Figma's "Exclusive deals" row is built from live store offers at stores
 * with a logo (the app has no such row).
 */
export async function getGreatDeals(coords: Coords | null): Promise<GreatDealsData> {
  const [feed, storeRows, stamps, offersForYou, stampGate] = await Promise.all([
    getDiningPool(coords),
    getActiveStores(),
    getCollectStamps().catch(() => ({ restaurants: [], salons: [], stores: [] })),
    getOffersForYou(),
    getStampGate(),
  ])

  const dining: DealCard[] = feed.map((r) => {
    const offer = r.offer_badge?.trim()
    const distance =
      coords && r.latitude != null && r.longitude != null
        ? haversineKm(coords.lat, coords.lng, Number(r.latitude), Number(r.longitude))
        : (r.distance_km ?? null)
    return {
      key: `r-${r.id}`,
      id: r.id,
      kind: 'restaurant',
      group: 'dining',
      name: r.name,
      href: `/dining/${r.slug ?? r.id}`,
      payHref: `/pay-bill?restaurant_id=${r.id}&restaurant_name=${encodeURIComponent(r.name)}`,
      image: r.cover_image,
      offers: offer ? [offer] : [],
      maxPercent: offer ? percentOf(offer) : 0,
      rating: Number(r.rating) || 0,
      distanceKm: distance,
      area: r.area ?? r.city,
      tagline: r.cuisines.length ? r.cuisines.join(', ') : null,
      costForTwo: r.cost_for_two,
      stampSheet: stampGate(r.id) && (r.repeat_rewards_enabled || r.mood.some((m) => m.toLowerCase().includes('stamp'))),
      trending: r.is_advertised,
      isVeg: r.is_pure_veg,
      cuisines: r.cuisines,
      caps: capsOf(r),
    }
  })

  const exclusive: { deal: ExclusiveDeal; score: number }[] = []
  const stores: DealCard[] = storeRows.map((s) => {
    const wellness = isWellnessStore(s)
    const slug = s.slug ?? s.id
    const live = ((s as { store_offers?: StoreOffer[] | null }).store_offers ?? []).filter(
      (o) => isOfferLive(o) && !isRepeatRewardOffer(o),
    )
    const ranked = live
      .map((o) => ({ o, value: Number(o.discount_value) || 0, pct: String(o.offer_type ?? '').toLowerCase().startsWith('percent') }))
      .sort((a, b) => (b.pct ? b.value * 10 : b.value) - (a.pct ? a.value * 10 : a.value))
    const offers = ranked.map(({ o }) => stripLabel(o)).filter(Boolean)
    const best = ranked.find(({ o, value }) => value > 0 && !!offerBenefitLabel(o))
    // one coupon per brand — chains list every branch with the same logo
    if (best && s.logo_url && !exclusive.some((x) => x.deal.logo === s.logo_url)) {
      exclusive.push({
        score: best.pct ? best.value * 10 : best.value,
        deal: {
          key: `x-${s.id}`,
          name: s.name,
          logo: s.logo_url,
          href: `/${wellness ? 'wellness' : 'stores'}/${slug}`,
          lead: 'FLAT',
          prefix: best.pct ? '' : 'Rs.',
          value: String(best.value),
          suffix: best.pct ? '% OFF' : 'OFF',
        },
      })
    }
    const sub = s.store_subscriptions?.some((x) => x.repeat_rewards_enabled) ?? false
    return {
      key: `s-${s.id}`,
      id: s.id,
      kind: 'store',
      group: wellness ? 'wellness' : 'shopping',
      name: s.name,
      href: `/${wellness ? 'wellness' : 'stores'}/${slug}`,
      payHref: `/pay-bill?store_id=${s.id}`,
      image: s.cover_image ?? s.logo_url,
      offers,
      maxPercent: Math.max(0, ...ranked.filter((x) => x.pct).map((x) => x.value)),
      rating: 0,
      distanceKm: coords && s.lat != null && s.lng != null ? haversineKm(coords.lat, coords.lng, Number(s.lat), Number(s.lng)) : null,
      area: s.location_name ?? s.city,
      tagline: [s.category, s.subcategory].filter(Boolean).join(', ') || null,
      costForTwo: null,
      stampSheet: sub && stampGate(s.id),
      trending: !!s.is_advertised,
      isVeg: false,
      cuisines: [],
      caps: capsOf(s),
    }
  })

  const stampCards: StampDeal[] = [
    ...stamps.restaurants.map((c) => ({ ...c, group: 'dining' as const })),
    ...stamps.salons.map((c) => ({ ...c, group: 'wellness' as const })),
    ...stamps.stores.map((c) => ({ ...c, group: 'shopping' as const })),
  ].slice(0, 12)

  // a deal = a live offer, or cashback on some plan (the cards pick the viewer's own rate)
  const hasDeal = (c: DealCard) => c.offers.length > 0 || getCashbackPct(c.caps, 'black') > 0
  const diningOffers = badgedNearbyFirst(dining.filter(hasDeal))
  const rest = dining.filter((c) => !hasDeal(c))

  return {
    dining: [...diningOffers, ...rest].slice(0, 20),
    diningOffers,
    stores: badgedNearbyFirst(stores),
    stamps: stampCards,
    offersForYou,
    exclusive: exclusive.sort((a, b) => b.score - a.score).slice(0, 12).map((x) => x.deal),
  }
}

/** app parity: DealsScreen `qualifies` radius — within the nearby radius when a location is known. */
export const DEALS_RADIUS_KM = 15
