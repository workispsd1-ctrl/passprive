import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getStoreBySlugOrId, getStoreReviews } from '@/lib/services/stores'
import { PhotoGalleryProvider, PhotoGrid } from '@/components/sections/dining/PhotoGalleryClient'
import { MenuGalleryProvider, MenuGalleryImageButton } from '@/components/sections/dining/MenuGalleryClient'
import { MerchantRewardsSection } from '@/components/shared/MerchantRewardsSection'
import { DetailSectionTabs, type DetailTab } from '@/components/shared/detail/DetailSectionTabs'
import { MerchantActions, WebsiteAction } from '@/components/shared/detail/MerchantActions'
import { DetailTitleBlock } from '@/components/shared/detail/DetailTitleBlock'
import { DetailSection } from '@/components/shared/detail/DetailSection'
import { DetailOffers, type OfferTicket } from '@/components/shared/detail/DetailOffers'
import { DetailReviews } from '@/components/shared/detail/DetailReviews'
import { DetailAbout, type Fact } from '@/components/shared/detail/DetailAbout'
import { DetailLocation } from '@/components/shared/detail/DetailLocation'
import { QuickInfoCard } from '@/components/shared/detail/DetailCtaBar'
import { DownloadAppCard } from '@/components/shared/DownloadAppCard'
import { HelpCard } from '@/components/shared/detail/HelpCard'
import { MobileTitleCard } from '@/components/shared/detail/MobileTitleCard'
import { UpsellBannerPager } from '@/components/shared/detail/UpsellBannerPager'
import { getDiscountCaps } from '@/lib/services/membershipCaps'
import type { StoreOffer } from '@/lib/types/stores'

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
/** Ticket stub text — the discount when there is one, else the badge / title. */
function offerTicket(o: StoreOffer): OfferTicket {
  const v = Number(o.discount_value)
  const type = String(o.offer_type ?? '').toLowerCase()
  const saving = Number.isFinite(v) && v > 0
    ? type.startsWith('percent') ? `${v}% OFF` : `MUR ${v.toLocaleString('en-US')} OFF`
    : null
  const headline = saving ?? o.badge_text ?? o.title ?? 'Offer'
  return {
    id: o.id,
    headline,
    title: o.title && o.title !== headline ? o.title : o.description ?? null,
    footnote: o.code ? `Use code ${o.code}` : saving && o.badge_text ? o.badge_text : null,
  }
}

/** "Updated 3 Oct" for the catalogue — an absolute date keeps the render pure. */
function updatedLabel(iso: string | null) {
  const t = iso ? Date.parse(iso) : NaN
  return Number.isFinite(t)
    ? `Updated ${new Date(t).toLocaleDateString('en-GB', { timeZone: 'Indian/Mauritius', day: 'numeric', month: 'short' })}`
    : undefined
}

/** Store detail — app parity: screens/StoreDetails.jsx. */
export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [data, caps] = await Promise.all([fetchStore(id), getDiscountCaps()])
  if (!data) notFound()

  const { store, gallery, hours, items, tags, offers } = data
  const reviews = await getStoreReviews(store.id)
  const reviewSummary = {
    avg: reviews.length ? reviews.reduce((sum, r) => sum + Number(r.rating ?? 0), 0) / reviews.length : 0,
    count: reviews.length,
  }

  const allPhotos = [store.cover_image, ...gallery.map(g => g.file_url)].filter(Boolean) as string[]
  const categories = [store.category, store.subcategory].filter(Boolean) as string[]
  const address = store.address_line1 ?? [store.location_name, store.city].filter(Boolean).join(', ')
  const tickets = offers.map(offerTicket)
  const tagValues = tags.map(t => t.tag_value)

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

  // app parity: StoreDetails tabs (Offers / Catalogue / About), plus Reviews and Location like the other detail screens
  const tabs = [
    { id: 'deals', label: 'Deals' },
    tickets.length > 0 && { id: 'offers', label: 'Offers' },
    items.length > 0 && { id: 'catalogue', label: 'Catalogue' },
    { id: 'reviews', label: 'Reviews' },
    hasAbout && { id: 'about', label: 'About' },
    !!address && { id: 'location', label: 'Location' },
  ].filter((t): t is DetailTab => !!t)

  // app parity: upsellOfferPct — the first percentage offer is what the tiers share
  const offerPct = Number(offers.find(o => String(o.offer_type ?? '').toLowerCase().startsWith('percent') && Number(o.discount_value) > 0)?.discount_value) || 0
  return (
    <PhotoGalleryProvider photos={allPhotos}>
      <main className='min-h-screen bg-white pb-16'>
        <nav aria-label='Breadcrumb' className='hidden items-center gap-1.5 px-6 pt-3 text-[12px] text-gray-400 md:flex'>
          <Link href='/' className='transition-colors hover:text-gray-600'>Home</Link>
          <span>/</span>
          <Link href='/stores' className='transition-colors hover:text-gray-600'>Shopping</Link>
          <span>/</span>
          <span className='text-gray-600'>{store.name}</span>
        </nav>
        <PhotoGrid photos={allPhotos} restaurantName={store.name} backHref='/stores' save={{ id: store.id, type: 'STORE' }} cover={store.cover_image} />

        <div className='relative z-10 mx-auto max-w-7xl rounded-t-[20px] bg-white px-4 md:rounded-none md:px-6'>

          <div className='md:grid md:grid-cols-[minmax(0,1fr)_22rem] md:items-start md:gap-12 md:pt-6'>
            <div className='flex min-w-0 flex-col md:block'>
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
                offerZone={tickets.length > 0}
              />
              <DetailTitleBlock
                className='hidden md:block'
                name={store.name}
                eyebrow={categories.join(' · ') || 'Store'}
                logo={store.logo_url}
                showLogo
                rating={reviewSummary}
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
                  >
                    {store.website && <WebsiteAction href={store.website} />}
                  </MerchantActions>
                }
              />


              <DetailSectionTabs tabs={tabs} title={store.name} cta={null} className='mt-6' orderClassName='max-md:order-2' />
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

              <DetailOffers tickets={tickets} subtitle={`Available at ${store.name}`} />

              {items.length > 0 && (
                <DetailSection id='catalogue' title='Catalogue' subtitle={updatedLabel(latestItemUpdate)}>
                  <MenuGalleryProvider images={catalogueImages}>
                    <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
                      {items.slice(0, 8).map((item, i) => (
                        <figure key={item.id} className='group'>
                          <MenuGalleryImageButton
                            src={item.image_url}
                            alt={item.title ?? ''}
                            index={itemGalleryIndices[i]}
                            className='aspect-square w-full rounded-2xl'
                            sizes='(min-width: 1024px) 200px, 45vw'
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

              <DetailReviews kind='store' entityId={store.id} entityName={store.name} reviews={reviews} summary={reviewSummary} />

              <DetailAbout
                title='About the brand'
                description={store.description}
                facts={facts}
                chips={tagValues}
                chipsTitle='Known for'
              />

              <DetailLocation name={store.name} address={address} lat={store.lat} lng={store.lng} phone={store.phone} hours={hours} />
              <HelpCard className='mt-10' />
              </div>
            </div>

            <aside className='sticky top-16 hidden flex-col gap-4 pt-2 md:flex'>
              <QuickInfoCard
                name={store.name}
                hours={hours}
                address={address}
                lat={store.lat}
                lng={store.lng}
                phone={store.phone}
                website={store.website}
              />
              <DownloadAppCard />
            </aside>
          </div>
        </div>
      </main>
    </PhotoGalleryProvider>
  )
}
