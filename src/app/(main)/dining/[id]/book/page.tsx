import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getRestaurantBySlugOrId } from '@/lib/services/dining'
import { createClient } from '@/lib/supabase/server'
import { DiningBookingFlow } from '@/components/sections/dining/booking/DiningBookingFlow'
import { ClientOnly } from '@/components/sections/booking/BookingPickers'

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

/** Table booking — app parity: BookTableModal.jsx → ReviewRestaurantBooking.jsx. */
export default async function BookTablePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ restaurant, allHours, offers }, supabase] = await Promise.all([
    getRestaurantBySlugOrId(id),
    createClient(),
  ])
  if (!restaurant) notFound()
  if (!restaurant.booking_enabled) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const location = [restaurant.area, restaurant.city].filter(Boolean).join(', ')
  const backHref = `/dining/${restaurant.slug ?? restaurant.id}`
  const address = restaurant.full_address ?? location
  // bank-card offers are add-ons on the bill, not booking options
  const bookingOffers = offers.filter(o => o.offer_type !== 'bank_card' && o.offer_type !== 'credit_card')

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href={backHref} aria-label="Back" className="text-gray-400 hover:text-gray-700 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-200 shrink-0">
            {restaurant.cover_image && (
              <Image
                src={restaurant.cover_image}
                alt={restaurant.name}
                fill
                className="object-cover"
                sizes="56px"
                priority
              />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold text-gray-900 leading-tight truncate">{restaurant.name}</h1>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {restaurant.cost_for_two && <span>₨{restaurant.cost_for_two} for two</span>}
              {restaurant.cost_for_two && address && <span className="mx-1.5 text-gray-300">|</span>}
              {address && <span className="flex-1">{address}</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <ClientOnly>
          <DiningBookingFlow
            restaurant={{
              id: restaurant.id,
              name: restaurant.name,
              cover_charge_enabled: restaurant.cover_charge_enabled,
              cover_charge_amount: restaurant.cover_charge_amount,
              merchant_type: restaurant.merchant_type,
              merchant_plan: restaurant.merchant_plan,
              pay_bill_enabled: restaurant.pay_bill_enabled,
              service_level: restaurant.service_level,
              on_boarded: restaurant.on_boarded,
            }}
            hours={allHours}
            offers={bookingOffers}
            isLoggedIn={!!user}
            backHref={backHref}
          />
        </ClientOnly>
      </div>
    </main>
  )
}
