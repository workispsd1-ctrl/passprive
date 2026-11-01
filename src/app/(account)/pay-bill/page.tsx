import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { canPayBill, getCashbackPct } from '@/lib/cashback'
import { getRestaurantBySlugOrId } from '@/lib/services/dining'
import { getUserPlan } from '@/lib/services/subscription'
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
export default async function PayBillPage({ searchParams }: { searchParams: Promise<{ restaurant_id?: string }> }) {
  const { restaurant_id } = await searchParams
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

  const [tableRes, plan, caps] = await Promise.all([
    supabase
      .from('offers')
      .select('id, source_type, owner_entity_type, owner_entity_id, module, payment_flow, title, subtitle, description, badge_text, logo_url, offer_type, benefit_value, benefit_percent, max_discount_amount, min_bill_amount, max_bill_amount, priority, starts_at, ends_at, sponsor_name')
      .eq('is_active', true)
      .order('priority', { ascending: true }),
    getUserPlan(user?.id),
    getDiscountCaps(),
  ])

  const tagsOf = (type: string) => detail.tags.filter(t => t.tag_type === type).map(t => t.tag_value)
  const offers = billOffers(restaurant.id, detail.offers as RestaurantOfferRow[], (tableRes.data ?? []) as OffersTableRow[])
  const nextPlan = plan === 'free' ? 'premiere' : plan === 'premiere' ? 'black' : null

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
        cashbackPct={getCashbackPct(restaurant, plan)}
        upsell={nextPlan ? { plan: nextPlan, pct: getCashbackPct(restaurant, nextPlan) } : null}
      />
    </main>
  )
}
