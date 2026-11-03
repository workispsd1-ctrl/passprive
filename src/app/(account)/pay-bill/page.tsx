import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { canPayBill, getCashbackPct } from '@/lib/cashback'
import { getRestaurantBySlugOrId } from '@/lib/services/dining'
import { getSubscriptionPlans, getUserPlan } from '@/lib/services/subscription'
import { getDiscountCaps } from '@/lib/services/membershipCaps'
import { billOffers, type OffersTableRow, type RestaurantOfferRow } from '@/lib/payBill'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { DESIGN_UNIT, TYPE_SCALE } from '@/components/sections/dining/designUnit'
import { cn } from '@/lib/utils'
import { PayBillClient } from './PayBillClient'

export const metadata: Metadata = { title: 'Pay Bill | PassPrivé' }

/**
 * Pay a restaurant bill — flow from the app (PayBillScreen → BillSummaryScreen
 * → payment → BillPaymentSuccessScreen), drawn as the Figma "Flow Pay Bill"
 * frames: the restaurant on the left, the current step in a card on the right.
 */
export default async function PayBillPage({ searchParams }: { searchParams: Promise<{ restaurant_id?: string; amount?: string; offer?: string }> }) {
  const { restaurant_id, amount, offer } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const detail = restaurant_id ? await getRestaurantBySlugOrId(restaurant_id) : null
  const restaurant = detail?.restaurant ?? null

  if (!detail || !restaurant || !canPayBill(restaurant)) {
    return (
      <main className='flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center font-(family-name:--font-dm-sans)'>
        <SetPageTitle title='Pay Bill' />
        <p className='text-2xl font-bold text-[#2c2d32]'>{restaurant ? 'Bill payment isn’t available here yet' : 'Restaurant not found'}</p>
        <p className='max-w-sm text-[15px] text-[#5b5a5a]'>
          {restaurant
            ? `${restaurant.name} doesn’t take bill payments on PassPrivé yet. Pay at the counter as usual.`
            : 'Open a restaurant and tap Pay bill to pay from here.'}
        </p>
        <Link href={restaurant ? `/dining/${restaurant.id}` : '/dining'} className='mt-3 rounded-full bg-[#ff4800] px-6 py-3 text-[15px] font-semibold text-white hover:bg-brand-dark'>
          {restaurant ? `Back to ${restaurant.name}` : 'Explore restaurants'}
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

  const tagsOf = (type: string) => detail.tags.filter(t => t.tag_type === type).map(t => t.tag_value)
  const offers = billOffers(restaurant.id, detail.offers as RestaurantOfferRow[], (tableRes.data ?? []) as OffersTableRow[])
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
        restaurant={{
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
        }}
        offers={offers}
        plan={plan}
        sharePct={caps[plan]}
        cashbackPct={earnOn ? getCashbackPct(restaurant, plan) : 0}
        burnEnabled={burnOn}
        upsell={
          nextPlan && nextRow
            ? {
                plan: nextPlan,
                pct: earnOn ? getCashbackPct(restaurant, nextPlan) : 0,
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
