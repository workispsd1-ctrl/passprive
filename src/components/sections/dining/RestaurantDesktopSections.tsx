'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCashbackPct, type MerchantCapabilityFields } from '@/lib/cashback'
import { MEMBERSHIP_BADGE } from '@/lib/cashbackBadge'
import { LeaveReviewDialog } from '@/components/shared/LeaveReviewDialog'
import type { DetailReview } from '@/components/shared/detail/DetailReviews'
import type { OfferBody } from '@/components/shared/detail/OffersForToday'
import { REVIEW_ASPECT_LABELS, type ReviewAspect } from '@/lib/reviews'
import { MenuGalleryProvider, useMenuGallery } from './MenuGalleryClient'
import { OfferCard, OfferText } from './OfferCard'
import { useGallery } from './PhotoGalleryClient'
import { t, tMin } from './designUnit'

const A = '/assets/merchant-detail'
const INTER = 'font-(family-name:--font-inter)'
// three across the main column, once it's wide enough to hold them
export const CARD_GRID = 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 min-[120rem]:gap-4'

/** Section heading — css.txt "Section Heading": 19.6/28 Bold #161616 (the offers row's is 16.52/24). */
export function Section({ id, title, top, gap = 28, small = false, className, children }: { id: string; title: string; top: number; gap?: number; small?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <section data-section={id} className={className} style={{ marginTop: t(top), scrollMarginTop: t(170) }}>
      <h2
        className='font-bold text-[#161616]'
        style={small ? { fontSize: tMin(16.52, 15), lineHeight: tMin(24, 20), marginBottom: t(gap) } : { fontSize: tMin(19.6, 16), lineHeight: tMin(28, 22), marginBottom: t(gap) }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

/** Pager dots — 5.9px, #FF4800 active / #E5E5E7, 4.72px apart. */
function Dots({ count, page, onPick }: { count: number; page: number; onPick: (i: number) => void }) {
  if (count <= 1) return null
  return (
    <span className='flex items-center' style={{ gap: tMin(4.72, 3) }}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type='button'
          aria-label={`Offer ${i + 1}`}
          onClick={() => onPick(i)}
          className={cn('rounded-full', i === page ? 'bg-[#ff4800]' : 'bg-[#e5e5e7]')}
          style={{ width: tMin(5.9, 5), height: tMin(5.9, 5) }}
        />
      ))}
    </span>
  )
}

/** The bank-offer wallet icon, rebuilt from the frame's layers. */
function WalletIcon() {
  // css.txt "Cover": 24.56×18.8 — the layers below are drawn at 41.6×32, scaled to fit
  return (
    <span className='relative block shrink-0' style={{ width: t(24.56), height: t(18.8) }}>
    <span className='absolute top-0 left-0 block origin-top-left drop-shadow-[0_0.65px_1.6px_rgba(0,0,0,0.1)]' style={{ width: t(41.6), height: t(32), transform: 'scale(0.5904)' }}>
      <span
        className='absolute inset-x-0 overflow-hidden'
        style={{ top: t(3.5), height: t(28.4), borderRadius: t(1.9), backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%), linear-gradient(90deg, #ff5e19, #ff5e19)' }}
      >
        <span className='absolute inset-0 opacity-[0.04]' style={{ backgroundImage: `url(${A}/wallet-texture.png)`, backgroundSize: `${t(40)} ${t(40)}` }} />
      </span>
      <span
        className='absolute rotate-[9.4deg] shadow-[0_0.16px_0.64px_rgba(0,0,0,0.45)]'
        style={{ left: t(2), top: t(2.8), width: t(36.9), height: t(22.6), borderRadius: t(1.4), backgroundImage: 'linear-gradient(-58deg, rgba(255,255,255,0.05), rgba(255,255,255,0)), linear-gradient(90deg, #3b3a88, #3b3a88)' }}
      />
      <Image src={`${A}/wallet-pocket.png`} alt='' width={47} height={24} className='absolute max-w-none' style={{ left: t(-2.5), top: t(10.5), width: t(46.7), height: t(23.6) }} />
      <Image src={`${A}/wallet-stitch.png`} alt='' width={41} height={18} className='absolute max-w-none opacity-30' style={{ left: t(0.4), top: t(13.4), width: t(40.9), height: t(18.2) }} />
      <Image src={`${A}/wallet-crease.svg`} alt='' width={41} height={2} className='absolute max-w-none' style={{ left: t(0.5), top: t(13.9), width: t(40.6), height: t(2.4) }} />
    </span>
    </span>
  )
}

/** One offer card that pages through several offers. */
function PagerCard({ head, items, bank = false }: { head: React.ReactNode; items: OfferBody[]; bank?: boolean }) {
  const [page, setPage] = useState(0)
  const railRef = useRef<HTMLDivElement>(null)
  const pick = (i: number) => {
    const rail = railRef.current
    if (rail) rail.scrollTo({ left: i * rail.clientWidth, behavior: 'smooth' })
  }
  return (
    <OfferCard>
      <div className='flex items-center justify-between'>
        {head}
        <Dots count={items.length} page={page} onPick={pick} />
      </div>
      <div
        ref={railRef}
        onScroll={e => setPage(Math.round(e.currentTarget.scrollLeft / (e.currentTarget.clientWidth || 1)))}
        className='scrollbar-hide flex snap-x snap-mandatory overflow-x-auto'
      >
        {items.map(it => (
          <div key={it.id} className='flex w-full shrink-0 snap-start items-center' style={{ gap: t(6.72) }}>
            {bank && (
              <span className='relative shrink-0 overflow-hidden bg-[#d9d9d9]' style={{ width: tMin(54.28, 36), height: tMin(51.92, 34), borderRadius: t(2.36) }}>
                {it.logo && <Image src={it.logo} alt='' fill sizes='92px' className='object-contain p-2' />}
              </span>
            )}
            <OfferText main={it.main} sub={it.sub} className={cn(bank && 'flex-1 items-center')} />
          </div>
        ))}
      </div>
    </OfferCard>
  )
}

/** "Offers for today" — 508×208 cards, 26 apart, joined by "+" connectors. */
export function OffersRow({
  restaurantOffers,
  bankOffers,
  merchant,
  exclusiveLabel = 'Restaurant exclusive',
  afterCashback,
  header,
}: {
  restaurantOffers: OfferBody[]
  bankOffers: OfferBody[]
  merchant: MerchantCapabilityFields
  exclusiveLabel?: string
  /**
   * Cards that load on the client (deal tickets, receipt cashback), placed
   * after the cashback card. Each is an OfferCard grid item; the row hides
   * while it has no card at all.
   */
  afterCashback?: React.ReactNode
  /** under the heading, above the cards — e.g. the TierPills */
  header?: React.ReactNode
}) {
  const plan = useUserPlan()
  const pct = getCashbackPct(merchant, plan)
  const cards: React.ReactNode[] = []
  if (restaurantOffers.length) {
    cards.push(
      <PagerCard
        key='exclusive'
        items={restaurantOffers}
        head={
          <span className='flex min-w-0 items-center uppercase' style={{ gap: t(9.44) }}>
            <Image src={`${A}/offer-diamond.png`} alt='' width={36} height={31} className='shrink-0' style={{ width: tMin(22.11, 16), height: tMin(18.84, 14) }} />
            <span className='truncate font-bold text-[#ff4800]' style={{ fontSize: tMin(14.16, 11), lineHeight: tMin(18, 14) }}>{exclusiveLabel}</span>
          </span>
        }
      />,
    )
  }
  if (pct > 0) {
    cards.push(
      <OfferCard key='cashback'>
        <Image src={MEMBERSHIP_BADGE[plan]} alt='' width={133} height={57} className='w-auto self-start' style={{ height: tMin(33.55, 24) }} />
        <OfferText main={`Get ${pct}% cash back`} sub='credited as PrivéCredits instantly' />
      </OfferCard>,
    )
  }
  if (bankOffers.length) {
    cards.push(
      <PagerCard
        key='bank'
        bank
        items={bankOffers}
        head={
          <span className='flex min-w-0 items-center uppercase' style={{ gap: t(9.44) }}>
            <WalletIcon />
            <span className='truncate font-bold text-[#7c2d12]' style={{ fontSize: tMin(14.16, 11), lineHeight: tMin(18, 14) }}>Bank &amp; card offers</span>
          </span>
        }
      />,
    )
  }
  if (!cards.length && !afterCashback) return null
  // the client cards go straight after the cashback card (after the exclusive card when there's none)
  const at = cards.findIndex(c => (c as React.ReactElement).key === 'cashback') + 1 || (restaurantOffers.length ? 1 : 0)
  const wrap = (card: React.ReactNode, i: number) => (
    <div key={i} className='relative min-w-0'>
      {card}
      {i < cards.length - 1 && (
        <span
          className='absolute top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-[#767677] font-bold text-white xl:flex'
          style={{ right: t(-22.86), width: t(21.71), height: t(21.71), fontSize: t(14.47), lineHeight: 1 }}
        >
          +
        </span>
      )}
    </div>
  )
  return (
    // with client cards, the row hides until one of its cards is on the page
    <Section id='offers' title='Offers for today' top={24} gap={20} small className={cn(afterCashback != null && '[&:not(:has([data-offer-card]))]:hidden')}>
      {header && <div style={{ marginBottom: tMin(16, 12) }}>{header}</div>}
      {/* css.txt: 360×170 cards, 24 apart */}
      <div className={CARD_GRID} style={{ gap: tMin(24, 16) }}>
        {cards.slice(0, at).map(wrap)}
        {afterCashback}
        {cards.slice(at).map((card, i) => wrap(card, at + i))}
      </div>
    </Section>
  )
}

/** The artwork carries the cards and its "Check out Menu" pill; the whole banner opens the menu. */
function MenuBanner() {
  const { openAt } = useMenuGallery()
  return (
    <button type='button' onClick={() => openAt(0)} aria-label='Check out the menu' className='relative block aspect-4512/512 w-full overflow-hidden transition-opacity hover:opacity-95' style={{ borderRadius: t(12) }}>
      <Image src={`${A}/menu-banner.webp`} alt='' fill sizes='(min-width: 1920px) 1128px, 70vw' className='object-cover' />
    </button>
  )
}

/** Figma: two rows of three, the sixth tile counting what's left. */
function PhotosGrid({ photos }: { photos: string[] }) {
  const { openAt } = useGallery()
  const tiles = photos.slice(0, 6)
  const hidden = photos.length - tiles.length
  return (
    // css.txt: 360×180 tiles, radius 16, 24 across / 20 down
    <div className='grid grid-cols-2 lg:grid-cols-3' style={{ columnGap: tMin(24, 10), rowGap: tMin(20, 10) }}>
      {tiles.map((src, i) => {
        const last = i === tiles.length - 1 && hidden > 0
        return (
          <button
            key={src + i}
            type='button'
            onClick={() => openAt(i)}
            className='group relative aspect-2/1 min-w-0 overflow-hidden bg-[#e1e1e1]'
            style={{ borderRadius: t(16) }}
            aria-label={last ? `View all ${photos.length} photos` : `View photo ${i + 1}`}
          >
            <Image src={src} alt='' fill sizes='(min-width: 1920px) 360px, (min-width: 1024px) 20vw, 40vw' className='object-cover transition-transform duration-500 group-hover:scale-[1.05]' />
            {last && (
              <span className='absolute inset-0 flex items-center justify-center bg-[#b5b5b5]/85 font-semibold text-[#fffbff]' style={{ fontSize: tMin(18, 15), lineHeight: 1.39 }}>
                +{hidden}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function reviewDate(iso: string) {
  const t = Date.parse(iso)
  return Number.isFinite(t)
    ? new Date(t).toLocaleDateString('en-GB', { timeZone: 'Indian/Mauritius', day: 'numeric', month: 'short', year: 'numeric' })
    : ''
}

function ReviewCard({ review }: { review: DetailReview }) {
  const [open, setOpen] = useState(false)
  const name = review.username_snapshot?.trim() || 'PassPrivé member'
  const text = review.review_text?.trim()
  return (
    // css.txt "Review-1": #EBEBEB, radius 21.33, 24 padding — the name row sits 21.33 lower in its container
    <article className='flex min-w-0 flex-col bg-[#ebebeb]' style={{ minHeight: tMin(216, 150), padding: `${tMin(45.33, 18)} ${tMin(24, 14)} ${tMin(24, 14)}`, borderRadius: t(21.33), gap: tMin(22.67, 12) }}>
      <div className='flex items-start' style={{ gap: tMin(16, 10) }}>
        <span className='flex shrink-0 items-center justify-center rounded-full bg-[#FFD9C7] font-bold text-[#B33A00]' style={{ width: tMin(40, 30), height: tMin(40, 30), fontSize: tMin(16, 13) }}>
          {name.charAt(0).toUpperCase()}
        </span>
        <span className='flex min-w-0 flex-1 flex-col font-medium'>
          <span className='truncate text-[#303030]' style={{ fontSize: tMin(16, 13), lineHeight: tMin(22, 18) }}>{name}</span>
          <span className='text-[#666]' style={{ fontSize: tMin(14.67, 11), lineHeight: tMin(22, 16) }}>{reviewDate(review.created_at)}</span>
        </span>
        <span className='flex shrink-0 items-center rounded-full bg-[#00752e] font-bold text-white' style={{ padding: `${tMin(2.67, 2)} ${tMin(8, 6)}`, borderRadius: t(38.67), gap: t(2.67), fontSize: tMin(16, 12), lineHeight: tMin(21.33, 16) }}>
          {Number(review.rating).toFixed(1)}
          <Image src={`${A}/review-star.svg`} alt='' width={19} height={19} style={{ width: tMin(13.33, 10), height: tMin(13.33, 10) }} />
        </span>
      </div>
      {text && (
        <p className='text-[#666]' style={{ fontSize: tMin(16, 12), lineHeight: 1.4375 }}>
          <span className={cn(!open && 'line-clamp-3')}>{text}</span>
          {text.length > 150 && (
            <button type='button' onClick={() => setOpen(v => !v)} className='mt-1 block text-[#252424] underline'>
              {open ? 'Show less' : 'Read more'}
            </button>
          )}
        </p>
      )}
    </article>
  )
}

function aspect(reviews: DetailReview[], key: 'food_rating' | 'service_rating' | 'ambience_rating') {
  const vals = reviews.map(r => r[key]).filter((v): v is number => v != null).map(Number)
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

/**
 * Reviews — css.txt "Group 2085664822": the overall pill with "N ratings", the
 * three aspect scores between 52-tall rules, two #EBEBEB review cards, then
 * "Leave a review" and "Show all N reviews".
 */
export function ReviewsSection({
  kind,
  entityId,
  name,
  reviews,
  summary,
  allHref,
  aspectKind,
  top = 22,
}: {
  kind: 'restaurant' | 'store'
  entityId: string
  name: string
  reviews: DetailReview[]
  summary: { avg: number; count: number }
  /** the full reviews page; without one, "Show all" opens the rest in place */
  allHref?: string
  /** what the three ratings are called (app parity: LeaveReviewModal STEP_LABELS) */
  aspectKind?: ReviewAspect
  top?: number
}) {
  const [all, setAll] = useState(false)
  const labels = REVIEW_ASPECT_LABELS[aspectKind ?? (kind === 'restaurant' ? 'restaurant' : 'store')]
  const aspects = [
    { label: labels[0], value: aspect(reviews, 'food_rating') },
    { label: labels[1], value: aspect(reviews, 'service_rating') },
    { label: labels[2], value: aspect(reviews, 'ambience_rating') },
  ].filter(a => a.value != null)
  const ratingCount = summary.count >= 1000 ? `${(summary.count / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(summary.count)
  return (
      <Section id='reviews' title='Reviews' top={top} gap={20}>
        {summary.count > 0 && (
          <div className='flex items-center' style={{ minHeight: tMin(56, 44), marginBottom: tMin(28, 16) }}>
            <div className='flex flex-col items-center' style={{ marginRight: tMin(70, 22) }}>
              <span className={`flex items-center justify-center font-bold text-white ${INTER} bg-[#007c40]`} style={{ width: tMin(82, 62), height: tMin(36, 28), borderRadius: t(30.07), gap: t(11.6), fontSize: tMin(19.25, 15), lineHeight: tMin(28, 20) }}>
                {summary.avg.toFixed(1)}
                <Image src={`${A}/rating-star-lg.svg`} alt='' width={20} height={18} style={{ width: tMin(11.94, 10), height: tMin(11.94, 10) }} />
              </span>
              <span className='font-medium text-[#8b898d] underline' style={{ fontSize: tMin(11, 10), lineHeight: tMin(15, 13), marginTop: t(8.2) }}>{ratingCount} ratings</span>
            </div>
            {aspects.map(a => (
              <div key={a.label} className='flex items-center self-stretch'>
                <span className='rounded-[5.2px] bg-[#8b898d]' style={{ width: 1.3, height: tMin(52, 40) }} />
                <div className='flex flex-col items-center font-medium' style={{ padding: `0 ${tMin(41, 16)}`, fontSize: tMin(15.6, 12), lineHeight: tMin(21, 16) }}>
                  <span className='font-semibold text-[#443c44]'>{Number(a.value).toFixed(1)}</span>
                  <span className='text-[#8b898d]'>{a.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {reviews.length > 0 ? (
          <div className='grid grid-cols-1 lg:grid-cols-2' style={{ gap: tMin(24, 12) }}>
            {(all ? reviews : reviews.slice(0, 2)).map(r => <ReviewCard key={r.id} review={r} />)}
          </div>
        ) : (
          <p className='text-[#767677]' style={{ fontSize: tMin(16, 13) }}>No reviews yet — be the first to share your experience at {name}.</p>
        )}
        <div className='flex flex-wrap items-center justify-between' style={{ marginTop: tMin(24, 14), gap: tMin(12, 8) }}>
          <LeaveReviewDialog kind={kind} entityId={entityId} entityName={name} variant='figma' aspect={aspectKind} />
          {summary.count > 2 && allHref && (
            <Link
              href={allHref}
              className='flex items-center justify-between border-solid border-[#e5e5e5] bg-white text-[#252427] hover:bg-gray-50'
              style={{ width: tMin(375, 200), height: tMin(43.75, 36), borderWidth: 1.25, borderRadius: t(24.62), padding: `0 ${tMin(15, 12)} 0 ${tMin(24, 14)}`, gap: 8, fontSize: tMin(14.22, 12), lineHeight: tMin(20, 16) }}
            >
              Show all {summary.count} reviews
              <ChevronRight className='shrink-0 text-[#666]' style={{ width: tMin(18, 14), height: tMin(18, 14) }} />
            </Link>
          )}
          {/* no reviews page for this kind: the rest open in place */}
          {!allHref && reviews.length > 2 && (
            <button
              type='button'
              onClick={() => setAll(v => !v)}
              className='flex items-center justify-between border-solid border-[#e5e5e5] bg-white text-[#252427] hover:bg-gray-50'
              style={{ width: tMin(375, 200), height: tMin(43.75, 36), borderWidth: 1.25, borderRadius: t(24.62), padding: `0 ${tMin(15, 12)} 0 ${tMin(24, 14)}`, gap: 8, fontSize: tMin(14.22, 12), lineHeight: tMin(20, 16) }}
            >
              {all ? 'Show fewer reviews' : `Show all ${reviews.length} reviews`}
              <ChevronRight className={cn('shrink-0 text-[#666] transition-transform', all && '-rotate-90')} style={{ width: tMin(18, 14), height: tMin(18, 14) }} />
            </button>
          )}
        </div>
      </Section>
  )
}

/**
 * The main column of the restaurant page on desktop: Offers for today, Deals &
 * cashback, the menu banner, photos, reviews (+ "Leave a review"), About the
 * Restaurant and Amenities, sized for the 1128 column of the 1920 frame.
 * Sections carry `data-section` so the sticky tabs find them; phones use the
 * app layout.
 */
export function RestaurantDesktopSections({
  restaurantId,
  slug,
  name,
  restaurantOffers,
  bankOffers,
  merchant,
  menuImages,
  photos,
  reviews,
  summary,
  description,
  highlights,
  worthIt,
  amenities,
}: {
  restaurantId: string
  slug: string
  name: string
  restaurantOffers: OfferBody[]
  bankOffers: OfferBody[]
  merchant: MerchantCapabilityFields
  menuImages: string[]
  photos: string[]
  reviews: DetailReview[]
  summary: { avg: number; count: number }
  description: string | null
  highlights: string | null
  worthIt: string | null
  amenities: string[]
}) {
  const about = [
    highlights && { title: 'Restaurant highlights', body: highlights },
    worthIt && { title: 'What makes it worth it', body: worthIt },
    description && { title: `About ${name}`, body: description },
  ].filter((a): a is { title: string; body: string } => !!a)

  return (
    <div className='font-(family-name:--font-dm-sans)' style={{ paddingBottom: t(90) }}>
      <OffersRow restaurantOffers={restaurantOffers} bankOffers={bankOffers} merchant={merchant} />

      {menuImages.length > 0 && (
        <Section id='menu' title='Menu' top={42} gap={16}>
          <MenuGalleryProvider images={menuImages}>
            <MenuBanner />
          </MenuGalleryProvider>
        </Section>
      )}

      {photos.length > 0 && (
        <Section id='gallery' title='Photos' top={16} gap={16}>
          <PhotosGrid photos={photos} />
          <div className='flex justify-end' style={{ marginTop: tMin(20, 12) }}>
            <LeaveReviewDialog kind='restaurant' entityId={restaurantId} entityName={name} variant='add-image' />
          </div>
        </Section>
      )}

      <ReviewsSection kind='restaurant' entityId={restaurantId} name={name} reviews={reviews} summary={summary} allHref={`/dining/${slug}/reviews`} />

      {about.length > 0 && (
        <Section id='about-desktop' title='About the Restaurant' top={22} gap={16}>
          <div className='grid grid-cols-1 lg:grid-cols-2' style={{ gap: tMin(24, 12) }}>
            {about.map(a => (
              <article
                key={a.title}
                // css.txt "Review-1" (About): white, radius 21.33, 0 5.33 31.73 rgba(0,0,0,.1)
                className='flex min-w-0 flex-col bg-white shadow-[0_calc(5.33*var(--t))_calc(31.73*var(--t))_rgba(0,0,0,0.1)]'
                style={{ minHeight: tMin(176, 110), padding: tMin(24, 14), borderRadius: t(21.33), gap: tMin(22.67, 10) }}
              >
                <h3 className='font-extrabold text-[#303030]' style={{ fontSize: tMin(16, 13), lineHeight: tMin(21, 17) }}>{a.title}</h3>
                <p className='line-clamp-4 text-[#454545]' style={{ fontSize: tMin(16, 12), lineHeight: 1.4375 }}>{a.body}</p>
              </article>
            ))}
          </div>
        </Section>
      )}

      {amenities.length > 0 && (
        <Section id='amenities' title='Amenities' top={40} gap={20}>
          <ul className='grid grid-cols-2 text-[#505050] lg:grid-cols-3' style={{ rowGap: tMin(10, 8), columnGap: t(24), fontSize: tMin(16, 13), lineHeight: tMin(22, 18) }}>
            {amenities.map(a => (
              <li key={a} className='flex min-w-0 items-center' style={{ gap: tMin(10, 8), paddingLeft: t(8) }}>
                <span className='shrink-0 rounded-full bg-[#505050]' style={{ width: 4, height: 4 }} />
                {a}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}
