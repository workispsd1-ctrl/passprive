import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getTouristPlaceBySlugOrId } from '@/lib/services/touristPlaces'
import { getTouristPricing, placeImageUrl } from '@/lib/touristCatalog'
import { buildTourPackages, paymentOptions } from '@/lib/touristBooking'
import { TouristBookingFlow } from '@/components/sections/tourist/TouristBookingFlow'
import { ClientOnly } from '@/components/sections/booking/BookingPickers'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { place } = await getTouristPlaceBySlugOrId(id)
  if (!place) return {}
  return { title: `Check availability · ${place.place_name} | PassPrivé`, robots: { index: false } }
}

/** Tourist "Check availability" — app parity: TouristCheckAvailabilityScreen.jsx. */
export default async function TouristBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { place } = await getTouristPlaceBySlugOrId(id)
  if (!place || !place.booking_enabled) notFound()

  // `*` because the package detail columns (title, session, duration, …) come
  // from a later migration and may not exist yet — same as the app.
  const supabase = await createClient()
  const { data: activities } = await supabase
    .from('tourist_place_activities')
    .select('*')
    .eq('tourist_place_id', place.id)
    .eq('is_active', true)
    .order('created_at')

  const pricing = getTouristPricing(place)
  const packages = buildTourPackages((activities ?? []) as Record<string, unknown>[], place, pricing.price)
  const placeHref = `/tourist/${place.slug ?? place.id}`
  const image = placeImageUrl(place)

  return (
    <main className='min-h-screen bg-gray-50'>
      <div className='border-b border-gray-200 bg-white'>
        <div className='mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8'>
          <Link href={placeHref} aria-label='Back' className='shrink-0 text-gray-400 transition-colors hover:text-gray-700'>
            <ArrowLeft className='h-5 w-5' />
          </Link>
          <div className='relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-200'>
            {image && <Image src={image} alt={place.place_name} fill className='object-cover' sizes='56px' priority />}
          </div>
          <div className='min-w-0'>
            <h1 className='truncate text-base leading-tight font-extrabold text-gray-900'>Check availability</h1>
            <p className='mt-0.5 truncate text-xs text-gray-500'>{place.place_name}</p>
          </div>
        </div>
      </div>

      <div className='mx-auto max-w-5xl px-4 py-8 pb-16 sm:px-6 lg:px-8'>
        <ClientOnly>
          <TouristBookingFlow
            placeName={place.place_name}
            placeHref={placeHref}
            phone={place.phone}
            advanceDays={place.advance_booking_days}
            packages={packages}
            pricing={pricing}
            payments={paymentOptions(place)}
          />
        </ClientOnly>
      </div>
    </main>
  )
}
