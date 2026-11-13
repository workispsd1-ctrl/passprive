'use client'

import { CARD_GRID } from '@/components/sections/dining/RestaurantDesktopSections'
import { MenuGalleryImageButton, MenuGalleryProvider } from '@/components/sections/dining/MenuGalleryClient'
import { AboutCard, AvailableOffers, HelpBar, Section, StampCard, Vibes } from '@/components/sections/wellness/detail/WellnessDesktopSections'
import { DealRevealSection } from '@/components/shared/deals/DealRevealSection'
import { DetailReviews, type DetailReview } from '@/components/shared/detail/DetailReviews'
import { ReceiptCashbackBanner } from '@/components/shared/receipts/ReceiptCashbackBanner'
import { TierPills, type PreviewTier } from '@/components/shared/TierPills'
import { useState } from 'react'
import type { MerchantCapabilityFields } from '@/lib/cashback'
import type { CatalogueItem, ServiceOffer } from '@/lib/types/stores'

/*
 * The shopping store page on desktop, drawn with the salon page's Figma
 * blocks ("Salon details – Desktop", 1920 frame, lengths in `--u`). The
 * catalogue takes the place of the salon's services row.
 */

/** Catalogue — 6 across, 20 apart; square photo radius 12, name 16/21 Bold, price 14/20. */
function Catalogue({ items }: { items: CatalogueItem[] }) {
  const shown = items.slice(0, 12)
  const images = items.map(i => i.image_url).filter((v): v is string => !!v)
  let idx = 0
  const indices = items.map(i => (i.image_url ? idx++ : -1))
  return (
    <MenuGalleryProvider images={images}>
      <div className='grid grid-cols-6 gap-[calc(20*var(--u))]'>
        {shown.map((item, i) => (
          <figure key={item.id} className='flex min-w-0 flex-col gap-[calc(10*var(--u))]'>
            <MenuGalleryImageButton
              src={item.image_url}
              alt={item.title ?? ''}
              index={indices[i]}
              className='aspect-square w-full rounded-[calc(12*var(--u))]'
              sizes='16vw'
            />
            {(item.title || item.price != null) && (
              <figcaption className='flex min-w-0 flex-col gap-[calc(2*var(--u))] px-[calc(2*var(--u))]'>
                {item.title && <p className='truncate text-[calc(16*var(--u))] leading-[calc(21*var(--u))] font-bold text-[#2c2d32]'>{item.title}</p>}
                {item.price != null && (
                  <p className='text-[calc(14*var(--u))] leading-[calc(20*var(--u))] font-medium text-[#717171]'>MUR {Number(item.price).toLocaleString('en-US')}</p>
                )}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </MenuGalleryProvider>
  )
}

export function StoreDesktopSections({
  storeId,
  name,
  merchant,
  inStoreOffers,
  bankOffers,
  stamp,
  items,
  catalogueSubtitle,
  gallery,
  photos,
  cover,
  area,
  highlights,
  worthIt,
  reviews,
  summary,
}: {
  storeId: string
  name: string
  merchant: MerchantCapabilityFields
  inStoreOffers: ServiceOffer[]
  bankOffers: ServiceOffer[]
  stamp: { visits: number; total: number; almostThere: boolean } | null
  items: CatalogueItem[]
  catalogueSubtitle?: string
  gallery: string[]
  photos: string[]
  cover: string | null
  area: string | null
  highlights: string
  worthIt: string
  reviews: DetailReview[]
  summary: { avg: number; count: number }
}) {
  const hasAbout = !!highlights || !!worthIt
  // app parity: StoreDetails previewTier — the plan the deals and cashback are shown for
  const [previewTier, setPreviewTier] = useState<PreviewTier | null>(null)
  return (
    <div className='hidden font-(family-name:--font-dm-sans) md:block'>
      {/* Rewards and offers — 28 under the tabs, bottoms aligned, 28 apart */}
      <div data-section='offers' className='mt-[calc(28*var(--u))] flex scroll-mt-[calc(170*var(--u))] items-end gap-[calc(28*var(--u))] empty:hidden'>
        {stamp && <StampCard href={`/visit-rewards/store/${storeId}`} image={cover} name={name} area={area} {...stamp} />}
        <AvailableOffers inStoreOffers={inStoreOffers} bankOffers={bankOffers} merchant={merchant} exclusiveLabel='Store exclusive' />
      </div>

      {/* the section hides until a deal or the receipt card loads */}
      <Section id='deals-cashback' title='Deals & cashback' className='[&:not(:has([data-offer-card]))]:hidden'>
        <TierPills value={previewTier} onChange={setPreviewTier} className='max-w-80' />
        <div className={CARD_GRID}>
          <DealRevealSection storeId={storeId} merchantName={name} variant='figma' previewTier={previewTier} />
          <ReceiptCashbackBanner merchant={{ ...merchant, id: storeId }} kind='store' variant='figma' previewTier={previewTier} />
        </div>
      </Section>

      {items.length > 0 && (
        <Section id='catalogue' title='Catalogue'>
          {catalogueSubtitle && (
            <p className='-mt-[calc(14*var(--u))] text-[calc(14*var(--u))] leading-[calc(20*var(--u))] font-medium text-[#9b969d]'>{catalogueSubtitle}</p>
          )}
          <Catalogue items={items} />
        </Section>
      )}

      {gallery.length > 0 && (
        <Section id='vibes' title='Vibes'>
          <Vibes gallery={gallery} photos={photos} cover={cover} />
        </Section>
      )}

      <Section id='about' title={hasAbout ? 'About the brand' : 'Help'}>
        {hasAbout && (
          <div className='grid grid-cols-4 gap-[calc(20*var(--u))]'>
            {highlights && <AboutCard icon='highlights.png' title='Known for' body={highlights} />}
            {worthIt && <AboutCard icon='worth-it.webp' title='What makes it worth it' body={worthIt} />}
          </div>
        )}
        <HelpBar />
      </Section>

      <div className='mt-[calc(40*var(--u))] [&_h2]:text-[length:calc(18*var(--u))]'>
        <DetailReviews kind='store' entityId={storeId} entityName={name} reviews={reviews} summary={summary} />
      </div>
    </div>
  )
}
