import { cache } from 'react'
import { getCardChips } from '@/lib/cardChips'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getServiceStoreBySlugOrId, getWellnessStores } from '@/lib/services/stores'
import { getStoreStampCard } from '@/lib/services/visitRewards'
import { SALON_TYPE, SALON_UNIT } from '@/components/sections/dining/designUnit'
import { isPickupPremium, isSubscribed } from '@/lib/storeBadges'
import { PhotoGalleryProvider, PhotoGrid } from '@/components/sections/dining/PhotoGalleryClient'
import { DetailSectionTabs } from '@/components/shared/detail/DetailSectionTabs'
import { ServiceOffersSection } from '@/components/sections/wellness/detail/ServiceOffersSection'
import { ServiceMenuSection } from '@/components/sections/wellness/detail/ServiceMenuSection'
import { ServiceBookingBar } from '@/components/sections/wellness/detail/ServiceBookingCard'
import { ServiceStoreColumns, ServiceStoreRails } from '@/components/sections/wellness/detail/ServiceStoreRails'
import { WellnessBackLink, WellnessDesktopHero } from '@/components/sections/wellness/detail/WellnessDesktopHero'
import { WellnessDesktopSections } from '@/components/sections/wellness/detail/WellnessDesktopSections'
import { canBook, canPayBill, showsCashbackBadge } from '@/lib/cashback'
import { cn, isVideoUrl } from '@/lib/utils'
import { MerchantRewardsSection } from '@/components/shared/MerchantRewardsSection'
import { DetailReviews } from '@/components/shared/detail/DetailReviews'
import { DetailAbout } from '@/components/shared/detail/DetailAbout'
import { DetailLocation } from '@/components/shared/detail/DetailLocation'
import { HelpCard } from '@/components/shared/detail/HelpCard'
import { RecordWellnessView } from '@/components/sections/wellness/ContinueWhereLeftOff'
import { MobileTitleCard } from '@/components/shared/detail/MobileTitleCard'
import { UpsellBannerPager } from '@/components/shared/detail/UpsellBannerPager'
import { getDiscountCaps } from '@/lib/services/membershipCaps'
import { isWellnessStore, storeHref } from '@/lib/storeType'

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
  // shopping stores have one screen: /stores/[id] (app parity: storeDetailsRouting)
  if (!isWellnessStore(data.store)) permanentRedirect(storeHref(data.store))

  const { store, gallery, hours, categories, inStoreOffers, bankOffers, reviews } = data
  const stamp = await getStoreStampCard(store.id)
  const photos = gallery.filter(g => !isVideoUrl(g))

  const summary = {
    avg: reviews.length ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length : 0,
    count: reviews.length,
  }

  // app parity: the Offers tab only shows when the offers block has content.
  // Tabs drop out on their own when their section isn't showing at this screen size.
  const hasOffers = inStoreOffers.length > 0 || bankOffers.length > 0 || showsCashbackBadge(store) || !!stamp
  const tabs = [
    { id: 'deals', label: 'Deals' },
    hasOffers && { id: 'offers', label: 'Offers' },
    categories.length > 0 && { id: 'services', label: 'Services' },
    gallery.length > 0 && { id: 'vibes', label: 'Vibes' },
    (!!store.description || store.top_items.length > 0) && { id: 'about', label: 'About' },
    { id: 'reviews', label: 'Reviews' },
    !!(store.address_line1 ?? store.location_name) && { id: 'location', label: 'Location' },
  ].filter((t): t is { id: string; label: string } => !!t)

  const address = store.address_line1 ?? [store.location_name, store.city].filter(Boolean).join(', ')
  const categoriesLine = [store.category, store.subcategory].filter(Boolean).join(' · ')
  const bookHref = canBook(store) ? `/wellness/${store.slug ?? store.id}/book` : null
  const canBookService = !!bookHref && categories.length > 0
  const hasCta = canBookService || canPayBill(store)

  // app parity: upsellOfferPct — the first percentage offer is what the tiers share
  // app parity: MerchantInfoCard.jsx — getCardChips(entity), with the review summary as its rating
  const chips = getCardChips({ ...store, rating: summary.avg, rating_count: summary.count, store_offers: inStoreOffers })
  const offerPct = Number(inStoreOffers.find(o => o.discount_type === 'PERCENT' && Number(o.discount_value) > 0)?.discount_value) || 0
  return (
    <PhotoGalleryProvider photos={photos}>
      {/* desktop breaks out of the site's 1280px column and scales with the screen */}
      <main
        className={cn('min-h-screen bg-white md:mx-[calc(50%-50vw)] md:-mt-9.5 md:w-screen md:pb-0', SALON_TYPE, hasCta && 'pb-36')}
        style={{ ['--u' as string]: SALON_UNIT }}
      >
        <RecordWellnessView id={store.id} />
        {/* phones: the app's cover hero */}
        <PhotoGrid photos={photos} restaurantName={store.name} backHref='/wellness' save={{ id: store.id, type: 'STORE' }} cover={store.cover_image} desktop={false} />

        <div className='relative z-10 mx-auto flex max-w-7xl flex-col rounded-t-[20px] bg-white px-4 md:max-w-none md:rounded-none md:px-[calc(172*var(--u))]'>
          <WellnessBackLink />
          <WellnessDesktopHero
            store={store}
            address={address}
            hours={hours}
            bookHref={canBookService ? bookHref : null}
            offerPct={offerPct}
            caps={caps}
            chips={chips}
          />
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
            trending={store.is_advertised === true}
            offerZone={isPickupPremium(store)}
            exclusive={isSubscribed(store)}
            chips={chips}
          />
          <DetailSectionTabs tabs={tabs} title={store.name} cta={canBookService ? { label: 'Book a slot', href: bookHref } : null} className='max-md:mt-6' orderClassName='max-md:order-2' variant='wellness' />
          <MerchantRewardsSection merchant={store} kind='store' name={store.name} className='max-md:order-1 md:hidden' />
          <UpsellBannerPager
            merchantType={store.merchant_type}
            merchantId={store.id}
            kind='store'
            offerPct={offerPct}
            caps={caps}
            className='mt-4 max-md:order-1 md:hidden'
          />
          <WellnessDesktopSections
            storeId={store.id}
            name={store.name}
            merchant={store}
            inStoreOffers={inStoreOffers}
            bankOffers={bankOffers}
            stamp={stamp}
            categories={categories}
            bookHref={bookHref}
            gallery={gallery}
            photos={photos}
            cover={store.cover_image}
            area={store.location_name ?? store.city}
            highlights={store.top_items.join(', ')}
            worthIt={store.description ?? ''}
            reviews={reviews}
            summary={summary}
          />
          <ServiceStoreColumns stores={wellnessStores} currentId={store.id} category={store.category} subcategory={store.subcategory} />
          <div className='max-md:order-3 md:hidden max-md:[&>section:first-of-type]:mt-2 max-md:[&>section:first-of-type]:border-t-0 max-md:[&>section:first-of-type]:pt-5'>
            <ServiceOffersSection inStoreOffers={inStoreOffers} bankOffers={bankOffers} merchant={store} />
            <ServiceMenuSection categories={categories} />
            <DetailAbout
              title='About us'
              description={store.description}
              highlights={store.top_items.join(', ') || null}
            />
            <DetailReviews kind='store' entityId={store.id} entityName={store.name} reviews={reviews} summary={summary} />
            <DetailLocation name={store.name} address={address} lat={store.lat} lng={store.lng} phone={store.phone} hours={hours} />
            <HelpCard className='mt-10' />
          </div>
        </div>

        <ServiceStoreRails
          stores={wellnessStores}
          currentId={store.id}
          category={store.category}
          subcategory={store.subcategory}
          className='md:hidden'
        />
        <ServiceBookingBar store={store} hasServices={categories.length > 0} />
      </main>
    </PhotoGalleryProvider>
  )
}
