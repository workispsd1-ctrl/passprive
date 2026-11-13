import { getStampGate } from '@/lib/services/platformFlags'
import { cache } from 'react'
import { HuntSpot } from '@/components/hunt/HuntSpot'
import { getCardChips } from '@/lib/cardChips'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getActiveStores, getBankOffers, getStoreBySlugOrId, getStoreReviews } from '@/lib/services/stores'
import { getStoreStampCard } from '@/lib/services/visitRewards'
import { PhotoGalleryProvider } from '@/components/sections/dining/PhotoGalleryClient'
import { RestaurantCtaCard, RestaurantDesktopHero, RestaurantTitleCard } from '@/components/sections/dining/RestaurantDesktopHero'
import { ReviewsSection } from '@/components/sections/dining/RestaurantDesktopSections'
import { UpsellBannerPager } from '@/components/shared/detail/UpsellBannerPager'
import { HelpSideCard } from '@/components/sections/dining/RestaurantSidebar'
import { t, tMin } from '@/components/sections/dining/designUnit'
import { DetailSectionTabs, type DetailTab } from '@/components/shared/detail/DetailSectionTabs'
import { canPayBill, isCashbackEnabled } from '@/lib/cashback'
import { ServiceStoreColumns } from '@/components/sections/wellness/detail/ServiceStoreRails'
import { bankBody, exclusiveBody } from '@/lib/offerBodies'
import { StoreOffers, StoreShowcase, StoreStampCard } from '@/components/sections/stores/detail/StoreDesktopSections'
import { getDiscountCaps } from '@/lib/services/membershipCaps'
import { hasStampSheet, isPickupPremium, isSubscribed } from '@/lib/storeBadges'
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

const RAIL_TITLES = { explore: 'Explore more stores', nearby: 'Nearby stores' }

/**
 * Store detail — app parity: screens/StoreDetails.jsx. Desktop is Figma
 * "Shopping details" (1920 frame, css.txt): exact at 1920 and proportional on
 * every other desktop width (layout in --u, type in --t). It shares the
 * restaurant page's frame — photo, title card, Pay bill card, offers, reviews
 * and sidebar — with the store's catalogue collections, vibes and About the
 * brand across the full width. Phones get the same website layout, stacked.
 */
export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [data, caps, allStores, bankOffers] = await Promise.all([fetchStore(id), getDiscountCaps(), getActiveStores(), getBankOffers()])
  if (!data) notFound()
  // wellness stores have one screen: /wellness/[id] (app parity: storeDetailsRouting)
  if (isWellnessStore(data.store)) permanentRedirect(storeHref(data.store))

  const { store, gallery, hours, collections, tags, offers } = data
  const [reviews, stamp, stampGate] = await Promise.all([getStoreReviews(store.id), getStoreStampCard(store.id), getStampGate()])
  const reviewSummary = {
    avg: reviews.length ? reviews.reduce((sum, r) => sum + Number(r.rating ?? 0), 0) / reviews.length : 0,
    count: reviews.length,
  }

  const allPhotos = [store.cover_image, ...gallery.map(g => g.file_url)].filter(Boolean) as string[]
  const address = store.address_line1 ?? [store.location_name, store.city].filter(Boolean).join(', ')
  // app parity: MerchantInfoCard.jsx — getCardChips(entity), with the review summary as its rating
  const chips = getCardChips({ ...store, store_type: store.store_type ?? 'PRODUCT', rating: reviewSummary.avg, rating_count: reviewSummary.count, store_offers: offers })
  const exclusiveOffers = offers.map(toServiceOffer).map(o => ({ id: o.id, ...exclusiveBody(o) }))
  const bankCards = bankOffers.map(o => ({ id: o.id, ...bankBody(o) }))
  const tagValues = tags.map(t => t.tag_value)
  // app parity: StoreDetails `matchesCurrentStoreType` — the rails only show shopping stores
  const shoppingStores = allStores.filter(s => !isWellnessStore(s))
  const vibes = allPhotos.filter(p => p !== store.cover_image)
  const hasAbout = !!store.description || tagValues.length > 0

  // Figma tab row: Offers, Reviews, Catalogue, About — each drops out on its own when its section isn't on the page
  const tabs = [
    { id: 'offers', label: 'Offers' },
    reviews.length > 0 && { id: 'reviews', label: 'Reviews' },
    collections.length > 0 && { id: 'catalogue', label: 'Catalogue' },
    collections.length === 0 && vibes.length > 0 && { id: 'vibes', label: 'Vibes' },
    hasAbout && { id: 'about', label: 'About' },
  ].filter((t): t is DetailTab => !!t)

  // app parity: upsellOfferPct — the first percentage offer is what the tiers share
  const offerPct = Number(offers.find(o => String(o.offer_type ?? '').toLowerCase().startsWith('percent') && Number(o.discount_value) > 0)?.discount_value) || 0
  // app parity: StoreDetails "Pay bill" (Paybill with paymentSource 'store')
  const payHref = canPayBill(store) ? `/pay-bill?store_id=${store.id}` : null
  const payCta = payHref ? { label: 'Pay bill', href: payHref } : null
  const COLUMNS = 'flex flex-col lg:grid lg:grid-cols-[minmax(0,1128fr)_minmax(270px,390fr)] lg:gap-x-[calc(58*var(--u))]'

  return (
    <PhotoGalleryProvider photos={allPhotos}>
      {/* desktop breaks out of the site's 1280px column; phones use the restaurant page's phone units */}
      <main className='relative min-h-screen bg-white pb-10 [--t:0.62px] [--u:0.5px] md:mx-[calc(50%-50vw)] md:-mt-9.5 md:w-screen md:pb-0 md:[--t:var(--u)] md:[--u:calc(100vw/1920)]'>
        <HuntSpot slot='merchant-page' />

        <div className='relative z-10 mx-auto flex max-w-7xl flex-col px-4 md:max-w-none md:px-[calc(172*var(--u))]'>
          {/* css.txt "Privé benefits · Desktop 1921": 1576×480, radius 18, pager dots */}
          <RestaurantDesktopHero id={store.id} name={store.name} cover={store.cover_image} photos={allPhotos} saveType='STORE' backHref='/stores' radius={18} />

          {/* the title card (1128×192) beside the Pay bill card (390×120), 24 under the photo; no Pay bill card → the title card takes the full row */}
          <div className={payHref ? cn(COLUMNS, 'lg:items-start') : 'flex flex-col'}>
            <RestaurantTitleCard
              id={store.id}
              gauge={false}
              logo={store.logo_url}
              name={store.name}
              subtitle={[store.category, store.subcategory].filter(Boolean).join(' • ')}
              cuisines={[]}
              costForTwo={null}
              area={store.location_name}
              city={store.city}
              lat={store.lat ?? null}
              lng={store.lng ?? null}
              address={address}
              phone={store.phone}
              rating={reviewSummary}
              hours={hours}
              stampSheet={stampGate(store.id) && hasStampSheet(store)}
              trending={store.is_promoted === true}
              exclusive={isSubscribed(store)}
              exclusiveZone={isPickupPremium(store)}
              chips={chips}
            />
            {payHref && <RestaurantCtaCard merchant={store} bookHref={null} payHref={payHref} leftCoin={false} className='mt-4 lg:mt-[max(14px,calc(24*var(--t)))]' />}
          </div>

          <DetailSectionTabs tabs={tabs} title={store.name} cta={payCta} className='mt-6' variant='figma' />

          {/* the main column (offers, reviews) beside the rewards sidebar; phones put the sidebar between them */}
          <div className={cn(COLUMNS, 'lg:grid-rows-[auto_1fr]')}>
            <div className='min-w-0 lg:col-start-1 lg:row-start-1'>
              <StoreOffers storeId={store.id} name={store.name} merchant={store} exclusiveOffers={exclusiveOffers} bankOffers={bankCards} />
            </div>
            {/* css.txt "Frame 2147225106": level with the offer cards (24 + 24 + 20 under the tabs) */}
            <aside className='mt-6 flex flex-col font-(family-name:--font-dm-sans) empty:hidden lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-[calc(68*var(--t))] lg:self-start' style={{ gap: tMin(24, 14) }}>
              {/* css.txt "Earn 6x cashback": the tier upsell banners (the deals and receipt cashback sit in Offers for today) */}
              <UpsellBannerPager eligible={isCashbackEnabled(store)} merchantType={store.merchant_type} merchantId={store.id} kind='store' offerPct={offerPct} caps={caps} variant='figma' />
              {stamp && <StoreStampCard href={`/visit-rewards/store/${store.id}`} image={store.cover_image} name={store.name} area={store.location_name ?? store.city} {...stamp} />}
              <div style={{ marginTop: t(27) }}>
                <HelpSideCard />
              </div>
            </aside>
            {/* no approved reviews yet: the section (and its tab) stays off the page */}
            {reviews.length > 0 && (
              <div className='min-w-0 lg:col-start-1 lg:row-start-2'>
                <ReviewsSection kind='store' entityId={store.id} name={store.name} reviews={reviews} summary={reviewSummary} top={56} />
              </div>
            )}
          </div>

          <StoreShowcase
            name={store.name}
            collections={collections}
            photos={allPhotos}
            cover={store.cover_image}
            highlights={tagValues.join(', ')}
            description={store.description}
          />

          <ServiceStoreColumns row stores={shoppingStores} currentId={store.id} category={store.category} subcategory={store.subcategory} titles={RAIL_TITLES} />
        </div>
      </main>
    </PhotoGalleryProvider>
  )
}
