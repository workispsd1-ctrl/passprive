import { cache } from 'react'
import { HuntSpot } from '@/components/hunt/HuntSpot'
import { getCardChips } from '@/lib/cardChips'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getActiveStores, getBankOffers, getStoreBySlugOrId, getStoreReviews } from '@/lib/services/stores'
import { getStoreStampCard } from '@/lib/services/visitRewards'
import { SALON_TYPE, SALON_UNIT } from '@/components/sections/dining/designUnit'
import { PhotoGalleryProvider, PhotoGrid } from '@/components/sections/dining/PhotoGalleryClient'
import { MenuGalleryProvider, MenuGalleryImageButton } from '@/components/sections/dining/MenuGalleryClient'
import { MerchantRewardsSection } from '@/components/shared/MerchantRewardsSection'
import { DetailSectionTabs, type DetailTab } from '@/components/shared/detail/DetailSectionTabs'
import { DetailSection } from '@/components/shared/detail/DetailSection'
import { DetailReviews } from '@/components/shared/detail/DetailReviews'
import { DetailAbout, type Fact } from '@/components/shared/detail/DetailAbout'
import { DetailLocation } from '@/components/shared/detail/DetailLocation'
import { CtaMobileBar } from '@/components/shared/detail/DetailCtaBar'
import { canPayBill, showsCashbackBadge } from '@/lib/cashback'
import { HelpCard } from '@/components/shared/detail/HelpCard'
import { MobileTitleCard } from '@/components/shared/detail/MobileTitleCard'
import { UpsellBannerPager } from '@/components/shared/detail/UpsellBannerPager'
import { ServiceOffersSection } from '@/components/sections/wellness/detail/ServiceOffersSection'
import { ServiceStoreColumns, ServiceStoreRails } from '@/components/sections/wellness/detail/ServiceStoreRails'
import { WellnessBackLink, WellnessDesktopHero } from '@/components/sections/wellness/detail/WellnessDesktopHero'
import { StoreDesktopSections } from '@/components/sections/stores/detail/StoreDesktopSections'
import { getDiscountCaps } from '@/lib/services/membershipCaps'
import { isPickupPremium, isSubscribed } from '@/lib/storeBadges'
import { isWellnessStore, storeHref } from '@/lib/storeType'
import { cn } from '@/lib/utils'
import type { ServiceOffer, StoreOffer } from '@/lib/types/stores'

const fetchStore = cache((id: string) => getStoreBySlugOrId(id))

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const data = await fetchStore(id)
  if (!data) return {}

  const { store } = data
  const title = store.name
  const description = store.description
    ?? [store.category, store.subcategory].filter(Boolean).join(' · ')
    ?? `Explore ${store.name} on PassPrivé`
  const city = store.city ?? store.location_name

  return {
    title,
    description: `${description}${city ? ` — ${city}` : ''}. Discover exclusive member offers at ${store.name} on PassPrivé.`,
    openGraph: {
      title: `${store.name} | PassPrivé`,
      description,
      url: `/stores/${store.slug ?? id}`,
      images: store.cover_image ? [{ url: store.cover_image, alt: store.name }] : [],
    },
    alternates: {
      canonical: `/stores/${store.slug ?? id}`,
    },
  }
}
/** A store offer in the salon page's shape — app parity: StoreDetails.jsx `storeExclusiveItems`. */
function toServiceOffer(o: StoreOffer): ServiceOffer {
  const v = Number(o.discount_value)
  return {
    id: o.id,
    title: o.title || o.badge_text || 'Store offer',
    description: o.description ?? null,
    discount_type: String(o.offer_type ?? '').toLowerCase().startsWith('percent') ? 'PERCENT' : 'FLAT',
    discount_value: Number.isFinite(v) && v > 0 ? v : null,
  }
}

/** "Updated 3 Oct" for the catalogue — an absolute date keeps the render pure. */
function updatedLabel(iso: string | null) {
  const t = iso ? Date.parse(iso) : NaN
  return Number.isFinite(t)
    ? `Updated ${new Date(t).toLocaleDateString('en-GB', { timeZone: 'Indian/Mauritius', day: 'numeric', month: 'short' })}`
    : undefined
}

const RAIL_TITLES = { explore: 'Explore more stores', nearby: 'Nearby stores' }

/** Store detail — app parity: screens/StoreDetails.jsx, laid out like the salon page. */
export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [data, caps, allStores, bankOffers] = await Promise.all([fetchStore(id), getDiscountCaps(), getActiveStores(), getBankOffers()])
  if (!data) notFound()
  // wellness stores have one screen: /wellness/[id] (app parity: storeDetailsRouting)
  if (isWellnessStore(data.store)) permanentRedirect(storeHref(data.store))

  const { store, gallery, hours, items, tags, offers } = data
  const [reviews, stamp] = await Promise.all([getStoreReviews(store.id), getStoreStampCard(store.id)])
  const reviewSummary = {
    avg: reviews.length ? reviews.reduce((sum, r) => sum + Number(r.rating ?? 0), 0) / reviews.length : 0,
    count: reviews.length,
  }

  const allPhotos = [store.cover_image, ...gallery.map(g => g.file_url)].filter(Boolean) as string[]
  const categories = [store.category, store.subcategory].filter(Boolean) as string[]
  const address = store.address_line1 ?? [store.location_name, store.city].filter(Boolean).join(', ')
  // app parity: MerchantInfoCard.jsx — getCardChips(entity), with the review summary as its rating
  const chips = getCardChips({ ...store, store_type: store.store_type ?? 'PRODUCT', rating: reviewSummary.avg, rating_count: reviewSummary.count, store_offers: offers })
  const inStoreOffers = offers.map(toServiceOffer)
  const tagValues = tags.map(t => t.tag_value)
  // app parity: StoreDetails `matchesCurrentStoreType` — the rails only show shopping stores
  const shoppingStores = allStores.filter(s => !isWellnessStore(s))

  const latestItemUpdate = items.reduce<string | null>((latest, item) => {
    if (!item.updated_at) return latest
    return !latest || item.updated_at > latest ? item.updated_at : latest
  }, null)
  const catalogueImages = items.map(i => i.image_url).filter(Boolean) as string[]
  const itemGalleryIndices = (() => {
    let idx = 0
    return items.map(item => (item.image_url ? idx++ : -1))
  })()

  const facts: Fact[] = []
  if (categories.length) facts.push({ icon: 'category', label: 'Category', value: categories.join(' · ') })
  if (store.location_name || store.city) facts.push({ icon: 'tag', label: 'Area', value: [store.location_name, store.city].filter(Boolean).join(', ') })
  const hasAbout = !!store.description || tagValues.length > 0

  // app parity: the Offers tab only shows when the offers block has content.
  // Tabs drop out on their own when their section isn't showing at this screen size.
  const hasOffers = inStoreOffers.length > 0 || bankOffers.length > 0 || showsCashbackBadge(store) || !!stamp
  const tabs = [
    { id: 'deals', label: 'Deals' },
    hasOffers && { id: 'offers', label: 'Offers' },
    items.length > 0 && { id: 'catalogue', label: 'Catalogue' },
    gallery.length > 0 && { id: 'vibes', label: 'Vibes' },
    hasAbout && { id: 'about', label: 'About' },
    { id: 'reviews', label: 'Reviews' },
    !!address && { id: 'location', label: 'Location' },
  ].filter((t): t is DetailTab => !!t)

  // app parity: upsellOfferPct — the first percentage offer is what the tiers share
  const offerPct = Number(offers.find(o => String(o.offer_type ?? '').toLowerCase().startsWith('percent') && Number(o.discount_value) > 0)?.discount_value) || 0
  const payCta = canPayBill(store) ? { label: 'Pay bill', href: `/pay-bill?store_id=${store.id}` } : null

  return (
    <PhotoGalleryProvider photos={allPhotos}>
      {/* desktop breaks out of the site's 1280px column and scales with the screen */}
      <main
        className={cn('relative min-h-screen bg-white pb-16 md:mx-[calc(50%-50vw)] md:-mt-9.5 md:w-screen md:pb-0', SALON_TYPE)}
        style={{ ['--u' as string]: SALON_UNIT }}
      >
        <HuntSpot slot='merchant-page' />
        {/* phones: the app's cover hero */}
        <PhotoGrid photos={allPhotos} restaurantName={store.name} backHref='/stores' save={{ id: store.id, type: 'STORE' }} cover={store.cover_image} desktop={false} />

        <div className='relative z-10 mx-auto flex max-w-7xl flex-col rounded-t-[20px] bg-white px-4 md:max-w-none md:rounded-none md:px-[calc(172*var(--u))]'>
          <WellnessBackLink backHref='/stores' />
          <WellnessDesktopHero
            store={store}
            address={address}
            hours={hours}
            bookHref={null}
            offerPct={offerPct}
            caps={caps}
            chips={chips}
            backHref='/stores'
            trending={store.is_promoted === true}
            website={store.website}
          />
          <MobileTitleCard
            name={store.name}
            subtitle={categories.join(', ')}
            logo={store.logo_url}
            showLogo
            area={store.location_name}
            city={store.city}
            lat={store.lat}
            lng={store.lng}
            address={address}
            phone={store.phone}
            rating={reviewSummary}
            hours={hours}
            trending={store.is_promoted === true}
            offerZone={isPickupPremium(store)}
            exclusive={isSubscribed(store)}
            chips={chips}
          />
          {/* app parity: StoreDetails "Pay bill" (Paybill with paymentSource 'store') */}
          <DetailSectionTabs tabs={tabs} title={store.name} cta={payCta} className='max-md:mt-6' orderClassName='max-md:order-2' variant='wellness' />
          <MerchantRewardsSection merchant={store} kind='store' name={store.name} className='max-md:order-1 md:hidden' />
          <UpsellBannerPager
            merchantType={store.merchant_type}
            merchantId={store.id}
            kind='store'
            offerPct={offerPct}
            caps={caps}
            className='mt-4 max-md:order-1 md:hidden'
          />
          <StoreDesktopSections
            storeId={store.id}
            name={store.name}
            merchant={store}
            inStoreOffers={inStoreOffers}
            bankOffers={bankOffers}
            stamp={stamp}
            items={items}
            catalogueSubtitle={updatedLabel(latestItemUpdate)}
            gallery={allPhotos}
            photos={allPhotos}
            cover={store.cover_image}
            area={store.location_name ?? store.city}
            highlights={tagValues.join(', ')}
            worthIt={store.description ?? ''}
            reviews={reviews}
            summary={reviewSummary}
          />
          <ServiceStoreColumns stores={shoppingStores} currentId={store.id} category={store.category} subcategory={store.subcategory} titles={RAIL_TITLES} />
          <div className='max-md:order-3 md:hidden max-md:[&>section:first-of-type]:mt-2 max-md:[&>section:first-of-type]:border-t-0 max-md:[&>section:first-of-type]:pt-5'>
            <ServiceOffersSection inStoreOffers={inStoreOffers} bankOffers={bankOffers} merchant={store} />

            {items.length > 0 && (
              <DetailSection id='catalogue' title='Catalogue' subtitle={updatedLabel(latestItemUpdate)}>
                <MenuGalleryProvider images={catalogueImages}>
                  <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                    {items.slice(0, 8).map((item, i) => (
                      <figure key={item.id} className='group'>
                        <MenuGalleryImageButton
                          src={item.image_url}
                          alt={item.title ?? ''}
                          index={itemGalleryIndices[i]}
                          className='aspect-square w-full rounded-2xl'
                          sizes='45vw'
                        />
                        {(item.title || item.price != null) && (
                          <figcaption className='mt-2 px-0.5'>
                            {item.title && <p className='truncate text-[13px] font-semibold text-gray-900'>{item.title}</p>}
                            {item.price != null && (
                              <p className='text-[12.5px] text-gray-500'>MUR {Number(item.price).toLocaleString('en-US')}</p>
                            )}
                          </figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                </MenuGalleryProvider>
              </DetailSection>
            )}

            <DetailAbout
              title='About the brand'
              description={store.description}
              facts={facts}
              chips={tagValues}
              chipsTitle='Known for'
            />
            <DetailReviews kind='store' entityId={store.id} entityName={store.name} reviews={reviews} summary={reviewSummary} />
            <DetailLocation name={store.name} address={address} lat={store.lat} lng={store.lng} phone={store.phone} hours={hours} />
            <HelpCard className='mt-10' />
          </div>
        </div>

        <ServiceStoreRails
          stores={shoppingStores}
          currentId={store.id}
          category={store.category}
          subcategory={store.subcategory}
          titles={RAIL_TITLES}
          className='md:hidden'
        />
        {payCta && <CtaMobileBar actions={[payCta]} merchant={store} />}
      </main>
    </PhotoGalleryProvider>
  )
}
