'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCashbackPct, type MerchantCapabilityFields } from '@/lib/cashback'
import { MEMBERSHIP_BADGE } from '@/lib/cashbackBadge'
import { LeaveReviewDialog } from '@/components/shared/LeaveReviewDialog'
import type { DetailReview } from '@/components/shared/detail/DetailReviews'
import type { OfferBody } from '@/components/shared/detail/OffersForToday'
import { DealRevealSection } from '@/components/shared/deals/DealRevealSection'
import { ReceiptCashbackBanner } from '@/components/shared/receipts/ReceiptCashbackBanner'
import { MenuGalleryProvider, useMenuGallery } from './MenuGalleryClient'
import { OfferCard, OfferText } from './OfferCard'
import { useGallery } from './PhotoGalleryClient'
import { t, u } from './designUnit'

const A = '/assets/merchant-detail'
const INTER = 'font-(family-name:--font-inter)'
const SERIF = 'font-(family-name:--font-libre-baskerville)'

/** Section heading — 32 Bold #2c2d32, 28 above its content. */
function Section({ id, title, top, gap = 28, className, children }: { id: string; title: string; top: number; gap?: number; className?: string; children: React.ReactNode }) {
  return (
    <section data-section={id} className={className} style={{ marginTop: t(top), scrollMarginTop: t(170) }}>
      <h2 className='font-bold text-[#2c2d32]' style={{ fontSize: t(32), lineHeight: t(40), marginBottom: t(gap) }}>{title}</h2>
      {children}
    </section>
  )
}

/**
 * A row that scrolls sideways, with the frame's round "next" button at its
 * right edge while more is hidden. The scroller is padded out (and pulled
 * back by negative margins) so the cards' soft shadows have room — a
 * scroller clips everything at its edges, which drew hard lines through them.
 */
function Rail({ children, gap, arrowTop }: { children: React.ReactNode; gap: number; arrowTop?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState(false)
  const measure = useCallback(() => {
    const el = ref.current
    if (el) setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure])
  return (
    <div className='relative'>
      <div ref={ref} onScroll={measure} className='scrollbar-hide -mx-8 -my-10 flex snap-x scroll-px-8 overflow-x-auto px-8 py-10' style={{ gap: t(gap) }}>
        {children}
      </div>
      {more && (
        <button
          type='button'
          aria-label='Show more'
          onClick={() => ref.current?.scrollBy({ left: ref.current.clientWidth * 0.8, behavior: 'smooth' })}
          className='absolute -translate-y-1/2'
          style={{ right: t(-24), top: arrowTop ?? '50%', width: t(48), height: t(48) }}
        >
          <Image src={`${A}/round-next.svg`} alt='' width={48} height={48} style={{ width: t(48), height: t(48) }} />
        </button>
      )}
    </div>
  )
}

/** Pager dots — 10px, #FF4800 active / #E5E5E7, 8px apart. */
function Dots({ count, page, onPick }: { count: number; page: number; onPick: (i: number) => void }) {
  if (count <= 1) return null
  return (
    <span className='flex items-center' style={{ gap: t(8) }}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type='button'
          aria-label={`Offer ${i + 1}`}
          onClick={() => onPick(i)}
          className={cn('rounded-full', i === page ? 'bg-[#ff4800]' : 'bg-[#e5e5e7]')}
          style={{ width: t(10), height: t(10) }}
        />
      ))}
    </span>
  )
}

/** The bank-offer wallet icon, rebuilt from the frame's layers. */
function WalletIcon() {
  return (
    <span className='relative block shrink-0 drop-shadow-[0_0.65px_1.6px_rgba(0,0,0,0.1)]' style={{ width: t(41.6), height: t(32) }}>
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
          <div key={it.id} className='flex w-full shrink-0 snap-start items-center' style={{ gap: t(16) }}>
            {bank && (
              <span className='relative shrink-0 overflow-hidden bg-[#d9d9d9]' style={{ width: t(92), height: t(88), borderRadius: t(4) }}>
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
function OffersRow({ restaurantOffers, bankOffers, merchant }: { restaurantOffers: OfferBody[]; bankOffers: OfferBody[]; merchant: MerchantCapabilityFields }) {
  const plan = useUserPlan()
  const pct = getCashbackPct(merchant, plan)
  const cards: React.ReactNode[] = []
  if (restaurantOffers.length) {
    cards.push(
      <PagerCard
        key='exclusive'
        items={restaurantOffers}
        head={
          <span className='flex items-center uppercase' style={{ gap: t(16) }}>
            <Image src={`${A}/offer-diamond.png`} alt='' width={36} height={31} style={{ width: t(36), height: t(31) }} />
            <span className='font-bold text-[#ff4800]' style={{ fontSize: t(24) }}>Restaurant exclusive</span>
          </span>
        }
      />,
    )
  }
  if (pct > 0) {
    cards.push(
      <OfferCard key='cashback' compact>
        <Image src={MEMBERSHIP_BADGE[plan]} alt='' width={133} height={57} className='w-auto self-start' style={{ height: t(57) }} />
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
          <span className='flex items-center uppercase' style={{ gap: t(16) }}>
            <WalletIcon />
            <span className='font-bold text-[#7c2d12]' style={{ fontSize: t(24) }}>Bank &amp; card offers</span>
          </span>
        }
      />,
    )
  }
  if (!cards.length) return null
  return (
    <Section id='offers' title='Offers for today' top={60}>
      <div className='flex items-center'>
        {cards.map((card, i) => (
          <div key={i} className='flex items-center'>
            {card}
            {i < cards.length - 1 && (
              <span
                className='relative z-10 flex shrink-0 items-center justify-center rounded-full bg-[#767677] font-bold text-white'
                style={{ width: t(36.8), height: t(36.8), margin: `0 ${t(-5.4)}`, fontSize: t(24.5) }}
              >
                +
              </span>
            )}
          </div>
        ))}
      </div>
    </Section>
  )
}

type Piece = {
  card: string; left: number; top: number; rot: number
  oLeft: number; oTop: number; oRot: number
  label: string; labelColor: string; labelLeft: number; labelTop: number; labelSize: number
  icon: string; iconLeft: number; iconTop: number; iconSize: number; iconRot: number
}

// the six menu cards on the banner, placed as in the 1576×200 frame
const MENU_PIECES: Piece[] = [
  { card: 'menu-card-7.svg', left: 318, top: 89, rot: -17.55, oLeft: 322, oTop: 89, oRot: -22.18, label: 'Food', labelColor: '#33363f', labelLeft: 368, labelTop: 207, labelSize: 22.9, icon: 'menu-burger-2.svg', iconLeft: 345.6, iconTop: 121.9, iconSize: 51.6, iconRot: -22.39 },
  { card: 'menu-card-6.svg', left: 462.6, top: 35, rot: 11.29, oLeft: 479.3, oTop: 35.4, oRot: 6.65, label: 'Food', labelColor: '#5e89e7', labelLeft: 482.4, labelTop: 151, labelSize: 20, icon: 'menu-burger.svg', iconLeft: 501.4, iconTop: 67.4, iconSize: 51.6, iconRot: 6.45 },
  { card: 'menu-card-5.svg', left: 608.1, top: -30, rot: -5.66, oLeft: 616, oTop: -30.1, oRot: -2.64, label: 'Bar', labelColor: '#5e89e7', labelLeft: 651.1, labelTop: 90.6, labelSize: 20, icon: 'menu-drink.svg', iconLeft: 639, iconTop: 2.1, iconSize: 51.6, iconRot: -0.31 },
  { card: 'menu-card-4.svg', left: 750.1, top: 56.3, rot: 5.26, oLeft: 762.9, oTop: 56, oRot: 0.62, label: 'Beverages', labelColor: '#5e89e7', labelLeft: 758.3, labelTop: 176.3, labelSize: 20, icon: 'menu-cocktail.svg', iconLeft: 785.4, iconTop: 84.7, iconSize: 51.6, iconRot: 0.15 },
  { card: 'menu-card-2.svg', left: 924.4, top: 14.4, rot: 1.85, oLeft: 935.8, oTop: 14.1, oRot: -2.79, label: 'Special', labelColor: '#5e89e7', labelLeft: 950.3, labelTop: 136, labelSize: 20, icon: 'menu-diamond.svg', iconLeft: 961.4, iconTop: 47.5, iconSize: 44.6, iconRot: -3.2 },
  { card: 'menu-card-3.svg', left: 1081.2, top: 63.9, rot: -6.59, oLeft: 1089.2, oTop: 63.7, oRot: -11.23, label: 'Special', labelColor: '#33363f', labelLeft: 1107.9, labelTop: 182.6, labelSize: 22.9, icon: 'menu-diamond-2.svg', iconLeft: 1114.5, iconTop: 97.4, iconSize: 44.6, iconRot: -11.64 },
]

function MenuBanner() {
  const { openAt } = useMenuGallery()
  return (
    <button
      type='button'
      onClick={() => openAt(0)}
      aria-label='Check out the menu'
      className='relative block w-full overflow-hidden text-left'
      style={{ height: u(200), borderRadius: u(24), backgroundImage: 'linear-gradient(90deg, #122a5e 0%, #2247ff 150.28%)' }}
    >
      {MENU_PIECES.map(p => (
        <span key={p.card} aria-hidden='true'>
          <Image src={`${A}/${p.card}`} alt='' width={120} height={159} className='absolute max-w-none' style={{ left: u(p.left), top: u(p.top), width: u(120.4), height: u(159.3), rotate: `${p.rot}deg` }} />
          <span className='absolute bg-linear-to-b from-[#ff4800] to-[#dc4104]' style={{ left: u(p.oLeft), top: u(p.oTop), width: u(98.25), height: u(113.5), borderRadius: u(2.07), rotate: `${p.oRot}deg` }} />
          <span className={`absolute font-bold whitespace-nowrap italic ${SERIF}`} style={{ left: u(p.labelLeft), top: u(p.labelTop), fontSize: u(p.labelSize), letterSpacing: u(-1.2), color: p.labelColor, rotate: `${p.rot}deg` }}>
            {p.label}
          </span>
          <Image src={`${A}/${p.icon}`} alt='' width={52} height={52} className='absolute max-w-none' style={{ left: u(p.iconLeft), top: u(p.iconTop), width: u(p.iconSize), height: u(p.iconSize), rotate: `${p.iconRot}deg` }} />
        </span>
      ))}
      <Image src={`${A}/menu-glow.svg`} alt='' width={596} height={314} aria-hidden='true' className='absolute max-w-none' style={{ left: u(514.2 - 50), top: u(100 - 50), width: u(596), height: u(314) }} />
      <span
        className='absolute flex -translate-x-1/2 items-center rounded-full bg-white font-extrabold whitespace-nowrap text-[#2247ff] drop-shadow-[0_12px_14px_rgba(0,0,0,0.1)]'
        style={{ left: '50%', top: u(132), height: u(48), width: u(264), paddingLeft: u(22), gap: u(6), fontSize: u(24) }}
      >
        Check out Menu
        <Image src={`${A}/menu-arrow.svg`} alt='' width={32} height={32} style={{ width: u(32), height: u(32) }} />
      </span>
    </button>
  )
}

function PhotosGrid({ photos }: { photos: string[] }) {
  const { openAt } = useGallery()
  const tiles = photos.slice(1, 9)
  const hidden = photos.length - 1 - tiles.length
  return (
    <div className='flex' style={{ gap: u(16) }}>
      <button type='button' onClick={() => openAt(0)} className='group relative shrink-0 overflow-hidden bg-[#e1e1e1]' style={{ width: u(868), height: u(336), borderRadius: u(22.9) }} aria-label='View photos'>
        <Image src={photos[0]} alt='' fill sizes='868px' className='object-cover transition-transform duration-500 group-hover:scale-[1.03]' />
      </button>
      {tiles.length > 0 && (
        <div className='grid grid-flow-col grid-rows-2' style={{ columnGap: u(12), rowGap: u(12) }}>
          {tiles.map((src, i) => {
            const last = i === tiles.length - 1 && hidden > 0
            return (
              <button
                key={src + i}
                type='button'
                onClick={() => openAt(i + 1)}
                className='group relative overflow-hidden bg-[#e1e1e1]'
                style={{ width: u(164), height: u(162), borderRadius: u(24) }}
                aria-label={last ? `View all ${photos.length} photos` : `View photo ${i + 2}`}
              >
                <Image src={src} alt='' fill sizes='164px' className='object-cover transition-transform duration-500 group-hover:scale-[1.05]' />
                {last && (
                  <span className='absolute inset-0 flex items-center justify-center bg-[#b5b5b5]/85 font-semibold text-[#fffbff]' style={{ fontSize: u(27.75), letterSpacing: u(1.66) }}>
                    +{hidden}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
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
    <article className='flex shrink-0 snap-start flex-col bg-[#ebebeb]' style={{ width: t(505), minHeight: t(323), paddingLeft: t(30.6), borderRadius: t(30.6) }}>
      <div className='flex items-start' style={{ gap: t(23), padding: `${t(39)} ${t(30.6)} ${t(15.3)} 0` }}>
        <span className='flex shrink-0 items-center justify-center rounded-full bg-[#FFD9C7] font-bold text-[#B33A00]' style={{ width: t(57.4), height: t(57.4), fontSize: t(23) }}>
          {name.charAt(0).toUpperCase()}
        </span>
        <span className='flex min-w-0 flex-1 flex-col font-medium'>
          <span className='truncate text-[#303030]' style={{ fontSize: t(23), lineHeight: t(30.6) }}>{name}</span>
          <span className='text-[#666]' style={{ fontSize: t(21), lineHeight: t(30.6) }}>{reviewDate(review.created_at)}</span>
        </span>
        <span className='flex shrink-0 items-center rounded-full bg-[#00752e] font-bold text-white' style={{ padding: `${t(3.8)} ${t(11.5)}`, gap: t(3.8), fontSize: t(23), lineHeight: t(30.6), letterSpacing: t(0.96) }}>
          {Number(review.rating).toFixed(1)}
          <Image src={`${A}/review-star.svg`} alt='' width={19} height={19} style={{ width: t(19), height: t(19) }} />
        </span>
      </div>
      {text && (
        <p className='text-[#666]' style={{ fontSize: t(23), lineHeight: t(30.6), padding: `0 ${t(30.6)} ${t(30.6)} 0` }}>
          <span className={cn(!open && 'line-clamp-4')}>{text}</span>
          {text.length > 150 && (
            <button type='button' onClick={() => setOpen(v => !v)} className='ml-1 text-[#252424] underline'>
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
 * Restaurant detail sections on desktop — Figma "Dining - Pay Bill": Offers
 * for today, Deals & cashback, the menu banner, photos, reviews (+ "Leave a review"), About
 * the Restaurant and Amenities, type and cards in `t`, the menu banner and photo grid in `u`. Sections carry
 * `data-section` so the sticky tabs find them; phones use the app layout.
 */
export function RestaurantDesktopSections({
  restaurantId,
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
  const aspects = [
    { label: 'Food', value: aspect(reviews, 'food_rating') },
    { label: 'Service', value: aspect(reviews, 'service_rating') },
    { label: 'Ambience', value: aspect(reviews, 'ambience_rating') },
  ].filter(a => a.value != null)
  const ratingCount = summary.count >= 1000 ? `${(summary.count / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(summary.count)
  const about = [
    highlights && { title: 'Restaurant highlights', body: highlights },
    worthIt && { title: 'What makes it worth it', body: worthIt },
    description && { title: `About ${name}`, body: description },
  ].filter((a): a is { title: string; body: string } => !!a)

  return (
    <div className='hidden font-(family-name:--font-dm-sans) md:block' style={{ paddingBottom: t(126) }}>
      <OffersRow restaurantOffers={restaurantOffers} bankOffers={bankOffers} merchant={merchant} />

      {/* member deals + receipt cashback, as offer cards; the section hides until one loads */}
      <Section id='deals' title='Deals & cashback' top={84} className='[&:not(:has([data-offer-card]))]:hidden'>
        <Rail gap={26}>
          <DealRevealSection restaurantId={restaurantId} merchantName={name} variant='figma' />
          <ReceiptCashbackBanner merchant={{ ...merchant, id: restaurantId }} kind='restaurant' variant='figma' />
        </Rail>
      </Section>

      {menuImages.length > 0 && (
        <Section id='menu' title='Menu' top={84}>
          <MenuGalleryProvider images={menuImages}>
            <MenuBanner />
          </MenuGalleryProvider>
        </Section>
      )}

      {photos.length > 0 && (
        <Section id='gallery' title='Photos' top={63}>
          <PhotosGrid photos={photos} />
        </Section>
      )}

      <Section id='reviews' title='Reviews' top={70}>
        {summary.count > 0 && (
          <div className='flex items-center' style={{ height: t(80), marginBottom: t(36) }}>
            <div className='flex flex-col items-center' style={{ width: t(112), marginRight: t(108) }}>
              <span className={`flex items-center justify-center rounded-full bg-[#007c40] font-bold text-white ${INTER}`} style={{ width: t(112), height: t(48.7), gap: t(8), fontSize: t(28), letterSpacing: t(0.53) }}>
                {summary.avg.toFixed(1)}
                <Image src={`${A}/rating-star-lg.svg`} alt='' width={20} height={18} style={{ width: t(20), height: t(18) }} />
              </span>
              <span className='font-medium text-[#8b898d] underline' style={{ fontSize: t(16), lineHeight: t(22), marginTop: t(4) }}>{ratingCount} ratings</span>
            </div>
            {aspects.map(a => (
              <div key={a.label} className='flex h-full items-center'>
                <span className='h-full rounded-lg bg-[#8b898d]' style={{ width: t(2) }} />
                <div className='flex flex-col items-center font-medium' style={{ padding: `0 ${t(44)}` }}>
                  <span className='font-semibold text-[#443c44]' style={{ fontSize: t(24), lineHeight: t(32), letterSpacing: t(1), padding: `${t(4)} ${t(12)}` }}>{a.value!.toFixed(1)}</span>
                  <span className='text-[#8b898d]' style={{ fontSize: t(24), lineHeight: t(32) }}>{a.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {reviews.length > 0 ? (
          <Rail gap={28}>
            {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
          </Rail>
        ) : (
          <p className='text-[#767677]' style={{ fontSize: t(24) }}>No reviews yet — be the first to share your experience at {name}.</p>
        )}
        <div style={{ marginTop: t(32) }}>
          <LeaveReviewDialog kind='restaurant' entityId={restaurantId} entityName={name} variant='figma' />
        </div>
      </Section>

      {about.length > 0 && (
        <Section id='about-desktop' title='About the Restaurant' top={100} gap={34}>
          <Rail gap={28}>
            {about.map(a => (
              <article
                key={a.title}
                className='flex shrink-0 snap-start flex-col justify-center bg-white drop-shadow-[0_8px_23.8px_rgba(0,0,0,0.1)]'
                style={{ width: t(528), height: t(266), padding: `0 ${t(32)}`, borderRadius: t(32), gap: t(16) }}
              >
                <h3 className='font-extrabold text-[#303030]' style={{ fontSize: t(24), lineHeight: t(32) }}>{a.title}</h3>
                <p className='line-clamp-4 text-[#454545]' style={{ fontSize: t(24), lineHeight: t(32) }}>{a.body}</p>
              </article>
            ))}
          </Rail>
        </Section>
      )}

      {amenities.length > 0 && (
        <Section id='amenities' title='Amenities' top={64} gap={52}>
          <ul className='flex flex-wrap text-[#505050]' style={{ columnGap: t(92), rowGap: t(36), fontSize: t(32), lineHeight: t(32.5) }}>
            {amenities.map(a => (
              <li key={a} className='flex items-center whitespace-nowrap' style={{ gap: t(18), paddingLeft: t(12) }}>
                <span className='shrink-0 rounded-full bg-[#505050]' style={{ width: t(6), height: t(6) }} />
                {a}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}
