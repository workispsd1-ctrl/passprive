'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ChevronRight, Volume2, VolumeX } from 'lucide-react'
import { MenuGalleryProvider, useMenuGallery } from '@/components/sections/dining/MenuGalleryClient'
import { useGallery } from '@/components/sections/dining/PhotoGalleryClient'
import { OffersRow, Section } from '@/components/sections/dining/RestaurantDesktopSections'
import { DealRevealSection } from '@/components/shared/deals/DealRevealSection'
import type { OfferBody } from '@/components/shared/detail/OffersForToday'
import { ReceiptCashbackBanner } from '@/components/shared/receipts/ReceiptCashbackBanner'
import { TierPills, type PreviewTier } from '@/components/shared/TierPills'
import type { MerchantCapabilityFields } from '@/lib/cashback'
import { t, tMin, u } from '@/components/sections/dining/designUnit'
import { stampColor } from '@/lib/stamps'
import type { CatalogueItem } from '@/lib/types/stores'
import { cn, isVideoUrl } from '@/lib/utils'

/*
 * Figma "Shopping details" (1920 frame, css.txt) — the store-only blocks. The
 * rest of the page (photo, title card, Pay bill card, offers, reviews, the
 * sidebar) shares the restaurant page's components. Layout in `--u`, type in
 * `--t` (both 1 design px at 1920, proportional on other desktop widths).
 */

/**
 * "Offers for today" — the store exclusive, cashback and bank cards with the
 * Deal Reveal tickets and the receipt-upload cashback card after the cashback
 * card, under the plan pills (app parity: StoreDetails OffersSectionTitle →
 * DealRevealSection → ReceiptCashbackBanner → OffersForYouSection).
 */
export function StoreOffers({
  storeId,
  name,
  merchant,
  exclusiveOffers,
  bankOffers,
}: {
  storeId: string
  name: string
  merchant: MerchantCapabilityFields
  exclusiveOffers: OfferBody[]
  bankOffers: OfferBody[]
}) {
  // app parity: StoreDetails previewTier — the plan the deals and cashback are shown for
  const [previewTier, setPreviewTier] = useState<PreviewTier | null>(null)
  return (
    <OffersRow
      restaurantOffers={exclusiveOffers}
      bankOffers={bankOffers}
      merchant={merchant}
      exclusiveLabel='Store exclusive'
      header={<TierPills value={previewTier} onChange={setPreviewTier} className='max-w-80' />}
      afterCashback={
        <>
          <DealRevealSection storeId={storeId} merchantName={name} variant='figma' previewTier={previewTier} />
          <ReceiptCashbackBanner merchant={{ ...merchant, id: storeId }} kind='store' variant='art' previewTier={previewTier} />
        </>
      }
    />
  )
}

/** css.txt "Visit rewards": 390 wide, padding 13.07, radius 17.43, the 122×104.58 photo beside the stamps. */
export function StoreStampCard({ href, image, name, area, visits, total, almostThere }: { href: string; image: string | null; name: string; area: string | null; visits: number; total: number; almostThere: boolean }) {
  return (
    <Link
      href={href}
      className='flex items-center border-solid border-[#f1f5f9] bg-white font-(family-name:--font-dm-sans) shadow-[0_calc(4.36*var(--t))_calc(13.07*var(--t))_rgba(0,0,0,0.1)] hover:bg-gray-50'
      style={{ padding: tMin(13.07, 10), gap: tMin(17.43, 10), borderRadius: t(17.43), borderWidth: 1.09 }}
    >
      <span className='relative shrink-0 overflow-hidden bg-gray-100' style={{ width: tMin(122, 80), height: tMin(104.58, 70), borderRadius: t(13.07) }}>
        {image && <Image src={image} alt='' fill sizes='122px' className='object-cover' />}
      </span>
      <span className='flex min-w-0 flex-1 flex-col' style={{ gap: tMin(8.72, 6) }}>
        <span className='flex items-center justify-between' style={{ gap: t(6) }}>
          <span className='flex min-w-0 flex-col' style={{ gap: t(2.18) }}>
            <span className='truncate font-bold text-[#0f172a]' style={{ fontSize: tMin(16.34, 14), lineHeight: tMin(21, 18) }}>{name}</span>
            {area && <span className='truncate text-[#64748b]' style={{ fontSize: tMin(13.07, 11), lineHeight: tMin(17, 14) }}>{area}</span>}
          </span>
          <ChevronRight className='shrink-0 text-[#64748b]' strokeWidth={1.6} style={{ width: tMin(21.79, 16), height: tMin(21.79, 16) }} />
        </span>
        {/* css.txt "stamp-row": 17.43 stamps, 3.37 apart */}
        <span className='flex flex-wrap' style={{ gap: tMin(3.37, 2) }}>
          {Array.from({ length: total }, (_, i) =>
            i < visits ? (
              <span key={i} className='flex items-center justify-center rounded-full text-white' style={{ width: tMin(17.43, 13), height: tMin(17.43, 13), backgroundColor: stampColor(i, total) }}>
                <Check strokeWidth={3.4} style={{ width: tMin(10, 8), height: tMin(10, 8) }} />
              </span>
            ) : (
              <span key={i} className='rounded-full border-solid border-[#e2e8f0] bg-white' style={{ width: tMin(17.43, 13), height: tMin(17.43, 13), borderWidth: 0.84 }} />
            ),
          )}
        </span>
        <span className='flex flex-wrap items-center' style={{ gap: tMin(6.54, 5) }}>
          <Image src='/assets/stamps/repeat-reward.webp' alt='' width={88} height={102} className='object-contain' style={{ width: tMin(18.52, 13), height: tMin(25.81, 18) }} />
          <span className='font-semibold text-[#64748b]' style={{ fontSize: tMin(14.16, 12), lineHeight: tMin(18, 15) }}>{visits} / {total} visits</span>
          {almostThere && (
            <span className='rounded-full bg-[#f2620f] font-bold text-white' style={{ padding: `${t(2.18)} ${tMin(8.72, 6)}`, fontSize: tMin(11.98, 10), lineHeight: tMin(16, 13) }}>Almost there!</span>
          )}
        </span>
      </span>
    </Link>
  )
}

/** Block heading — css.txt "Catalouge" / "Vibes": 24/32 Bold #383838, the tiles 19 below. */
function BlockTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className='font-bold text-[#383838]' style={{ fontSize: tMin(24, 18), lineHeight: tMin(32, 24), marginBottom: tMin(19, 12) }}>
      {children}
    </h2>
  )
}

const TILE = 'group relative min-w-0 overflow-hidden bg-[#e1e1e1]'

/** One catalogue tile; the last can count what's left. */
function CollectionTile({ item, index, more = 0, className, style }: { item?: CatalogueItem; index: number; more?: number; className?: string; style?: React.CSSProperties }) {
  const { openAt } = useMenuGallery()
  if (!item?.image_url) return <span aria-hidden='true' className={cn(TILE, className)} style={style} />
  return (
    <button type='button' onClick={() => openAt(index)} aria-label={more > 0 ? `View ${more} more` : item.title ?? 'View item'} className={cn(TILE, className)} style={style}>
      <Image src={item.image_url} alt={item.title ?? ''} fill sizes='(min-width: 1920px) 306px, 20vw' className='object-cover transition-transform duration-500 group-hover:scale-[1.04]' />
      {more > 0 && (
        // css.txt "Frame 2147223770": #D3D0D0 over the tile, "+10" 20.79/28 SemiBold
        <span className='absolute inset-0 flex items-center justify-center bg-[#d3d0d0]/85 font-semibold text-[#2c2d32]' style={{ fontSize: tMin(20.79, 15), lineHeight: tMin(28, 20), letterSpacing: t(0.87) }}>
          +{more}
        </span>
      )}
    </button>
  )
}

/**
 * A catalogue collection — css.txt "Women collection": a 305.95×308 photo
 * beside two 149.89×150.92 ones, 6.16 apart (radius 12.32), the third counting
 * what's left; the name under them in Libre Baskerville italic 21.56/28.
 */
function Collection({ title, items }: { title: string; items: CatalogueItem[] }) {
  const images = items.map(i => i.image_url).filter((v): v is string => !!v)
  const more = items.length - 3
  const radius = { borderRadius: t(12.32) }
  return (
    <MenuGalleryProvider images={images}>
      <figure className='flex w-[calc(462*var(--u))] shrink-0 snap-start flex-col max-md:w-[72vw]' style={{ gap: tMin(6.16, 6) }}>
        <div className='grid aspect-462/308 grid-cols-[305.95fr_149.89fr] grid-rows-2' style={{ gap: tMin(6.16, 4) }}>
          <CollectionTile item={items[0]} index={0} className='row-span-2' style={radius} />
          <CollectionTile item={items[1]} index={1} style={radius} />
          <CollectionTile item={items[2]} index={2} more={more} style={radius} />
        </div>
        <figcaption
          className='truncate font-(family-name:--font-libre-baskerville) font-semibold text-[#33363f] italic'
          style={{ fontSize: tMin(21.56, 16), lineHeight: tMin(28, 22), letterSpacing: t(-1.3) }}
        >
          {title}
        </figcaption>
      </figure>
    </MenuGalleryProvider>
  )
}

/** Vibe tile — css.txt "Vibe 1": 268×335, radius 24.9, a 1.31 white rim, 0 5.24 26.2 shadow; videos get the glass mute button. */
function VibeTile({ src, index, more }: { src: string; index: number; more: number }) {
  const { openAt } = useGallery()
  const [muted, setMuted] = useState(true)
  const frame = 'relative aspect-268/335 min-w-0 overflow-hidden border-solid border-white bg-[#e1e1e1] drop-shadow-[0_calc(5.24*var(--t))_calc(26.2*var(--t))_rgba(0,0,0,0.15)]'
  const style = { borderRadius: t(24.9), borderWidth: 1.31 }
  if (isVideoUrl(src)) {
    return (
      <div className={frame} style={style}>
        <video src={src} autoPlay loop muted={muted} playsInline className='absolute inset-0 size-full object-cover' />
        <button
          type='button'
          onClick={() => setMuted(v => !v)}
          aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
          className='absolute flex items-center justify-center rounded-full bg-[rgba(217,217,217,0.1)] text-white backdrop-blur-md'
          style={{ top: t(19.34), right: t(17.4), width: tMin(45.3, 32), height: tMin(45.3, 32) }}
        >
          {muted ? <VolumeX style={{ width: tMin(20, 15), height: tMin(20, 15) }} strokeWidth={1.4} /> : <Volume2 style={{ width: tMin(20, 15), height: tMin(20, 15) }} strokeWidth={1.4} />}
        </button>
      </div>
    )
  }
  return (
    <button type='button' onClick={() => openAt(index)} aria-label={more > 0 ? `View all photos` : `View photo`} className={cn('group', frame)} style={style}>
      <Image src={src} alt='' fill sizes='(min-width: 1920px) 268px, 30vw' className='object-cover transition-transform duration-500 group-hover:scale-[1.05]' />
      {more > 0 && (
        <span className='absolute inset-0 flex items-center justify-center bg-black/35 font-semibold text-white' style={{ fontSize: tMin(20.79, 15) }}>+{more}</span>
      )}
    </button>
  )
}

/**
 * Catalogue and vibes (css.txt "Catalogue and vibes": 950 + 66 + 560 across
 * the 1576 frame), then About the brand. The catalogue hugs its collections
 * (up to 950) and Vibes keeps its 560 width, so one collection leaves no gap
 * and a store without a catalogue doesn't blow the vibe tiles up. The photo above already shows the
 * cover, so Vibes starts after it.
 */
export function StoreShowcase({
  name,
  collections,
  photos,
  cover,
  highlights,
  description,
}: {
  name: string
  collections: { id: string; title: string; items: CatalogueItem[] }[]
  /** the gallery the page's PhotoGalleryProvider pages through */
  photos: string[]
  cover: string | null
  highlights: string
  description: string | null
}) {
  const vibes = photos.filter(p => p !== cover)
  const shown = vibes.slice(0, 2)
  const about = [
    highlights && { title: 'Store highlights', body: highlights },
    description && { title: `About ${name}`, body: description },
  ].filter((a): a is { title: string; body: string } => !!a)

  return (
    <div className='font-(family-name:--font-dm-sans)'>
      {(collections.length > 0 || shown.length > 0) && (
        <div
          className='flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-x-[calc(66*var(--u))]'
          style={{ marginTop: tMin(68, 32) }}
        >
          {collections.length > 0 && (
            <section data-section='catalogue' className='min-w-0 lg:max-w-[calc(950*var(--u))]' style={{ scrollMarginTop: t(170) }}>
              <BlockTitle>Catalogue</BlockTitle>
              {/* two collections fill the 950 column; more scroll sideways */}
              <div className='scrollbar-hide flex snap-x overflow-x-auto' style={{ gap: tMin(24, 12) }}>
                {collections.map(c => <Collection key={c.id} title={c.title} items={c.items} />)}
              </div>
            </section>
          )}
          {shown.length > 0 && (
            <section data-section='vibes' className='min-w-0 lg:w-[calc(560*var(--u))] lg:shrink-0' style={{ scrollMarginTop: t(170) }}>
              <BlockTitle>Vibes</BlockTitle>
              <div className='grid grid-cols-2' style={{ gap: tMin(24, 12) }}>
                {shown.map((src, i) => (
                  <VibeTile key={src} src={src} index={photos.indexOf(src)} more={i === shown.length - 1 ? vibes.length - shown.length : 0} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {about.length > 0 && (
        <Section id='about' title='About the brand' top={68} gap={16}>
          {/* side by side like dining's "About the Restaurant"; stacked on phones */}
          <div className='grid grid-cols-1 lg:grid-cols-2' style={{ gap: tMin(24, 12) }}>
            {about.map(a => <AboutCard key={a.title} title={a.title} body={a.body} />)}
          </div>
        </Section>
      )}
    </div>
  )
}

/** css.txt "Review-1" (About): white, radius 21.33, padding 24, 0 5.33 31.73 rgba(0,0,0,.1); title 16/21 ExtraBold, body 16/23. */
function AboutCard({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false)
  return (
    <article
      className='flex min-w-0 flex-col bg-white shadow-[0_calc(5.33*var(--t))_calc(31.73*var(--t))_rgba(0,0,0,0.1)]'
      style={{ minHeight: u(132), padding: tMin(24, 14), borderRadius: t(21.33), gap: tMin(12, 8) }}
    >
      <h3 className='font-extrabold text-[#303030]' style={{ fontSize: tMin(16, 14), lineHeight: tMin(21, 18) }}>{title}</h3>
      <p className='text-[#454545]' style={{ fontSize: tMin(16, 13), lineHeight: 1.4375 }}>
        <span className={cn(!open && 'line-clamp-3')}>{body}</span>
        {body.length > 200 && (
          <button type='button' onClick={() => setOpen(v => !v)} className='mt-1 block text-[#252424] underline'>
            {open ? 'Show less' : 'Read more'}
          </button>
        )}
      </p>
    </article>
  )
}
