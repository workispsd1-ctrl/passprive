import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServiceStoreBySlugOrId, getWellnessStores } from '@/lib/services/stores'
import { PhotoGalleryProvider, PhotoGrid } from '@/components/sections/dining/PhotoGalleryClient'
import { DetailSectionTabs } from '@/components/shared/detail/DetailSectionTabs'
import { ServiceOffersSection } from '@/components/sections/wellness/detail/ServiceOffersSection'
import { ServiceMenuSection } from '@/components/sections/wellness/detail/ServiceMenuSection'
import { ServiceBookingBar, ServiceBookingCard } from '@/components/sections/wellness/detail/ServiceBookingCard'
import { ServiceStoreRails } from '@/components/sections/wellness/detail/ServiceStoreRails'
import { showsCashbackBadge } from '@/lib/cashback'
import { MerchantRewardsSection } from '@/components/shared/MerchantRewardsSection'
import { DetailTitleBlock } from '@/components/shared/detail/DetailTitleBlock'
import { MerchantActions } from '@/components/shared/detail/MerchantActions'
import { DetailReviews } from '@/components/shared/detail/DetailReviews'
import { DetailAbout } from '@/components/shared/detail/DetailAbout'
import { DetailLocation } from '@/components/shared/detail/DetailLocation'
import { QuickInfoCard } from '@/components/shared/detail/DetailCtaBar'
import { HelpCard } from '@/components/shared/detail/HelpCard'
import { RecordWellnessView } from '@/components/sections/wellness/ContinueWhereLeftOff'
import { MobileTitleCard } from '@/components/shared/detail/MobileTitleCard'
import { UpsellBannerPager } from '@/components/shared/detail/UpsellBannerPager'
import { getDiscountCaps } from '@/lib/services/membershipCaps'
import { canBook, canPayBill } from '@/lib/cashback'

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
  const [data, wellnessStores, caps] = await Promise.all([fetchStore(id), getWellnessStores(), getDiscountCaps()])
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
    { id: 'deals', label: 'Deals' },
    hasOffers && { id: 'offers', label: 'Offers' },
    categories.length > 0 && { id: 'services', label: 'Services' },
    { id: 'reviews', label: 'Reviews' },
    (!!store.description || store.top_items.length > 0) && { id: 'about', label: 'About' },
    !!(store.address_line1 ?? store.location_name) && { id: 'location', label: 'Location' },
  ].filter((t): t is { id: string; label: string } => !!t)

  const address = store.address_line1 ?? [store.location_name, store.city].filter(Boolean).join(', ')
  const categoriesLine = [store.category, store.subcategory].filter(Boolean).join(' · ')
  const hasCta = (canBook(store) && categories.length > 0) || canPayBill(store)

  // app parity: upsellOfferPct — the first percentage offer is what the tiers share
  const offerPct = Number(inStoreOffers.find(o => o.discount_type === 'PERCENT' && Number(o.discount_value) > 0)?.discount_value) || 0
  return (
    <PhotoGalleryProvider photos={gallery}>
      <main className={hasCta ? 'min-h-screen bg-white pb-36 md:pb-0' : 'min-h-screen bg-white'}>
        <RecordWellnessView id={store.id} />
        <nav aria-label='Breadcrumb' className='hidden items-center gap-1.5 px-6 pt-3 text-[12px] text-gray-400 md:flex'>
          <Link href='/' className='transition-colors hover:text-gray-600'>Home</Link>
          <span>/</span>
          <Link href='/wellness' className='transition-colors hover:text-gray-600'>Wellness</Link>
          <span>/</span>
          <span>{breadcrumbCity}</span>
          <span>/</span>
          <span className='text-gray-600'>{store.name}</span>
        </nav>
        <PhotoGrid photos={gallery} restaurantName={store.name} backHref='/wellness' save={{ id: store.id, type: 'STORE' }} cover={store.cover_image} />

        <div className='relative z-10 mx-auto max-w-7xl rounded-t-[20px] bg-white px-4 md:rounded-none md:px-6'>

          <div className='md:grid md:grid-cols-[minmax(0,1fr)_22rem] md:items-start md:gap-12 md:pt-6'>
            <div className='flex min-w-0 flex-col md:block'>
              <MobileTitleCard
                name={store.name}
                subtitle={categoriesLine}
                logo={store.logo_url}
                showLogo
                area={store.location_name}
                city={store.city}
                lat={store.lat}
                lng={store.lng}
                address={address}
                phone={store.phone}
                rating={summary}
                hours={hours}
                trending={store.is_promoted === true}
                offerZone={inStoreOffers.length > 0}
              />
              <DetailTitleBlock
                className='hidden md:block'
                name={store.name}
                eyebrow={categoriesLine || 'Salon & Wellness'}
                logo={store.logo_url}
                showLogo
                rating={summary}
                lat={store.lat}
                lng={store.lng}
                hours={hours}
                address={address}
                actions={
                  <MerchantActions
                    id={store.id}
                    type='STORE'
                    name={store.name}
                    address={address}
                    lat={store.lat}
                    lng={store.lng}
                    phone={store.phone}
                  />
                }
              />
              <DetailSectionTabs tabs={tabs} title={store.name} cta={canBook(store) && categories.length > 0 ? { label: 'Book a slot', href: `/wellness/${store.slug ?? store.id}/book` } : null} className='mt-6' orderClassName='max-md:order-2' />
              <MerchantRewardsSection merchant={store} kind='store' name={store.name} className='max-md:order-1' />
              <UpsellBannerPager
                merchantType={store.merchant_type}
                merchantId={store.id}
                kind='store'
                offerPct={offerPct}
                caps={caps}
                className='mt-4 max-md:order-1 md:mt-8 md:max-w-xl'
              />
              <div className='max-md:order-3 max-md:[&>section:first-of-type]:mt-2 max-md:[&>section:first-of-type]:border-t-0 max-md:[&>section:first-of-type]:pt-5'>
              <ServiceOffersSection inStoreOffers={inStoreOffers} bankOffers={bankOffers} merchant={store} />
              <ServiceMenuSection categories={categories} />
              <DetailReviews kind='store' entityId={store.id} entityName={store.name} reviews={reviews} summary={summary} />
              <DetailAbout
                title='About us'
                description={store.description}
                highlights={store.top_items.join(', ') || null}
              />
              <DetailLocation name={store.name} address={address} lat={store.lat} lng={store.lng} phone={store.phone} hours={hours} />
              <HelpCard className='mt-10' />
              </div>
            </div>

            <aside className='sticky top-16 hidden flex-col gap-4 pt-2 md:flex'>
              <ServiceBookingCard store={store} hasServices={categories.length > 0} />
              <QuickInfoCard
                name={store.name}
                hours={hours}
                address={address}
                lat={store.lat}
                lng={store.lng}
                phone={store.phone}
                website={store.website}
              />
            </aside>
          </div>
        </div>

        <ServiceStoreRails
          stores={wellnessStores}
          currentId={store.id}
          category={store.category}
          subcategory={store.subcategory}
        />
        <ServiceBookingBar store={store} hasServices={categories.length > 0} />
      </main>
    </PhotoGalleryProvider>
  )
}
