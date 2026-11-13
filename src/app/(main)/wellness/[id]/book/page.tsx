import { getBookingFee } from '@/lib/services/bookings'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
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
  const [settings, { data: { user } }, bookingFee] = await Promise.all([
    getStoreBookingSettings(store.id),
    supabase.auth.getUser(),
    getBookingFee(),
  ])

  const href = `/wellness/${store.slug ?? store.id}`
  const address = store.address_line1 ?? [store.location_name, store.city].filter(Boolean).join(', ')

  return (
    // the flow draws its own banner and frame — the website layout, like Order & Collect
    <ClientOnly>
      <ServiceBookingFlow
        store={{
          id: store.id,
          name: store.name,
          href,
          address: address || null,
          cover: store.cover_image ?? null,
          logo: store.logo_url ?? null,
          caps: {
            merchant_type: store.merchant_type,
            merchant_plan: store.merchant_plan,
            pay_bill_enabled: store.pay_bill_enabled,
            service_level: store.service_level,
            on_boarded: store.on_boarded,
            cashback_enabled: store.cashback_enabled,
          },
          ...settings,
          bookingFee,
        }}
        categories={categories}
        hours={hours}
        offers={inStoreOffers}
        initialCategoryId={category ?? null}
        isLoggedIn={!!user}
      />
    </ClientOnly>
  )
}
