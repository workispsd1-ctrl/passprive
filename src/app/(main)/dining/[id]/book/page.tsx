import { getStampGate } from '@/lib/services/platformFlags'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getRestaurantBySlugOrId } from '@/lib/services/dining'
import { getBookingById, getBookingFee, getBookingRewardAmount } from '@/lib/services/bookings'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { DiningBookingFlow } from '@/components/sections/dining/booking/DiningBookingFlow'
import { BookingResult } from '@/components/sections/dining/booking/BookingResult'
import { ClientOnly } from '@/components/sections/booking/BookingPickers'
import { DESIGN_UNIT, TYPE_SCALE } from '@/components/sections/dining/designUnit'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const { restaurant } = await getRestaurantBySlugOrId(id)
  if (!restaurant) return {}
  return { title: `Book a Table · ${restaurant.name} | PassPrivé` }
}

/**
 * Table booking — flow from the app (BookTableModal → ReviewRestaurantBooking
 * → payment), UI from the Figma "Flow Book Table" frames. With `?booked=` the
 * page draws the receipt ("Table booked" / "Requested table") instead.
 */
export default async function BookTablePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ booked?: string; offer?: string; paid?: string }>
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const [detail, supabase] = await Promise.all([getRestaurantBySlugOrId(id), createClient()])
  const { restaurant, allHours, offers, tags, reviewSummary, galleryPhotos } = detail
  if (!restaurant) notFound()

  const [{ data: { user } }, bookingFee, stampGate] = await Promise.all([supabase.auth.getUser(), getBookingFee(), getStampGate()])
  const { data: policy } = await supabase
    .from('restaurants')
    .select('cancellation_available, cancellation_cutoff_minutes')
    .eq('id', restaurant.id)
    .maybeSingle<{ cancellation_available: boolean | null; cancellation_cutoff_minutes: number | null }>()
  const cancellation = { available: policy?.cancellation_available === true, cutoffMinutes: policy?.cancellation_cutoff_minutes ?? null }
  const location = [restaurant.area, restaurant.city].filter(Boolean).join(', ')
  // the frames span the screen — break out of the site's 1280px column, as the detail page does
  const wrapper = cn('min-h-screen bg-white font-(family-name:--font-dm-sans) max-md:[--t:0.62px] md:mx-[calc(50%-50vw)] md:-mt-9.5 md:w-screen', TYPE_SCALE)
  const style = { ['--u' as string]: DESIGN_UNIT }

  // the receipt, after a booking is made
  const booking = sp.booked && user ? await getBookingById(sp.booked, user.id) : null
  if (booking) {
    const rewardAmount = await getBookingRewardAmount(booking.id)
    return (
      <main className={wrapper} style={style}>
        <div className='relative overflow-x-clip bg-linear-to-b from-[#fff3ee] to-white to-40% px-4' style={{ paddingTop: 'calc(72 * var(--t))', paddingBottom: 'calc(120 * var(--t))' }}>
          <BookingResult
            b={{
              id: booking.id,
              code: booking.booking_code,
              status: booking.status,
              date: booking.booking_date,
              time24: booking.booking_time.slice(0, 5),
              guests: booking.party_size,
              restaurantName: restaurant.name,
              location,
              offer: sp.offer ?? null,
              paid: sp.paid === '1',
              cancellation,
              proposal: {
                status: booking.status,
                proposed_at: booking.proposed_at,
                proposed_date: booking.proposed_date,
                proposed_time: booking.proposed_time,
              },
              restaurantId: restaurant.id,
              coverRequest: {
                cover_request_status: booking.cover_request_status,
                cover_request_amount: booking.cover_request_amount,
                cover_request_total: booking.cover_request_total,
                cover_request_due_at: booking.cover_request_due_at,
              },
              rewardAmount,
            }}
          />
        </div>
      </main>
    )
  }

  if (!restaurant.booking_enabled) notFound()
  const tagsOf = (type: string) => tags.filter(t => t.tag_type === type).map(t => t.tag_value)
  const backHref = `/dining/${restaurant.slug ?? restaurant.id}`
  // bank-card offers are add-ons on the bill, not booking options
  const bookingOffers = offers.filter(o => o.offer_type !== 'bank_card' && o.offer_type !== 'credit_card')

  return (
    <main className={wrapper} style={style}>
      <ClientOnly>
        <DiningBookingFlow
          restaurant={{
            id: restaurant.id,
            name: restaurant.name,
            cover_charge_enabled: restaurant.cover_charge_enabled,
            cover_charge_amount: restaurant.cover_charge_amount,
            booking_fee: bookingFee,
            merchant_type: restaurant.merchant_type,
            merchant_plan: restaurant.merchant_plan,
            pay_bill_enabled: restaurant.pay_bill_enabled,
            service_level: restaurant.service_level,
            on_boarded: restaurant.on_boarded,
            cashback_enabled: restaurant.cashback_enabled,
          }}
          panel={{
            id: restaurant.id,
            name: restaurant.name,
            area: restaurant.area,
            city: restaurant.city,
            lat: restaurant.latitude,
            lng: restaurant.longitude,
            cover: restaurant.cover_image ?? galleryPhotos[0] ?? null,
            cuisines: tagsOf('cuisine').slice(0, 2),
            costForTwo: restaurant.cost_for_two,
            rating: reviewSummary,
            stampSheet: stampGate(restaurant.id) && tagsOf('mood').some(m => m.toLowerCase().includes('stamp')),
            trending: !!restaurant.is_advertised,
            exclusive: String(restaurant.merchant_type ?? '').toLowerCase() === 'preferred',
          }}
          hours={allHours}
          offers={bookingOffers}
          isLoggedIn={!!user}
          backHref={backHref}
          bookHref={`/dining/${restaurant.slug ?? restaurant.id}/book`}
          cancellation={cancellation}
        />
      </ClientOnly>
    </main>
  )
}
