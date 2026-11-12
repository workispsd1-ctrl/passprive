import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { canPayBill, getCashbackPct } from '@/lib/cashback'
import { getRestaurantBySlugOrId } from '@/lib/services/dining'
import { getStoreBySlugOrId } from '@/lib/services/stores'
import { storeHref } from '@/lib/storeType'
import { getSubscriptionPlans, getUserPlan } from '@/lib/services/subscription'
import { getDiscountCaps } from '@/lib/services/membershipCaps'
import { billOffers, type OffersTableRow, type RestaurantOfferRow } from '@/lib/payBill'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { DESIGN_UNIT, TYPE_SCALE } from '@/components/sections/dining/designUnit'
import { cn } from '@/lib/utils'
import { PayBillClient } from './PayBillClient'

export const metadata: Metadata = { title: 'Pay Bill | PassPrivé' }

type Merchant = {
  kind: 'restaurant' | 'store'
  /** capability fields for canPayBill / getCashbackPct */
  caps: Parameters<typeof canPayBill>[0]
  panel: import('@/components/sections/dining/MerchantFlowParts').MerchantPanelData
  href: string
  ownOffers: RestaurantOfferRow[]
}

/** The restaurant or store being paid — app parity: PayBillScreen paymentSource. */
async function loadMerchant(restaurantId?: string, storeId?: string): Promise<{ found: false; name?: string; href: string; kind: Merchant['kind'] } | ({ found: true } & Merchant)> {
  if (storeId) {
    const detail = await getStoreBySlugOrId(storeId)
    if (!detail) return { found: false, href: '/stores', kind: 'store' }
    const st = detail.store as typeof detail.store & { lat?: number | null; lng?: number | null; is_advertised?: boolean | null; merchant_type?: string | null }
    const href = storeHref(st)
    if (!canPayBill(st)) return { found: false, name: st.name, href, kind: 'store' }
    const supabase = await createClient()
    // app parity: PayBillScreen — the store's own offers with their spend rules
    const { data: own } = await supabase
      .from('store_offers')
      .select('id, title, description, badge_text, offer_type, discount_value, min_spend')
      .eq('store_id', st.id)
      .eq('is_active', true)
    return {
      found: true,
      kind: 'store',
      caps: st,
      href,
      ownOffers: (own ?? []) as RestaurantOfferRow[],
      panel: {
        id: st.id,
        name: st.name,
        area: st.location_name ?? null,
        city: st.city ?? null,
        lat: st.lat ?? null,
        lng: st.lng ?? null,
        cover: st.cover_image ?? detail.gallery[0]?.file_url ?? null,
        cuisines: [st.category, st.subcategory].filter((x): x is string => !!x).slice(0, 2),
        costForTwo: null,
        rating: { avg: 0, count: 0 },
        stampSheet: false,
        trending: !!st.is_advertised,
        exclusive: String(st.merchant_type ?? '').toLowerCase() === 'preferred',
      },
    }
  }
  const detail = restaurantId ? await getRestaurantBySlugOrId(restaurantId) : null
  const restaurant = detail?.restaurant ?? null
  if (!detail || !restaurant) return { found: false, href: '/dining', kind: 'restaurant' }
  const href = `/dining/${restaurant.id}`
  if (!canPayBill(restaurant)) return { found: false, name: restaurant.name, href, kind: 'restaurant' }
  const tagsOf = (type: string) => detail.tags.filter(t => t.tag_type === type).map(t => t.tag_value)
  return {
    found: true,
    kind: 'restaurant',
    caps: restaurant,
    href,
    ownOffers: detail.offers as RestaurantOfferRow[],
    panel: {
      id: restaurant.id,
      name: restaurant.name,
      area: restaurant.area,
      city: restaurant.city,
      lat: restaurant.latitude,
      lng: restaurant.longitude,
      cover: restaurant.cover_image ?? detail.galleryPhotos[0] ?? null,
      cuisines: tagsOf('cuisine').slice(0, 2),
      costForTwo: restaurant.cost_for_two,
      rating: detail.reviewSummary,
      stampSheet: tagsOf('mood').some(m => m.toLowerCase().includes('stamp')),
      trending: !!restaurant.is_advertised,
      exclusive: String(restaurant.merchant_type ?? '').toLowerCase() === 'preferred',
    },
  }
}

/**
 * Pay a restaurant, store or salon bill — flow from the app (PayBillScreen → BillSummaryScreen
 * → payment → BillPaymentSuccessScreen), drawn as the Figma "Flow Pay Bill"
 * frames: the restaurant on the left, the current step in a card on the right.
 */
export default async function PayBillPage({ searchParams }: { searchParams: Promise<{ restaurant_id?: string; store_id?: string; order?: string; amount?: string; offer?: string }> }) {
  const { restaurant_id, store_id, amount, offer, order } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const merchant = await loadMerchant(restaurant_id, store_id)
  const word = merchant.kind === 'store' ? 'store' : 'restaurant'

  if (!merchant.found) {
    const name = merchant.name
    return (
      <main className='flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center font-(family-name:--font-dm-sans)'>
        <SetPageTitle title='Pay Bill' />
        <p className='text-2xl font-bold text-[#2c2d32]'>{name ? 'Bill payment isn’t available here yet' : `${word[0].toUpperCase()}${word.slice(1)} not found`}</p>
        <p className='max-w-sm text-[15px] text-[#5b5a5a]'>
          {name
            ? `${name} doesn’t take bill payments on PassPrivé yet. Pay at the counter as usual.`
            : `Open a ${word} and tap Pay bill to pay from here.`}
        </p>
        <Link href={merchant.href} className='mt-3 rounded-full bg-[#ff4800] px-6 py-3 text-[15px] font-semibold text-white hover:bg-brand-dark'>
          {name ? `Back to ${name}` : merchant.kind === 'store' ? 'Explore stores' : 'Explore restaurants'}
        </Link>
      </main>
    )
  }

  const [tableRes, plan, caps, plans, platformRes] = await Promise.all([
    supabase
      .from('offers')
      .select('id, source_type, owner_entity_type, owner_entity_id, module, payment_flow, title, subtitle, description, badge_text, logo_url, offer_type, benefit_value, benefit_percent, max_discount_amount, min_bill_amount, max_bill_amount, priority, starts_at, ends_at, sponsor_name')
      .eq('is_active', true)
      .order('priority', { ascending: true }),
    getUserPlan(user?.id),
    getDiscountCaps(),
    getSubscriptionPlans(),
    // app parity: platformFlags — superadmin earn / burn switches; only an explicit false turns one off
    supabase.from('platform_settings').select('cashback_earn_enabled, cashback_burn_enabled').maybeSingle(),
  ])
  const earnOn = platformRes.data?.cashback_earn_enabled !== false
  const burnOn = platformRes.data?.cashback_burn_enabled !== false

  const offers = billOffers(
    merchant.panel.id,
    merchant.ownOffers,
    (tableRes.data ?? []) as OffersTableRow[],
    Date.now(),
    merchant.kind === 'store' ? 'STORE' : 'RESTAURANT',
  )
  // app parity: BillSummaryScreen — the upgrade is always one tier up
  const nextPlan = plan === 'free' ? 'premiere' : plan === 'premiere' ? 'black' : null
  const nextRow = nextPlan
    ? plans.find(row => {
        const name = row.plan_name.toLowerCase()
        return nextPlan === 'black' ? name.includes('black') : name.includes('plus') || name.includes('premium')
      })
    : undefined
  const ratio = nextPlan && caps[plan] > 0 ? caps[nextPlan] / caps[plan] : null
  const resumeAmount = Number(amount)

  return (
    <main
      className={cn('min-h-screen bg-white font-(family-name:--font-dm-sans) max-md:[--t:0.62px]', TYPE_SCALE)}
      style={{ ['--u' as string]: DESIGN_UNIT }}
    >
      <PayBillClient
        isOrder={order === '1'}
        merchantKind={merchant.kind}
        merchantHref={merchant.href}
        restaurant={merchant.panel}
        offers={offers}
        plan={plan}
        sharePct={caps[plan]}
        cashbackPct={earnOn ? getCashbackPct(merchant.caps, plan) : 0}
        burnEnabled={burnOn}
        upsell={
          nextPlan && nextRow
            ? {
                plan: nextPlan,
                pct: earnOn ? getCashbackPct(merchant.caps, nextPlan) : 0,
                planId: nextRow.id,
                amount: Number(nextRow.amount) || 0,
                multiplier: ratio == null ? null : Number.isInteger(ratio) ? `${ratio}x` : `${ratio.toFixed(1)}x`,
              }
            : null
        }
        initialAmount={resumeAmount > 0 ? resumeAmount : null}
        initialOffer={offer === undefined ? undefined : offer === 'none' ? null : offer}
      />
    </main>
  )
}
