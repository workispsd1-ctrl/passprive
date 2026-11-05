'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AlertCircle, Check, ChevronRight, Volume2, VolumeX } from 'lucide-react'
import { useGallery } from '@/components/sections/dining/PhotoGalleryClient'
import { CARD_GRID, OffersRow, Section } from '@/components/sections/dining/RestaurantDesktopSections'
import { t, tMin } from '@/components/sections/dining/designUnit'
import { DealRevealSection } from '@/components/shared/deals/DealRevealSection'
import { DetailReviews, type DetailReview } from '@/components/shared/detail/DetailReviews'
import { ReceiptCashbackBanner } from '@/components/shared/receipts/ReceiptCashbackBanner'
import type { MerchantCapabilityFields } from '@/lib/cashback'
import { stampColor } from '@/lib/stamps'
import type { ServiceCategory, ServiceOffer } from '@/lib/types/stores'
import { cn, isVideoUrl } from '@/lib/utils'
import { ServiceMenuSection } from './ServiceMenuSection'
import { bankBody, exclusiveBody } from './ServiceOffersSection'

const DETAIL = '/assets/wellness-detail'

/** app parity: RepeatRewardSection.jsx, drawn beside the offers. */
function StampCard({ href, image, name, area, visits, total, almostThere }: { href: string; image: string | null; name: string; area: string | null; visits: number; total: number; almostThere: boolean }) {
  return (
    <Link href={href} className='flex min-w-0 items-center bg-white drop-shadow-[0_0_20px_rgba(0,0,0,0.08)] hover:bg-gray-50' style={{ minHeight: tMin(200, 130), padding: tMin(20, 11), gap: tMin(16, 10), borderRadius: t(24) }}>
      <span className='relative shrink-0 self-stretch overflow-hidden rounded-xl bg-gray-100' style={{ width: tMin(110, 64), minHeight: tMin(110, 64) }}>
        {image && <Image src={image} alt='' fill sizes='110px' className='object-cover' />}
      </span>
      <span className='min-w-0 flex-1'>
        <span className='flex items-center justify-between font-semibold text-[#252427]' style={{ gap: 6, fontSize: tMin(17, 13) }}>
          <span className='truncate'>{name}</span>
          <ChevronRight className='shrink-0 text-[#666]' style={{ width: tMin(18, 14), height: tMin(18, 14) }} />
        </span>
        {area && <span className='block truncate text-[#767677]' style={{ marginTop: t(2), fontSize: tMin(13, 11) }}>{area}</span>}
        <span className='flex flex-wrap' style={{ marginTop: tMin(12, 7), gap: tMin(4, 3) }}>
          {Array.from({ length: total }, (_, i) => (
            i < visits ? (
              <span key={i} className='flex items-center justify-center rounded-full text-white' style={{ width: tMin(19, 13), height: tMin(19, 13), backgroundColor: stampColor(i, total) }}>
                <Check strokeWidth={3.4} style={{ width: tMin(11, 8), height: tMin(11, 8) }} />
              </span>
            ) : (
              <span key={i} className='rounded-full border border-[#d9d9d9]' style={{ width: tMin(19, 13), height: tMin(19, 13) }} />
            )
          ))}
        </span>
        <span className='flex flex-wrap items-center font-medium text-[#2c2d32]' style={{ marginTop: tMin(10, 6), gap: tMin(8, 4), fontSize: tMin(13, 11) }}>
          <Image src='/assets/stamps/repeat-reward.webp' alt='' width={88} height={102} className='object-contain' style={{ width: tMin(14, 11), height: tMin(16, 13) }} />
          {visits} / {total} visits
          {almostThere && <span className='rounded-full bg-[#ff4800] font-semibold text-white' style={{ padding: `${tMin(2, 1)} ${tMin(9, 6)}`, fontSize: tMin(11, 9) }}>Almost there!</span>}
        </span>
      </span>
    </Link>
  )
}

/**
 * app parity: ServiceCategoriesSection — the category art already carries its
 * title and background; only a category without art draws them.
 */
function ServiceTile({ category, href }: { category: ServiceCategory; href: string }) {
  return (
    <Link
      href={href}
      className='relative aspect-339/408 w-[calc((100%-7*var(--gap))/8)] min-w-27 shrink-0 snap-start overflow-hidden transition-transform hover:-translate-y-0.5'
      style={{ borderRadius: t(20) }}
    >
      {category.image ? (
        <Image src={category.image} alt={category.title} fill sizes='(min-width: 1920px) 180px, 15vw' className='object-cover' />
      ) : (
        <span className='absolute inset-0 bg-linear-to-b from-[#fde3d8] to-[#fff4ef] text-center font-medium text-[#5b5a5a]' style={{ padding: tMin(14, 8), fontSize: tMin(16, 12) }}>
          {category.title}
        </span>
      )}
    </Link>
  )
}

function VideoTile({ src, aspect }: { src: string; aspect: string }) {
  const [muted, setMuted] = useState(true)
  return (
    <div className={cn('relative min-w-0 overflow-hidden bg-[#e1e1e1]', aspect)} style={{ borderRadius: t(18) }}>
      <video src={src} autoPlay loop muted={muted} playsInline className='absolute inset-0 size-full object-cover' />
      <button
        type='button'
        onClick={() => setMuted(v => !v)}
        aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
        className='absolute flex items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm hover:bg-black/40'
        style={{ top: tMin(14, 8), right: tMin(14, 8), width: tMin(36, 28), height: tMin(36, 28) }}
      >
        {muted ? <VolumeX style={{ width: tMin(18, 14), height: tMin(18, 14) }} /> : <Volume2 style={{ width: tMin(18, 14), height: tMin(18, 14) }} />}
      </button>
    </div>
  )
}

/** Two tiles, the second counting what's left; the hero already shows the cover. */
function Vibes({ gallery, photos, cover }: { gallery: string[]; photos: string[]; cover: string | null }) {
  const { openAt } = useGallery()
  const rest = gallery.filter(g => g !== cover)
  const media = rest.length ? rest : gallery
  const tiles = media.slice(0, 2)
  const hidden = media.length - tiles.length
  const single = tiles.length === 1
  const aspect = single ? 'aspect-472/192' : 'aspect-226/192'
  return (
    <div className={cn('grid', !single && 'grid-cols-2')} style={{ gap: tMin(20, 10) }}>
      {tiles.map((src, i) => {
        if (isVideoUrl(src)) return <VideoTile key={src} src={src} aspect={aspect} />
        const last = i === tiles.length - 1 && hidden > 0
        return (
          <button
            key={src}
            type='button'
            onClick={() => openAt(photos.indexOf(src))}
            aria-label={last ? `View all ${media.length} photos` : `View photo ${i + 1}`}
            className={cn('group relative min-w-0 overflow-hidden bg-[#e1e1e1]', aspect)}
            style={{ borderRadius: t(18) }}
          >
            <Image src={src} alt='' fill sizes='(min-width: 1024px) 22vw, 45vw' className='object-cover transition-transform duration-500 group-hover:scale-[1.05]' />
            {last && (
              <span className='absolute inset-0 flex items-center justify-center bg-black/35 font-semibold text-white' style={{ fontSize: tMin(20, 15) }}>+{hidden}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function AboutCard({ icon, iconW, iconH, title, body }: { icon: string; iconW: number; iconH: number; title: string; body: string }) {
  const [open, setOpen] = useState(false)
  return (
    <article className='flex min-w-0 flex-1 flex-col bg-white drop-shadow-[0_0_20px_rgba(0,0,0,0.08)]' style={{ minHeight: tMin(210, 110), padding: tMin(24, 13), gap: tMin(16, 8), borderRadius: t(24) }}>
      <h3 className='flex items-center font-bold text-[#2c2d32]' style={{ gap: tMin(10, 6), fontSize: tMin(16, 13) }}>
        <Image src={`${DETAIL}/${icon}`} alt='' width={iconW} height={iconH} className='object-contain' style={{ width: tMin(26, 18), height: tMin(26, 18) }} />
        {title}
      </h3>
      <p className='text-[#454545]' style={{ fontSize: tMin(15, 12), lineHeight: 1.5 }}>
        <span className={cn(!open && 'line-clamp-4')}>{body}</span>
        {body.length > 150 && (
          <button type='button' onClick={() => setOpen(v => !v)} className='mt-1 block text-[#252424] underline'>
            {open ? 'Show less' : 'Show more'}
          </button>
        )}
      </p>
    </article>
  )
}

/** Offers, deals, services, vibes, about and reviews on desktop; phones use the app layout. */
export function WellnessDesktopSections({
  storeId,
  name,
  merchant,
  inStoreOffers,
  bankOffers,
  stamp,
  categories,
  bookHref,
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
  categories: ServiceCategory[]
  /** null when the store doesn't take bookings: the tiles have nowhere to go, so the service list shows instead */
  bookHref: string | null
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
  return (
    <div className='hidden font-(family-name:--font-dm-sans) md:block' style={{ paddingBottom: t(50) }}>
      <div className={cn(stamp && 'lg:grid lg:grid-cols-[minmax(0,425fr)_minmax(0,1109fr)] lg:items-start lg:gap-x-[calc(30*var(--u))]')}>
        {stamp && (
          <div style={{ marginTop: t(44) }}>
            <StampCard href={`/visit-rewards/store/${storeId}`} image={cover} name={name} area={area} {...stamp} />
          </div>
        )}
        <OffersRow
          restaurantOffers={inStoreOffers.map(o => ({ id: o.id, ...exclusiveBody(o) }))}
          bankOffers={bankOffers.map(o => ({ id: o.id, ...bankBody(o) }))}
          merchant={merchant}
          exclusiveLabel='Salon exclusive'
        />
      </div>

      {/* the section hides until a deal or the receipt card loads */}
      <Section id='deals-cashback' title='Deals & cashback' top={44} gap={20} className='[&:not(:has([data-offer-card]))]:hidden'>
        <div className={CARD_GRID}>
          <DealRevealSection storeId={storeId} merchantName={name} variant='figma' />
          <ReceiptCashbackBanner merchant={{ ...merchant, id: storeId }} kind='store' variant='figma' />
        </div>
      </Section>

      {categories.length > 0 && (bookHref ? (
        <Section id='services' title='Services' top={44} gap={20}>
          <div className='scrollbar-hide flex snap-x overflow-x-auto [--gap:calc(19*var(--u))]' style={{ gap: 'var(--gap)' }}>
            {categories.map(c => <ServiceTile key={c.id} category={c} href={`${bookHref}?category=${c.id}`} />)}
          </div>
        </Section>
      ) : (
        <ServiceMenuSection categories={categories} />
      ))}

      <div className={cn('lg:grid lg:gap-x-[calc(30*var(--u))]', gallery.length > 0 && 'lg:grid-cols-2')}>
        {gallery.length > 0 && (
          <Section id='vibes' title='Vibes' top={44} gap={20}>
            <Vibes gallery={gallery} photos={photos} cover={cover} />
          </Section>
        )}
        <Section id='about' title={hasAbout ? 'About the brand' : 'Help'} top={44} gap={20} className='flex flex-col'>
          <div className='flex flex-1 flex-col' style={{ gap: tMin(20, 10) }}>
            {hasAbout && (
              <div className={cn('grid flex-1 grid-cols-1', highlights && worthIt && 'xl:grid-cols-2')} style={{ gap: tMin(20, 10) }}>
                {highlights && <AboutCard icon='highlights.png' iconW={72} iconH={72} title='Salon highlights' body={highlights} />}
                {worthIt && <AboutCard icon='worth-it.webp' iconW={84} iconH={68} title='What makes it worth it' body={worthIt} />}
              </div>
            )}
            <Link href='/support' className='flex items-center justify-between bg-[#fff3d6] hover:bg-[#ffedc2]' style={{ padding: `${tMin(22, 12)} ${tMin(24, 14)}`, borderRadius: t(20), gap: 12 }}>
              <span className='min-w-0'>
                <span className='block font-medium text-[#252427]' style={{ fontSize: tMin(16, 13) }}>Have queries or need help?</span>
                <span className='flex items-center font-medium text-[#ff4800]' style={{ marginTop: t(4), gap: 4, fontSize: tMin(14, 12) }}>
                  Contact help &amp; support <ChevronRight style={{ width: tMin(16, 13), height: tMin(16, 13) }} />
                </span>
              </span>
              <AlertCircle className='shrink-0 text-[#f5a623]' strokeWidth={1.5} style={{ width: tMin(40, 28), height: tMin(40, 28) }} />
            </Link>
          </div>
        </Section>
      </div>

      <div className='[&_h2]:text-[length:max(16px,calc(20*var(--t)))]'>
        <DetailReviews kind='store' entityId={storeId} entityName={name} reviews={reviews} summary={summary} />
      </div>
    </div>
  )
}
