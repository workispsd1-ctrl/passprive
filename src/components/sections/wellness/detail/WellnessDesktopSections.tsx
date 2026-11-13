'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ChevronRight, Volume2, VolumeX } from 'lucide-react'
import { useGallery } from '@/components/sections/dining/PhotoGalleryClient'
import { CARD_GRID } from '@/components/sections/dining/RestaurantDesktopSections'
import { DealRevealSection } from '@/components/shared/deals/DealRevealSection'
import { DetailReviews, type DetailReview } from '@/components/shared/detail/DetailReviews'
import type { OfferBody } from '@/components/shared/detail/OffersForToday'
import { ReceiptCashbackBanner } from '@/components/shared/receipts/ReceiptCashbackBanner'
import { TierPills, type PreviewTier } from '@/components/shared/TierPills'
import { getCashbackPct, type MerchantCapabilityFields } from '@/lib/cashback'
import { MEMBERSHIP_BADGE } from '@/lib/cashbackBadge'
import { useUserPlan } from '@/lib/context/PlanContext'
import { stampColor } from '@/lib/stamps'
import type { ServiceCategory, ServiceOffer } from '@/lib/types/stores'
import { cn, isVideoUrl } from '@/lib/utils'
import { ServiceMenuSection } from './ServiceMenuSection'
import { bankBody, exclusiveBody } from './ServiceOffersSection'
import { AuthLink } from '@/components/shared/AuthLink'

/*
 * Figma "Salon details – Desktop" (1920 frame). Every length is in design px
 * via `--u` (1px at 1920, proportional at any other width) — see the page.
 */

const DETAIL = '/assets/wellness-detail'
const A = '/assets/merchant-detail'
export const SHADOW = 'shadow-[0_calc(4*var(--u))_calc(24*var(--u))_rgba(0,0,0,0.05)]'

/** Section — Heading/H5/Bold 18/26 #2C2D32, 20 above the content; sections sit 40 apart. */
export function Section({ id, title, className, children }: { id: string; title: string; className?: string; children: React.ReactNode }) {
  return (
    <section data-section={id} className={cn('mt-[calc(40*var(--u))] flex scroll-mt-[calc(170*var(--u))] flex-col gap-[calc(20*var(--u))]', className)}>
      <h2 className='text-[calc(18*var(--u))] leading-[calc(26*var(--u))] font-bold text-[#2c2d32]'>{title}</h2>
      {children}
    </section>
  )
}

/** Stamp sheet — 430×202, app parity: RepeatRewardSection.jsx. */
export function StampCard({ href, image, name, area, visits, total, almostThere }: { href: string; image: string | null; name: string; area: string | null; visits: number; total: number; almostThere: boolean }) {
  return (
    <Link href={href} className={cn('flex min-h-[calc(202*var(--u))] w-[calc(430*var(--u))] shrink-0 items-center gap-[calc(16*var(--u))] rounded-[calc(18*var(--u))] border border-[#f1f1f3] bg-white p-[calc(18*var(--u))] hover:bg-gray-50', SHADOW)}>
      <span className='relative h-[calc(136*var(--u))] w-[calc(110*var(--u))] shrink-0 overflow-hidden rounded-[calc(12*var(--u))] bg-gray-100'>
        {image && <Image src={image} alt='' fill sizes='110px' className='object-cover' />}
      </span>
      <span className='flex min-w-0 flex-1 flex-col gap-[calc(12*var(--u))]'>
        <span className='flex items-center justify-between gap-[calc(6*var(--u))]'>
          <span className='flex min-w-0 flex-col gap-[calc(3*var(--u))]'>
            <span className='truncate text-[calc(17*var(--u))] leading-[calc(22*var(--u))] font-bold text-[#0f172a]'>{name}</span>
            {area && <span className='truncate text-[calc(12*var(--u))] leading-[calc(18*var(--u))] font-medium text-[#64748b]'>{area}</span>}
          </span>
          <ChevronRight className='size-[calc(20*var(--u))] shrink-0 text-[#64748b]' strokeWidth={1.6} />
        </span>
        <span className='flex flex-wrap gap-[calc(4*var(--u))]'>
          {Array.from({ length: total }, (_, i) => (
            i < visits ? (
              <span key={i} className='flex size-[calc(18*var(--u))] items-center justify-center rounded-full text-white' style={{ backgroundColor: stampColor(i, total) }}>
                <Check className='size-[calc(10*var(--u))]' strokeWidth={3.4} />
              </span>
            ) : (
              <span key={i} className='size-[calc(18*var(--u))] rounded-full border border-[#e2e8f0] bg-white' />
            )
          ))}
        </span>
        <span className='flex flex-wrap items-center gap-[calc(7*var(--u))]'>
          <span className='text-[calc(13*var(--u))] leading-[calc(17*var(--u))] font-semibold text-[#64748b]'>{visits} / {total} visits</span>
          {almostThere && (
            <span className='rounded-[calc(16*var(--u))] bg-[#f2620f] px-[calc(7*var(--u))] py-[calc(3*var(--u))] text-[calc(10*var(--u))] leading-[calc(13*var(--u))] font-bold text-white'>Almost there!</span>
          )}
        </span>
      </span>
    </Link>
  )
}

/** Offer card — 362×156, padding 20, gap 18, radius 16; one card keeps that width too. */
function OfferCard({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn('flex min-h-[calc(156*var(--u))] w-full min-w-0 flex-col gap-[calc(18*var(--u))] rounded-[calc(16*var(--u))] bg-white p-[calc(20*var(--u))]', SHADOW)}>
      {children}
    </div>
  )
}

/** Offer title 20/26 Bold #111 over terms 13/17 #767677, 7 apart. */
function OfferText({ main, sub }: { main: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <span className='flex min-w-0 flex-1 flex-col gap-[calc(7*var(--u))]'>
      <span className='truncate text-[calc(20*var(--u))] leading-[calc(26*var(--u))] font-bold text-[#111]'>{main}</span>
      {sub && <span className='truncate text-[calc(13*var(--u))] leading-[calc(17*var(--u))] text-[#767677]'>{sub}</span>}
    </span>
  )
}

/** One card paging through several offers; 4px dots, 4 apart. */
function PagerCard({ icon, label, color, items, bank = false }: { icon: React.ReactNode; label: string; color: string; items: OfferBody[]; bank?: boolean }) {
  const [page, setPage] = useState(0)
  const railRef = useRef<HTMLDivElement>(null)
  const pick = (i: number) => railRef.current?.scrollTo({ left: i * railRef.current.clientWidth, behavior: 'smooth' })
  return (
    <OfferCard>
      <div className='flex items-center justify-between gap-[calc(8*var(--u))]'>
        <span className='flex min-w-0 items-center gap-[calc(8*var(--u))] uppercase'>
          {icon}
          <span className='truncate text-[calc(12*var(--u))] leading-[calc(16*var(--u))] font-bold' style={{ color }}>{label}</span>
        </span>
        {items.length > 1 && (
          <span className='flex gap-[calc(4*var(--u))]'>
            {items.map((it, i) => (
              <button key={it.id} type='button' aria-label={`Offer ${i + 1}`} onClick={() => pick(i)} className={cn('size-[calc(4*var(--u))] rounded-full', i === page ? 'bg-[#ff4800]' : 'bg-[#e5e5e7]')} />
            ))}
          </span>
        )}
      </div>
      <div
        ref={railRef}
        onScroll={e => setPage(Math.round(e.currentTarget.scrollLeft / (e.currentTarget.clientWidth || 1)))}
        className='scrollbar-hide flex snap-x snap-mandatory overflow-x-auto'
      >
        {items.map(it => (
          <div key={it.id} className='flex w-full shrink-0 snap-start items-center gap-[calc(10*var(--u))]'>
            {bank && (
              <span className='relative size-[calc(42*var(--u))] shrink-0 overflow-hidden rounded-[calc(2*var(--u))] bg-[#d9d9d9]'>
                {it.logo && <Image src={it.logo} alt='' fill sizes='42px' className='object-contain p-[calc(4*var(--u))]' />}
              </span>
            )}
            <OfferText main={it.main} sub={it.sub} />
          </div>
        ))}
      </div>
    </OfferCard>
  )
}

/** "Offers for today" — cards 16 apart, joined by 22px "+" connectors. */
export function AvailableOffers({ inStoreOffers, bankOffers, merchant, exclusiveLabel = 'Salon exclusive' }: { inStoreOffers: ServiceOffer[]; bankOffers: ServiceOffer[]; merchant: MerchantCapabilityFields; exclusiveLabel?: string }) {
  const plan = useUserPlan()
  const pct = getCashbackPct(merchant, plan)
  const cards: React.ReactNode[] = []
  if (inStoreOffers.length) {
    cards.push(
      <PagerCard
        key='exclusive'
        items={inStoreOffers.map(o => ({ id: o.id, ...exclusiveBody(o) }))}
        icon={<Image src={`${A}/offer-diamond.png`} alt='' width={22} height={19} className='h-[calc(19*var(--u))] w-[calc(22*var(--u))] shrink-0' />}
        label={exclusiveLabel}
        color='#ff4800'
      />,
    )
  }
  if (pct > 0) {
    cards.push(
      <OfferCard key='cashback'>
        <Image src={MEMBERSHIP_BADGE[plan]} alt='' width={133} height={57} className='h-[calc(33.5*var(--u))] w-auto self-start' />
        <OfferText main={`Get ${pct}% cash back`} sub='credited as PrivéCredits instantly' />
      </OfferCard>,
    )
  }
  if (bankOffers.length) {
    cards.push(
      <PagerCard
        key='bank'
        bank
        items={bankOffers.map(o => ({ id: o.id, ...bankBody(o) }))}
        icon={<span className='text-[calc(18*var(--u))] leading-[calc(18*var(--u))]' aria-hidden='true'>💳</span>}
        label='Bank & card offers'
        color='#7c2d12'
      />,
    )
  }
  if (!cards.length) return null
  return (
    <div className='flex min-w-0 flex-1 flex-col gap-[calc(18*var(--u))]'>
      <h2 className='text-[calc(18*var(--u))] leading-[calc(23*var(--u))] font-bold text-[#2c2d32]'>Offers for today</h2>
      <div className='flex gap-[calc(16*var(--u))]'>
        {cards.map((card, i) => (
          <div key={i} className='relative flex w-[calc(362*var(--u))] min-w-0 shrink-0'>
            {card}
            {i < cards.length - 1 && (
              <span className='absolute top-1/2 right-[calc(-19*var(--u))] z-10 flex size-[calc(22*var(--u))] -translate-y-1/2 items-center justify-center rounded-full bg-[#767677] text-[calc(16*var(--u))] leading-[calc(21*var(--u))] font-bold text-white'>
                +
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Service category — 8 across, 16 apart, 186 tall, radius 12. The category
 * art already carries its title and gradient (app parity:
 * ServiceCategoriesSection); a category without art draws them.
 */
function ServiceTile({ category, href }: { category: ServiceCategory; href: string }) {
  return (
    <AuthLink
      href={href}
      className='relative h-[calc(186*var(--u))] w-[calc((100%-7*16*var(--u))/8)] shrink-0 snap-start overflow-hidden rounded-[calc(12*var(--u))] bg-linear-to-b from-[#ffe7de] to-[#fff7f2] transition-transform hover:-translate-y-0.5'
    >
      {category.image ? (
        <Image src={category.image} alt={category.title} fill sizes='10vw' className='object-cover object-top' />
      ) : (
        <span className='flex flex-col items-center px-[calc(10*var(--u))] pt-[calc(16*var(--u))] text-center text-[calc(16*var(--u))] leading-[calc(21*var(--u))] font-medium text-[#5a5a5a]'>
          {category.title}
        </span>
      )}
    </AuthLink>
  )
}

/** Salon video — 376×320, radius 18, a 36px mute button 16 in from the top right. */
function VideoTile({ src }: { src: string }) {
  const [muted, setMuted] = useState(true)
  return (
    <div className={cn('relative h-[calc(320*var(--u))] min-w-0 overflow-hidden rounded-[calc(18*var(--u))] bg-[#e1e1e1]', SHADOW)}>
      <video src={src} autoPlay loop muted={muted} playsInline className='absolute inset-0 size-full object-cover' />
      <button
        type='button'
        onClick={() => setMuted(v => !v)}
        aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
        className='absolute top-[calc(16*var(--u))] right-[calc(16*var(--u))] flex size-[calc(36*var(--u))] items-center justify-center rounded-full bg-white/30 text-white'
      >
        {muted ? <VolumeX className='size-[calc(20*var(--u))]' strokeWidth={1.4} /> : <Volume2 className='size-[calc(20*var(--u))]' strokeWidth={1.4} />}
      </button>
    </div>
  )
}

/** Salon atmosphere — four tiles 20 apart; the last counts what's left. The hero already shows the cover. */
export function Vibes({ gallery, photos, cover }: { gallery: string[]; photos: string[]; cover: string | null }) {
  const { openAt } = useGallery()
  const rest = gallery.filter(g => g !== cover)
  const media = rest.length ? rest : gallery
  const tiles = media.slice(0, 4)
  const hidden = media.length - tiles.length
  return (
    <div className='grid grid-cols-4 gap-[calc(20*var(--u))]'>
      {tiles.map((src, i) => {
        if (isVideoUrl(src)) return <VideoTile key={src} src={src} />
        const last = i === tiles.length - 1 && hidden > 0
        return (
          <button
            key={src}
            type='button'
            onClick={() => openAt(photos.indexOf(src))}
            aria-label={last ? `View all ${media.length} photos` : `View photo ${i + 1}`}
            className={cn('group relative h-[calc(320*var(--u))] min-w-0 overflow-hidden rounded-[calc(18*var(--u))] bg-[#e1e1e1]', SHADOW)}
          >
            <Image src={src} alt='' fill sizes='20vw' className='object-cover transition-transform duration-500 group-hover:scale-[1.05]' />
            {last && (
              <span className='absolute inset-0 flex items-center justify-center bg-black/35 text-[calc(20*var(--u))] font-semibold text-white'>+{hidden}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Brand detail card — padding 24, gap 18, radius 18; title 16/21 ExtraBold, body 15/23. */
export function AboutCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  const [open, setOpen] = useState(false)
  return (
    <article className={cn('flex min-h-[calc(210*var(--u))] min-w-0 flex-col gap-[calc(18*var(--u))] rounded-[calc(18*var(--u))] bg-white p-[calc(24*var(--u))]', SHADOW)}>
      <h3 className='flex items-center gap-[calc(8*var(--u))] text-[calc(16*var(--u))] leading-[calc(21*var(--u))] font-extrabold text-[#303030]'>
        <Image src={`${DETAIL}/${icon}`} alt='' width={25} height={24} className='h-[calc(24*var(--u))] w-[calc(25*var(--u))] shrink-0 object-contain' />
        {title}
      </h3>
      <p className='text-[calc(15*var(--u))] leading-[calc(23*var(--u))] text-[#454545]'>
        <span className={cn(!open && 'line-clamp-3')}>{body}</span>
        {body.length > 120 && (
          <button type='button' onClick={() => setOpen(v => !v)} className='mt-[calc(4*var(--u))] block text-[#252424] underline'>
            {open ? 'Show less' : 'Show more'}
          </button>
        )}
      </p>
    </article>
  )
}

/** Help and support — 90 tall, #FFF1CF, radius 12. */
export function HelpBar() {
  return (
    <Link href='/support' className='flex h-[calc(90*var(--u))] items-center justify-between rounded-[calc(12*var(--u))] bg-[#fff1cf] px-[calc(24*var(--u))] hover:bg-[#ffeab8]'>
      <span className='flex min-w-0 flex-col gap-[calc(5*var(--u))]'>
        <span className='text-[calc(16*var(--u))] leading-[calc(20*var(--u))] font-medium text-[#2c2d32]'>Have queries or need help?</span>
        <span className='flex items-center gap-[calc(8*var(--u))] text-[calc(14*var(--u))] leading-[calc(20*var(--u))] font-medium text-[#ff4800]'>
          Contact help &amp; support <ChevronRight className='size-[calc(14*var(--u))]' strokeWidth={1.8} />
        </span>
      </span>
      <span className='flex size-[calc(42*var(--u))] shrink-0 items-center justify-center rounded-full border-[calc(2*var(--u))] border-[#ffe29e] text-[calc(28*var(--u))] leading-[calc(36*var(--u))] text-[#ffd887]'>!</span>
    </Link>
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
  // app parity: ServiceStoreDetails previewTier — the plan the deals and cashback are shown for
  const [previewTier, setPreviewTier] = useState<PreviewTier | null>(null)
  return (
    <div className='hidden font-(family-name:--font-dm-sans) md:block'>
      {/* Rewards and offers — 28 under the tabs, bottoms aligned, 28 apart */}
      <div data-section='offers' className='mt-[calc(28*var(--u))] flex scroll-mt-[calc(170*var(--u))] items-end gap-[calc(28*var(--u))] empty:hidden'>
        {stamp && <StampCard href={`/visit-rewards/store/${storeId}`} image={cover} name={name} area={area} {...stamp} />}
        <AvailableOffers inStoreOffers={inStoreOffers} bankOffers={bankOffers} merchant={merchant} />
      </div>

      {/* the section hides until a deal or the receipt card loads */}
      <Section id='deals-cashback' title='Deals & cashback' className='[&:not(:has([data-offer-card]))]:hidden'>
        <TierPills value={previewTier} onChange={setPreviewTier} className='max-w-80' />
        <div className={CARD_GRID}>
          <DealRevealSection storeId={storeId} merchantName={name} variant='figma' previewTier={previewTier} />
          <ReceiptCashbackBanner merchant={{ ...merchant, id: storeId }} kind='store' variant='figma' previewTier={previewTier} />
        </div>
      </Section>

      {categories.length > 0 && (bookHref ? (
        <Section id='services' title='Services'>
          <div className='scrollbar-hide flex snap-x gap-[calc(16*var(--u))] overflow-x-auto'>
            {categories.map(c => <ServiceTile key={c.id} category={c} href={`${bookHref}?category=${c.id}`} />)}
          </div>
        </Section>
      ) : (
        <ServiceMenuSection categories={categories} />
      ))}

      {gallery.length > 0 && (
        <Section id='vibes' title='Vibes'>
          <Vibes gallery={gallery} photos={photos} cover={cover} />
        </Section>
      )}

      <Section id='about' title={hasAbout ? 'About the brand' : 'Help'}>
        {hasAbout && (
          <div className='grid grid-cols-4 gap-[calc(20*var(--u))]'>
            {highlights && <AboutCard icon='highlights.png' title='Salon highlights' body={highlights} />}
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
