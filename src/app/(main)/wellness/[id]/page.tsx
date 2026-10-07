import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServiceStoreBySlugOrId, getWellnessStores } from '@/lib/services/stores'
import { PhotoGalleryProvider, PhotoGrid } from '@/components/sections/dining/PhotoGalleryClient'
import { RestaurantLocationSection } from '@/components/sections/dining/RestaurantLocationSection'
import { ServiceHeader } from '@/components/sections/wellness/detail/ServiceHeader'
import { ServiceSectionTabs } from '@/components/sections/wellness/detail/ServiceSectionTabs'
import { ServiceOffersSection } from '@/components/sections/wellness/detail/ServiceOffersSection'
import { ServiceMenuSection } from '@/components/sections/wellness/detail/ServiceMenuSection'
import { ServiceReviewsSection } from '@/components/sections/wellness/detail/ServiceReviewsSection'
import { ServiceAboutSection } from '@/components/sections/wellness/detail/ServiceAboutSection'
import { ServiceBookingCard } from '@/components/sections/wellness/detail/ServiceBookingCard'
import { ServiceStoreRails } from '@/components/sections/wellness/detail/ServiceStoreRails'
import { showsCashbackBadge } from '@/lib/cashback'

const fetchStore = cache((id: string) => getServiceStoreBySlugOrId(id))

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const data = await fetchStore(id)
  if (!data) return {}

  const { store } = data
  const summary = store.description ?? [store.category, store.subcategory].filter(Boolean).join(' · ')
  const city = store.city ?? store.location_name

  return {
    title: store.name,
    description: `${summary || `Discover ${store.name}`}${city ? ` — ${city}` : ''}. Explore services and exclusive member offers at ${store.name} on PassPrivé.`,
    openGraph: {
      title: `${store.name} | PassPrivé`,
      description: summary || `Discover ${store.name} on PassPrivé`,
      url: `/wellness/${store.slug ?? id}`,
      images: store.cover_image ? [{ url: store.cover_image, alt: store.name }] : [],
    },
    alternates: { canonical: `/wellness/${store.slug ?? id}` },
  }
}

/** Wellness (salon / spa) store detail — app parity: screens/ServiceStoreDetails.jsx. */
export default async function WellnessStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [data, wellnessStores] = await Promise.all([fetchStore(id), getWellnessStores()])
  if (!data) notFound()

  const { store, gallery, hours, categories, inStoreOffers, bankOffers, reviews } = data

  const summary = {
    avg: reviews.length ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length : 0,
    count: reviews.length,
  }
  const breadcrumbCity = store.city ?? store.location_name ?? 'Wellness'

  // app parity: the Offers tab only shows when the offers block has content.
  const hasOffers = inStoreOffers.length > 0 || bankOffers.length > 0 || showsCashbackBadge(store)
  const tabs = [
    hasOffers && { id: 'offers', label: 'Offers' },
    categories.length > 0 && { id: 'services', label: 'Services' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'about', label: 'About' },
  ].filter((t): t is { id: string; label: string } => !!t)

  return (
    <PhotoGalleryProvider photos={gallery}>
      <main className='min-h-screen bg-white pb-32 md:pb-0'>
        <PhotoGrid photos={gallery} restaurantName={store.name} backHref='/wellness' />

        <div className='mx-auto max-w-7xl px-4 md:px-6'>
          <nav className='hidden items-center gap-1.5 pt-3 pb-2 text-[12px] text-gray-400 md:flex'>
            <Link href='/' className='transition-colors hover:text-gray-600'>Home page</Link>
            <span>/</span>
            <Link href='/wellness' className='transition-colors hover:text-gray-600'>Wellness</Link>
            <span>/</span>
            <span className='text-gray-500'>{breadcrumbCity}</span>
            <span>/</span>
            <span className='text-gray-600'>{store.name}</span>
          </nav>

          <div className='md:grid md:grid-cols-[1fr_340px] md:items-start md:gap-10 md:pt-2'>
            <div className='min-w-0'>
              <ServiceHeader store={store} hours={hours} rating={summary} />
              <ServiceSectionTabs tabs={tabs} />
              <ServiceOffersSection inStoreOffers={inStoreOffers} bankOffers={bankOffers} merchant={store} />
              <ServiceMenuSection categories={categories} />
              <ServiceReviewsSection reviews={reviews} summary={summary} />
              <ServiceAboutSection highlights={store.top_items} description={store.description} />
              <RestaurantLocationSection
                name={store.name}
                fullAddress={store.address_line1}
                area={store.location_name}
                city={store.city}
                latitude={store.lat}
                longitude={store.lng}
                phone={store.phone}
              />
            </div>

            <ServiceBookingCard store={store} hasServices={categories.length > 0} />
          </div>
        </div>

        <ServiceStoreRails
          stores={wellnessStores}
          currentId={store.id}
          category={store.category}
          subcategory={store.subcategory}
        />
      </main>
    </PhotoGalleryProvider>
  )
}
