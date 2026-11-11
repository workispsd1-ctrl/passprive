import { createClient } from '@/lib/supabase/server'
import {
  bestFirst,
  dealItem,
  offerItem,
  pickDealsForTier,
  type DealQuota,
  type MerchantOffer,
  type RestaurantDeal,
  type RevealItem,
} from '@/lib/deals'

const DEAL_COLUMNS =
  'id, title, description, badge_text, terms, deal_type, currency_code, starts_at, ends_at, start_time, end_time, priority, restaurant_deal_tiers(tier, benefit_percent, benefit_amount, deal_price, buy_quantity, get_quantity, free_item_label, is_active)'
const OFFER_COLUMNS = 'id, title, description, badge_text, offer_type, discount_value, start_at, end_at, is_active, metadata'

export type MerchantDealsState = {
  loggedIn: boolean
  quota: DealQuota | null
  items: RevealItem[]
}

/**
 * The Deal Reveal rail for one merchant — app parity: DealRevealSection.jsx
 * (fetchDealRevealQuota + fetchRestaurantDealRows + fetchMerchantOfferState).
 * Tier deals need a signed-in viewer (the quota row carries the tier); live
 * offers show to everyone. A merchant with `deals_enabled = false` shows none.
 */
export async function getMerchantDeals({
  restaurantId,
  storeId,
}: {
  restaurantId?: string | null
  storeId?: string | null
}): Promise<MerchantDealsState> {
  const ownerId = restaurantId || storeId
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!ownerId) return { loggedIn: !!user, quota: null, items: [] }

  const isRestaurant = !!restaurantId
  const [quotaRes, ownerRes, offersRes, dealsRes] = await Promise.all([
    user ? supabase.rpc('deal_reveal_quota', { p_user_id: user.id }) : Promise.resolve({ data: null }),
    supabase.from(isRestaurant ? 'restaurants' : 'stores').select('deals_enabled').eq('id', ownerId).maybeSingle(),
    supabase
      .from(isRestaurant ? 'restaurant_offers' : 'store_offers')
      .select(OFFER_COLUMNS)
      .eq(isRestaurant ? 'restaurant_id' : 'store_id', ownerId)
      .eq('is_active', true)
      .limit(10),
    isRestaurant
      ? supabase
          .from('restaurant_deals')
          .select(DEAL_COLUMNS)
          .eq('restaurant_id', ownerId)
          .eq('is_active', true)
          .order('priority', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
  ])

  const quotaRow = quotaRes.data as DealQuota | DealQuota[] | null
  const quota = (Array.isArray(quotaRow) ? quotaRow[0] : quotaRow) ?? null
  if ((ownerRes.data as { deals_enabled?: boolean } | null)?.deals_enabled === false) {
    return { loggedIn: !!user, quota, items: [] }
  }

  const offerKind = isRestaurant ? 'restaurant_offer' : 'store_offer'
  const offers = ((offersRes.data ?? []) as MerchantOffer[])
    .map(o => offerItem(o, offerKind))
    .filter((i): i is RevealItem => !!i)
  const deals = pickDealsForTier((dealsRes.data ?? []) as RestaurantDeal[], quota?.tier)
    .map(dealItem)
    .filter((i): i is RevealItem => !!i)

  return { loggedIn: !!user, quota, items: bestFirst([...deals, ...offers]) }
}

export type RevealPlan = {
  tier: string
  plan_name: string | null
  deals_per_month: number | null
  deals_per_restaurant_per_month: number | null
}

/** Plan table for the "used all your reveals" sheet — app parity: DealQuotaSheet.loadPlans. */
export async function getRevealPlans(): Promise<RevealPlan[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subscription')
    .select('tier, plan_name, deals_per_month, deals_per_restaurant_per_month, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: false })
  return ((data ?? []) as (RevealPlan & { sort_order: number })[])
    .filter(plan => plan.tier !== 'cim')
    .map(({ tier, plan_name, deals_per_month, deals_per_restaurant_per_month }) => ({
      tier,
      plan_name,
      deals_per_month,
      deals_per_restaurant_per_month,
    }))
}

/** A restaurant's live deal rows with their tiers — app parity: dealReveals.js fetchRestaurantDealRows. */
export async function getRestaurantDealRows(restaurantId: string): Promise<RestaurantDeal[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('restaurant_deals')
    .select(DEAL_COLUMNS)
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(10)
  return (data ?? []) as RestaurantDeal[]
}
