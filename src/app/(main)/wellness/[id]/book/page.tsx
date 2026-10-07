import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getServiceStoreBySlugOrId, getStoreBookingSettings } from '@/lib/services/stores'
import { createClient } from '@/lib/supabase/server'
import { canBook } from '@/lib/cashback'
import { ServiceBookingFlow } from '@/components/sections/wellness/booking/ServiceBookingFlow'
import { ClientOnly } from '@/components/sections/booking/BookingPickers'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const data = await getServiceStoreBySlugOrId(id)
  if (!data) return {}
  return { title: `Book a Slot · ${data.store.name} | PassPrivé`, robots: { index: false } }
}

/** Service appointment booking — app parity: ServiceSelection → ServiceBookSlot → ReviewStoreBooking. */
export default async function WellnessBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ category?: string }>
}) {
  const [{ id }, { category }] = await Promise.all([params, searchParams])
  const [data, supabase] = await Promise.all([getServiceStoreBySlugOrId(id), createClient()])
  if (!data || !canBook(data.store)) notFound()

  const { store, categories, hours, inStoreOffers } = data
  const [settings, { data: { user } }] = await Promise.all([
    getStoreBookingSettings(store.id),
    supabase.auth.getUser(),
  ])

  const href = `/wellness/${store.slug ?? store.id}`
  const address = store.address_line1 ?? [store.location_name, store.city].filter(Boolean).join(', ')

  return (
    <main className='min-h-screen bg-gray-50'>
      <div className='border-b border-gray-200 bg-white'>
        <div className='mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8'>
          <Link href={href} aria-label='Back' className='shrink-0 text-gray-400 transition-colors hover:text-gray-700'>
            <ArrowLeft className='h-5 w-5' />
          </Link>
          <div className='relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-200'>
            {(store.logo_url ?? store.cover_image) && (
              <Image src={(store.logo_url ?? store.cover_image) as string} alt={store.name} fill className='object-cover' sizes='56px' priority />
            )}
          </div>
          <div className='min-w-0'>
            <h1 className='truncate text-base leading-tight font-extrabold text-gray-900'>{store.name}</h1>
            {address && <p className='mt-0.5 truncate text-xs text-gray-500'>{address}</p>}
          </div>
        </div>
      </div>

      <div className='mx-auto max-w-5xl px-4 py-8 pb-16 sm:px-6 lg:px-8'>
        <ClientOnly>
          <ServiceBookingFlow
            store={{
              id: store.id,
              name: store.name,
              href,
              address: address || null,
              ...settings,
            }}
            categories={categories}
            hours={hours}
            offers={inStoreOffers}
            initialCategoryId={category ?? null}
            isLoggedIn={!!user}
          />
        </ClientOnly>
      </div>
    </main>
  )
}
