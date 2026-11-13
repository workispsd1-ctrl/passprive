'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Heart, Lock, SlidersHorizontal } from 'lucide-react'
import { BankOffersSection } from '@/components/sections/dining/BankOffersSection'
import { FilterDialog, type FilterDraft } from '@/components/sections/dining/FilterDialog'
import { SaveListSheet } from '@/components/SaveListSheet'
import { canPayBill, getCashbackPct } from '@/lib/cashback'
import { useSaved } from '@/lib/context/SavedContext'
import { useUserPlan } from '@/lib/context/PlanContext'
import { COST_BUCKETS, distanceKm } from '@/lib/restaurantFilters'
import { giftLabel, stampProgress } from '@/lib/stamps'
import { NOTCH_PATH } from '@/components/sections/stamps/stampUi'
import { cn, formatDistanceKm } from '@/lib/utils'
import type { DealCard, DealGroup, ExclusiveDeal, GreatDealsData, StampDeal } from '@/lib/services/greatDeals'
import { GD_PAGE } from './unit'

/*
 * Figma "Great deals — Desktop 1920" on top of the app's DealsScreen data.
 * Every desktop class is the exact Figma value in design px (`--u`, see
 * unit.ts); `max-lg:` is the phone layout in real px.
 */

const PERCENT = '/assets/deals/percent.webp'
const GROUP_ICON: Record<DealGroup, string> = {
  dining: '/assets/search/dining.webp',
  shopping: '/assets/search/shopping.webp',
  wellness: '/assets/search/wellness.webp',
}
/** app parity: OffersBrowser / DealsScreen `qualifies` — within 15 km when a location is known */
const RADIUS_KM = 15

const TITLE = 'text-[calc(24*var(--u))] leading-[calc(32*var(--u))] font-bold text-[#383838] max-lg:text-[20px] max-lg:leading-[28px]'
const SECTION = 'flex flex-col gap-16 max-lg:gap-12'

// ─── Hero ────────────────────────────────────────────────────────────────

/** Figma hero artwork (gradient, 3D percent signs and the "Great Deals" lettering) — 1920×420. */
function Hero() {
  return (
    <section className='relative h-420 overflow-hidden rounded-b-[calc(24*var(--u))] bg-[#FF4800] max-lg:h-[200px] max-lg:rounded-b-[20px]'>
      <Image src='/assets/deals/great-deals-hero.webp' alt='' fill priority sizes='100vw' className='object-cover' />
      <h1 className='sr-only'>Great Deals</h1>
    </section>
  )
}

// ─── Shared bits ─────────────────────────────────────────────────────────

/** Horizontal rail with a title; arrows on desktop, swipe on phones. Desktop cards are clipped at the 1576 content column (Figma); phones scroll to the screen edge. */
function Rail({ title, head, children, gap = 'gap-24 max-lg:gap-12' }: { title?: string; head?: ReactNode; children: ReactNode; gap?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])
  // one full page of cards (the visible width plus the gap after it), so a page turn lands on a card edge
  const by = (dir: number) => {
    const el = ref.current
    if (!el) return
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    el.scrollBy({ left: dir * (el.clientWidth + gap), behavior: 'smooth' })
  }
  const arrow =
    'absolute top-1/2 z-10 hidden size-44 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#1F1F1F] shadow-[0_calc(4*var(--u))_calc(4*var(--u))_rgba(0,0,0,0.25)] hover:text-black lg:flex'
  return (
    <section className={SECTION}>
      {head ?? <h2 className={TITLE}>{title}</h2>}
      <div className='relative'>
        <button type='button' aria-label='Scroll left' onClick={() => by(-1)} className={cn(arrow, '-left-22', !edges.left && 'lg:hidden')}>
          <ChevronLeft className='size-24' />
        </button>
        <div
          ref={ref}
          className={cn(
            'scrollbar-hide -my-16 flex snap-x overflow-x-auto py-16 [scrollbar-width:none] max-lg:-mx-16 max-lg:scroll-px-16 max-lg:px-16 [&::-webkit-scrollbar]:hidden',
            gap,
          )}
        >
          {children}
        </div>
        <button type='button' aria-label='Scroll right' onClick={() => by(1)} className={cn(arrow, '-right-22', !edges.right && 'lg:hidden')}>
          <ChevronRight className='size-24' />
        </button>
      </div>
    </section>
  )
}

/** Splits "Flat 15% OFF + bank benefits" into a bold head and a regular tail. */
function OfferText({ text }: { text: string }) {
  const i = text.indexOf(' + ')
  if (i === -1) return <span className='font-bold'>{text}</span>
  return (
    <>
      <span className='font-bold'>{text.slice(0, i)}</span>
      <span className='font-normal'>{text.slice(i)}</span>
    </>
  )
}

function SaveHeart({ card, className, iconClassName }: { card: DealCard; className: string; iconClassName: string }) {
  const { isSaved, toggle, setSaved } = useSaved()
  const [open, setOpen] = useState(false)
  const saved = isSaved(card.id)
  const type = card.kind === 'restaurant' ? 'RESTAURANT' : 'STORE'
  return (
    <>
      <button
        type='button'
        aria-label={saved ? 'Edit saved lists' : 'Save'}
        aria-pressed={saved}
        onClick={async (e) => {
          e.preventDefault()
          if (!saved && (await toggle(card.id, type)) === null) return // logged out — login prompt shown
          setOpen(true)
        }}
        className={cn('absolute z-20 transition-transform hover:scale-110', className)}
      >
        <Heart
          className={cn(iconClassName, saved ? 'fill-[#FF4800] text-[#FF4800]' : 'fill-black/30 text-[#E5E5E5]')}
          strokeWidth={2.3}
        />
      </button>
      <SaveListSheet
        open={open}
        onClose={() => setOpen(false)}
        entityId={card.id}
        entityType={type}
        entityName={card.name}
        onSavedChange={(anywhere) => setSaved(card.id, anywhere)}
      />
    </>
  )
}

// ─── Restaurant / store offer card (776×393 rail, 509×410 grid) ──────────

function OfferCard({ card, variant }: { card: DealCard; variant: 'wide' | 'grid' }) {
  const plan = useUserPlan()
  const pct = getCashbackPct(card.caps, plan)
  const dist = formatDistanceKm(card.distanceKm)
  const wide = variant === 'wide'
  const meta = [dist, card.area].filter(Boolean).join(' • ')
  const cost = card.costForTwo ? `Rs.${card.costForTwo.toLocaleString('en-IN')} for two` : null
  const line3 = [card.tagline, cost].filter(Boolean).join(' • ')
  const offer = card.offers[0]
  const more = card.offers.length - 1

  return (
    <div
      className={cn(
        'relative shrink-0 snap-start border border-white bg-white font-(family-name:--font-dm-sans) [filter:drop-shadow(0_calc(4*var(--u))_calc(13*var(--u))_rgba(0,0,0,0.12))] max-lg:rounded-[18px] max-lg:p-[8px] max-lg:pb-[12px]',
        wide
          ? 'w-776 rounded-[calc(17.69*var(--u))] px-8 pt-12 pb-14 max-lg:w-[300px]'
          : 'w-full rounded-[calc(18.46*var(--u))] px-10 pt-13 pb-14',
      )}
    >
      <Link href={card.href} aria-label={card.name} className='absolute inset-0 z-10' />
      <div className={cn('overflow-hidden bg-[#FF6A30] max-lg:rounded-[14px]', wide ? 'rounded-[calc(14*var(--u))]' : 'rounded-[calc(14.61*var(--u))]')}>
        <div
          className={cn(
            'relative overflow-hidden bg-[#EBEBEB] max-lg:rounded-[14px]',
            wide ? 'rounded-[calc(14*var(--u))]' : 'rounded-[calc(14.64*var(--u))]',
            offer ? (wide ? 'h-230' : 'h-240') : wide ? 'h-251' : 'h-262',
            offer ? 'max-lg:h-[170px]' : 'max-lg:h-[189px]',
          )}
        >
          {card.image && <Image src={card.image} alt='' fill sizes='(min-width: 1024px) 40vw, 300px' className='object-cover' />}
          {pct > 0 && (
            <span className='absolute top-13 left-8 flex h-33 items-center gap-6 rounded-full bg-white/77 pr-12 pl-4 [filter:drop-shadow(calc(2.3*var(--u))_calc(2.3*var(--u))_calc(4.6*var(--u))_rgba(0,0,0,0.15))] max-lg:top-[8px] max-lg:left-[8px] max-lg:h-[26px] max-lg:gap-[4px] max-lg:pr-[8px] max-lg:pl-[3px]'>
              <span aria-hidden className='size-[calc(27.6*var(--u))] rounded-full bg-[radial-gradient(circle_at_35%_30%,#FFB27A,#E8521A_60%,#B83A0C)] shadow-[inset_0_0_0_calc(2*var(--u))_rgba(255,214,170,0.7)] max-lg:size-[20px]' />
              <span className='text-[calc(13.8*var(--u))] leading-[calc(21*var(--u))] font-medium text-[#1D1B20] max-lg:text-[11px] max-lg:leading-[16px]'>{pct}% Cashback</span>
            </span>
          )}
          <SaveHeart card={card} className='top-8 right-8 max-lg:top-[8px] max-lg:right-[8px]' iconClassName='size-32 max-lg:size-[24px]' />
        </div>
        {offer ? (
          <div className='flex h-26 items-center justify-between gap-12 px-14 text-white max-lg:h-[24px] max-lg:px-[10px]'>
            <span className='truncate text-[calc(16*var(--u))] leading-[calc(21*var(--u))] max-lg:text-[12px] max-lg:leading-[16px]'>
              <OfferText text={offer} />
            </span>
            {more > 0 && (
              <span className='shrink-0 text-[calc(16*var(--u))] leading-[calc(21*var(--u))] font-bold max-lg:text-[12px]'>+ {more} offer{more > 1 ? 's' : ''}</span>
            )}
          </div>
        ) : (
          // no offer: only the frame's orange edge shows under the photo — app parity: NowTrending NO_OFFER_STRIP_H
          <div className='h-5 max-lg:h-[5px]' />
        )}
      </div>

      <div className='px-7 pt-8 max-lg:px-[6px] max-lg:pt-[8px]'>
        <div className='flex items-start justify-between gap-12'>
          <p className={cn('truncate font-bold text-[#383838] max-lg:text-[15px] max-lg:leading-[22px]', wide ? 'text-[calc(18.4*var(--u))] leading-[calc(28*var(--u))]' : 'text-[calc(19.2*var(--u))] leading-[calc(29*var(--u))]')}>
            {card.name}
          </p>
          {card.rating > 0 && (
            <span className='mt-4 flex h-24 shrink-0 items-center gap-3 rounded-full bg-[#217C00] px-8 text-[calc(13.8*var(--u))] leading-[calc(21*var(--u))] font-bold text-white max-lg:h-[20px] max-lg:px-[6px] max-lg:text-[11px]'>
              {card.rating.toFixed(1)} <span aria-hidden>★</span>
            </span>
          )}
        </div>
        {meta && <p className={cn('truncate font-medium text-[#717171] max-lg:text-[12px] max-lg:leading-[18px]', wide ? 'text-[calc(16.1*var(--u))] leading-[calc(23*var(--u))]' : 'text-[calc(16.68*var(--u))] leading-[calc(24*var(--u))]')}>{meta}</p>}
        {line3 && <p className={cn('truncate font-medium text-[#717171] max-lg:text-[12px] max-lg:leading-[18px]', wide ? 'text-[calc(16.1*var(--u))] leading-[calc(23*var(--u))]' : 'text-[calc(16.68*var(--u))] leading-[calc(24*var(--u))]')}>{line3}</p>}
        {(card.stampSheet || card.trending) && (
          <div className='mt-8 flex gap-8 max-lg:mt-[6px] max-lg:gap-[6px]'>
            {card.stampSheet && <Image src='/assets/chips/stamp-sheet.webp' alt='Stamp sheet' width={388} height={84} className='h-24 w-auto max-lg:h-[20px]' />}
            {card.trending && <Image src='/assets/chips/trending.webp' alt='Trending' width={292} height={84} className='h-24 w-auto max-lg:h-[20px]' />}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── "Best offers for you" pay-bill card (509×340) ───────────────────────

/** Green "0.5% Cashback" pill: translucent mint on white with an inner highlight. */
function CashbackPill({ pct }: { pct: number }) {
  return (
    <span className='flex h-32 items-center rounded-full bg-[linear-gradient(rgba(192,248,200,0.4),rgba(192,248,200,0.4)),linear-gradient(#fff,#fff)] px-7 text-[calc(15.4*var(--u))] leading-[calc(22*var(--u))] font-semibold text-[#19482C] shadow-[inset_0_calc(5.6*var(--u))_calc(5.6*var(--u))_#ECFBF0] [filter:drop-shadow(calc(2.8*var(--u))_calc(2.8*var(--u))_calc(5.6*var(--u))_rgba(0,0,0,0.2))] max-lg:h-[24px] max-lg:px-[8px] max-lg:text-[11px]'>
      {pct}% Cashback
    </span>
  )
}

function PayBillCard({ card }: { card: DealCard }) {
  const plan = useUserPlan()
  const pct = getCashbackPct(card.caps, plan)
  const pay = canPayBill(card.caps)
  const dist = formatDistanceKm(card.distanceKm)
  return (
    <div className='relative flex h-340 w-[calc((100%-48*var(--u))/3)] shrink-0 snap-start flex-col rounded-[calc(25.2*var(--u))] bg-white p-8 font-(family-name:--font-dm-sans) shadow-[0_calc(4*var(--u))_calc(13*var(--u))_rgba(0,0,0,0.12)] max-lg:h-auto max-lg:w-[280px] max-lg:rounded-[20px] max-lg:p-[8px]'>
      <Link href={card.href} aria-label={card.name} className='absolute inset-0 z-1' />
      <div className='overflow-hidden rounded-[calc(19.6*var(--u))] bg-[#FF4800] max-lg:rounded-[16px]'>
        <div className={cn('relative overflow-hidden rounded-[calc(19.6*var(--u))] bg-[#EBEBEB] max-lg:rounded-[16px]', card.offers[0] ? 'h-179 max-lg:h-[140px]' : 'h-202 max-lg:h-[159px]')}>
          {card.image && <Image src={card.image} alt='' fill sizes='(min-width: 1024px) 27vw, 280px' className='object-cover' />}
          <Image src='/assets/search/card-bg.webp' alt='' width={73} height={68} className='absolute top-0 left-0 h-80 w-85 max-lg:h-[60px] max-lg:w-[64px]' />
          <Image src={GROUP_ICON[card.group]} alt='' width={36} height={40} className='absolute top-3 left-7 h-40 w-36 object-contain object-left [filter:drop-shadow(0_calc(2*var(--u))_calc(2*var(--u))_rgba(0,0,0,0.1))] max-lg:top-[2px] max-lg:left-[6px] max-lg:h-[30px] max-lg:w-[27px]' />
          {pct > 0 && <span className='absolute top-6 left-63 max-lg:top-[6px] max-lg:left-[48px]'><CashbackPill pct={pct} /></span>}
        </div>
        {card.offers[0] ? (
          <p className='flex h-28 items-center truncate px-16 text-[calc(16*var(--u))] leading-[calc(20*var(--u))] text-white max-lg:h-[24px] max-lg:px-[10px] max-lg:text-[12px]'>
            <span className='truncate'><OfferText text={card.offers.length > 1 ? `${card.offers[0]} + more` : card.offers[0]} /></span>
          </p>
        ) : (
          <div className='h-5 max-lg:h-[5px]' />
        )}
      </div>
      <p className='mt-13 truncate px-8 text-[calc(19.6*var(--u))] leading-[calc(26*var(--u))] font-bold text-[#1D1B20] max-lg:mt-[8px] max-lg:px-[4px] max-lg:text-[15px] max-lg:leading-[22px]'>{card.name}</p>
      <p className='mt-5 h-20 truncate px-8 text-[calc(15.4*var(--u))] leading-[calc(20*var(--u))] text-[#605D64] max-lg:mt-[2px] max-lg:px-[4px] max-lg:text-[12px]'>{dist}</p>
      <Link
        href={pay ? card.payHref : card.href}
        className={cn(
          'relative z-2 mx-8 mt-5 flex h-42 items-center justify-center rounded-full border border-[#FF4800] text-[calc(16*var(--u))] leading-[calc(19*var(--u))] font-semibold transition-colors max-lg:mx-[4px] max-lg:mt-[8px] max-lg:h-[38px] max-lg:text-[14px]',
          pay ? 'bg-[#FF4800] text-white hover:bg-[#E64200]' : 'bg-white text-[#FF4800] hover:bg-[#FFF3EE]',
        )}
      >
        {pay ? 'Pay bill' : 'View'}
      </Link>
    </div>
  )
}

// ─── "More offers" coupons (509×206) ─────────────────────────────────────

/** Ticket edges: a half-circle bite out of each side, centred 142 design px down. */
const TICKET_MASK: CSSProperties = {
  WebkitMask:
    'radial-gradient(circle at 0 var(--y), transparent var(--r), #000 calc(var(--r) + 0.5px)) left / 51% 100% no-repeat, radial-gradient(circle at 100% var(--y), transparent var(--r), #000 calc(var(--r) + 0.5px)) right / 51% 100% no-repeat',
  mask: 'radial-gradient(circle at 0 var(--y), transparent var(--r), #000 calc(var(--r) + 0.5px)) left / 51% 100% no-repeat, radial-gradient(circle at 100% var(--y), transparent var(--r), #000 calc(var(--r) + 0.5px)) right / 51% 100% no-repeat',
}

const COUPONS = [
  { key: 'p40', label: 'Get up to 40% off — see all', src: '/assets/deals/coupon-40.webp', href: '?min=40#all-offers' },
  { key: 'rewards', label: 'Collect rewards — see all', src: '/assets/deals/coupon-rewards.webp', href: '/visit-rewards' },
  { key: 'p30', label: 'Get up to 30% off — see all', src: '/assets/deals/coupon-30.webp', href: '?min=30#all-offers' },
] as const

/** Figma coupon artwork, cropped to the 509×206 card body; the Figma shadow is drawn in CSS so nothing overhangs the rail. */
function CouponCard({ c }: { c: (typeof COUPONS)[number] }) {
  return (
    <Link
      href={c.href}
      aria-label={c.label}
      className='relative block h-206 w-[calc((100%-48*var(--u))/3)] shrink-0 snap-start [filter:drop-shadow(0_calc(6.2*var(--u))_calc(7.9*var(--u))_rgba(0,0,0,0.08))] transition-transform hover:-translate-y-2 max-lg:h-[113px] max-lg:w-[280px]'
    >
      <Image src={c.src} alt='' fill sizes='(min-width: 1024px) 27vw, 280px' className='object-fill' />
    </Link>
  )
}

// ─── "Collect stamps for rewards" (509×343) ──────────────────────────────

function StampDealCard({ card }: { card: StampDeal }) {
  const { visits, total, complete } = stampProgress(card)
  return (
    <Link
      href={card.href}
      className='relative flex h-343 w-[calc((100%-48*var(--u))/3)] shrink-0 snap-start flex-col overflow-hidden rounded-[calc(24*var(--u))] bg-white font-(family-name:--font-dm-sans) shadow-[0_calc(5.6*var(--u))_calc(16.8*var(--u))_rgba(0,0,0,0.05)] max-lg:h-auto max-lg:w-[260px] max-lg:rounded-[18px]'
    >
      <span className='relative block h-154 shrink-0 bg-[#EBEBEB] max-lg:h-[130px]'>
        <Image src={card.image} alt='' fill sizes='(min-width: 1024px) 27vw, 260px' className='object-cover' />
        <span className='absolute bottom-0 left-0 h-81 w-87 max-lg:h-[56px] max-lg:w-[60px]'>
          <svg viewBox='0 0 62 58' className='absolute inset-0 size-full' aria-hidden='true'>
            <path d={NOTCH_PATH} fill='#fff' />
          </svg>
          <Image src={GROUP_ICON[card.group]} alt='' width={36} height={40} className='absolute top-[46%] left-[16%] h-[48%] w-[38%] object-contain' />
        </span>
      </span>
      <span className='block truncate px-17 pt-17 text-[calc(19.6*var(--u))] leading-[calc(26*var(--u))] font-bold text-[#1D1B20] max-lg:px-[12px] max-lg:pt-[10px] max-lg:text-[15px] max-lg:leading-[22px]'>{card.name}</span>
      <span className='mt-5 block h-20 truncate px-17 text-[calc(15.4*var(--u))] leading-[calc(20*var(--u))] text-[#605D64] max-lg:mt-[2px] max-lg:px-[12px] max-lg:text-[12px]'>{card.location}</span>
      <span className='mt-17 block h-[calc(1.4*var(--u))] bg-[#E5E7EB] max-lg:mt-[10px] max-lg:h-px' />
      <span className='flex items-center gap-8 px-14 pt-15 max-lg:px-[12px] max-lg:pt-[10px]'>
        <Image src='/assets/stamps/repeat-reward.webp' alt='' width={88} height={102} className='h-33 w-24 object-contain max-lg:h-[24px] max-lg:w-[18px]' />
        <span className='flex-1 text-[calc(16.8*var(--u))] leading-[calc(22*var(--u))] font-semibold text-[#2C2D32] max-lg:text-[13px]'>
          {visits} / {total} visits
        </span>
        <Lock className={cn('size-27 max-lg:size-[18px]', complete ? 'text-[#F2620F]' : 'text-[#454040]')} strokeWidth={2} />
      </span>
      <span className='mx-14 mt-12 mb-14 inline-flex h-31 w-fit max-w-[calc(100%-28*var(--u))] items-center truncate rounded-full bg-[rgba(242,98,15,0.1)] px-11 text-[calc(15.4*var(--u))] leading-[calc(20*var(--u))] font-bold text-[#F2620F] max-lg:mx-[12px] max-lg:mt-[8px] max-lg:mb-[12px] max-lg:h-[26px] max-lg:px-[10px] max-lg:text-[12px]'>
        {giftLabel(card)}
      </span>
    </Link>
  )
}

// ─── "Exclusive deals" brand coupons (509×280) ───────────────────────────

const EXCLUSIVE_FOOTERS = ['bg-[#CB081E]', 'bg-black'] as const

function ExclusiveCard({ deal, index }: { deal: ExclusiveDeal; index: number }) {
  return (
    <Link
      href={deal.href}
      style={TICKET_MASK}
      className='relative flex h-280 w-[calc((100%-48*var(--u))/3)] shrink-0 snap-start flex-col items-center overflow-hidden rounded-[calc(22.4*var(--u))] bg-[#F6F3EE] font-(family-name:--font-dm-sans) shadow-[inset_0_0_calc(5.6*var(--u))_rgba(0,0,0,0.25)] [--r:calc(14.5*var(--u))] [--y:calc(134.4*var(--u))] max-lg:h-[230px] max-lg:w-[280px] max-lg:rounded-[18px] max-lg:[--r:12px] max-lg:[--y:110px]'
    >
      <span className='mt-11 flex items-center gap-8 text-[calc(11.2*var(--u))] leading-[calc(17*var(--u))] font-bold tracking-[0.08em] text-[#BF9531] max-lg:mt-[8px] max-lg:text-[10px]'>
        <span aria-hidden>✦ ——</span> EXCLUSIVE <span aria-hidden>—— ✦</span>
      </span>
      <span className='relative mt-2 h-58 w-92 max-lg:h-[46px] max-lg:w-[74px]'>
        <Image src={deal.logo} alt={deal.name} fill sizes='92px' className='object-contain' />
      </span>
      <span className='mt-10 max-w-[90%] truncate text-[calc(14*var(--u))] leading-[calc(22*var(--u))] font-bold text-[#2C2D32] uppercase max-lg:mt-[6px] max-lg:text-[12px]'>{deal.name}</span>
      <span aria-hidden className='absolute inset-x-14 top-134 border-t border-[#E4DED8] shadow-[0_calc(0.5*var(--u))_0_#fff] max-lg:top-[110px]' />
      <span className='mt-18 text-[calc(19.6*var(--u))] leading-[calc(28*var(--u))] font-medium text-[#BF9531] max-lg:mt-[14px] max-lg:text-[15px] max-lg:leading-[22px]'>{deal.lead}</span>
      <span className='text-[calc(19.6*var(--u))] leading-[calc(35*var(--u))] font-medium text-[#2C2D32] max-lg:text-[15px] max-lg:leading-[26px]'>
        {deal.prefix && `${deal.prefix} `}
        <b className='font-(family-name:--font-libre-baskerville) text-[calc(28*var(--u))] font-bold italic max-lg:text-[22px]'>{deal.value}</b>
        {deal.suffix.startsWith('%') ? deal.suffix : ` ${deal.suffix}`}
      </span>
      <span className={cn('absolute inset-x-0 bottom-0 flex h-63 items-center justify-center gap-10 text-[calc(19.6*var(--u))] leading-[calc(28*var(--u))] font-medium text-white max-lg:h-[50px] max-lg:text-[15px]', EXCLUSIVE_FOOTERS[index % 2])}>
        Unlock Now <ArrowRight className='size-20 max-lg:size-[16px]' strokeWidth={2} />
      </span>
    </Link>
  )
}

// ─── "All offers" ────────────────────────────────────────────────────────

type Tab = 'all' | DealGroup
const TABS: { key: Tab; label: string; icon: string; w: number; h: number }[] = [
  { key: 'all', label: 'All', icon: PERCENT, w: 57.6, h: 57.6 },
  { key: 'dining', label: 'Dining', icon: GROUP_ICON.dining, w: 44.5, h: 49.6 },
  { key: 'shopping', label: 'Shopping', icon: GROUP_ICON.shopping, w: 37.3, h: 49.2 },
  { key: 'wellness', label: 'Wellness', icon: GROUP_ICON.wellness, w: 38, h: 50.4 },
]

const SORTS = [
  { key: 'distance', label: 'Distance' },
  { key: 'rating', label: 'Top Rated' },
  { key: 'cost_asc', label: 'Cost: Low to High' },
  { key: 'cost_desc', label: 'Cost: High to Low' },
] as const

const EMPTY_DRAFT: FilterDraft = {}

const CHIP =
  'flex h-35 shrink-0 items-center gap-8 rounded-full border-[length:calc(1.3*var(--u))] px-10 text-[calc(15.6*var(--u))] leading-[calc(24*var(--u))] font-semibold [filter:drop-shadow(calc(3*var(--u))_calc(3*var(--u))_calc(6*var(--u))_rgba(0,0,0,0.05))] max-lg:h-[32px] max-lg:gap-[6px] max-lg:px-[12px] max-lg:text-[13px]'
const chipState = (on: boolean) => (on ? 'border-[#FF4800] bg-[#FFF1EB] text-[#FF4800]' : 'border-[#B0B0B0] bg-white/77 text-[#454040] hover:bg-[#FAFAFA]')

/** The dialog's Sort maps onto the list's own sort. */
const DIALOG_SORT: Record<string, string> = { distance: 'distance', popularity: 'rating', cost_asc: 'cost_asc', cost_desc: 'cost_desc' }

function AllOffers({ restaurants, stores, initialMin }: { restaurants: DealCard[]; stores: DealCard[]; initialMin: number }) {
  const plan = useUserPlan()
  const [tab, setTab] = useState<Tab>('all')
  const [sort, setSort] = useState<string | null>(null)
  const [sortOpen, setSortOpen] = useState(false)
  const [minPct, setMinPct] = useState(initialMin)
  const [season, setSeason] = useState(false)
  const [draft, setDraft] = useState<FilterDraft>(EMPTY_DRAFT)
  const [filterOpen, setFilterOpen] = useState(false)

  const cuisineOptions = useMemo(() => [...new Set(restaurants.flatMap((r) => r.cuisines))].sort(), [restaurants])

  const visible = useMemo(() => {
    // app parity: DealsScreen `qualifies` — nearby, and either cashback for this plan or a % offer
    const qualifies = (c: DealCard) =>
      (c.distanceKm == null || c.distanceKm <= RADIUS_KM) && (getCashbackPct(c.caps, plan) > 0 || c.maxPercent > 0)
    const pool =
      tab === 'all' ? [...restaurants, ...stores] : tab === 'dining' ? restaurants : stores.filter((s) => s.group === tab)
    const cost = COST_BUCKETS.find((b) => b.key === draft.cost)
    const km = distanceKm(draft.distance)
    const list = pool.filter(
      (c) =>
        qualifies(c) &&
        (!minPct || c.maxPercent >= minPct) &&
        (!season || c.offers.some((o) => /season|sale/i.test(o))) &&
        (!draft.minRating || c.rating >= draft.minRating) &&
        (!km || (c.distanceKm != null && c.distanceKm <= km)) &&
        (!cost || (c.costForTwo != null && (cost.min == null || c.costForTwo >= cost.min) && (cost.max == null || c.costForTwo <= cost.max))) &&
        (!draft.veg || c.isVeg) &&
        (!draft.cuisines?.length || c.cuisines.some((x) => draft.cuisines!.includes(x))),
    )
    const s = sort ?? (draft.sort ? DIALOG_SORT[draft.sort] : null)
    const by: Record<string, (a: DealCard, b: DealCard) => number> = {
      distance: (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
      rating: (a, b) => b.rating - a.rating,
      cost_asc: (a, b) => (a.costForTwo ?? Infinity) - (b.costForTwo ?? Infinity),
      cost_desc: (a, b) => (b.costForTwo ?? -1) - (a.costForTwo ?? -1),
    }
    return s && by[s] ? [...list].sort(by[s]) : list
  }, [tab, restaurants, stores, plan, minPct, season, draft, sort])

  const filterCount = [draft.distance, draft.minRating, draft.cost, draft.veg, draft.cuisines?.length, draft.sort].filter(Boolean).length
  const currentSort = SORTS.find((s) => s.key === sort)

  return (
    <section id='all-offers' className='flex scroll-mt-96 flex-col'>
      <h2 className={TITLE}>All offers</h2>

      {/* category tabs */}
      <div role='tablist' aria-label='Offer categories' className='relative mt-16 flex gap-[calc(55*var(--u))] border-b border-[#FF4901] max-lg:mt-[12px] max-lg:justify-between max-lg:gap-0 max-lg:px-[8px]'>
        {TABS.map((t) => {
          const active = t.key === tab
          return (
            <button
              key={t.key}
              type='button'
              role='tab'
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className='relative flex w-65 flex-col items-center pb-6 max-lg:w-auto max-lg:min-w-[60px]'
            >
              <span className='flex h-58 items-end max-lg:h-[44px]'>
                <Image src={t.icon} alt='' width={58} height={58} className='object-contain' style={{ width: `calc(${t.w} * var(--u))`, height: `calc(${t.h} * var(--u))` }} />
              </span>
              <span className={cn('mt-3 text-[calc(14.4*var(--u))] leading-[calc(19*var(--u))] text-[#454040] max-lg:text-[12px] max-lg:leading-[16px]', active ? 'font-bold' : 'font-medium')}>{t.label}</span>
              {active && <span aria-hidden className='absolute -bottom-[calc(1.5*var(--u))] left-1/2 h-3 w-78 -translate-x-1/2 rounded-full bg-[#FF4901] max-lg:h-[3px] max-lg:w-[56px]' />}
            </button>
          )
        })}
      </div>

      {/* filter chips */}
      <div className='scrollbar-hide mt-20 flex gap-12 overflow-x-auto pb-4 [scrollbar-width:none] max-lg:mt-[14px] max-lg:gap-[8px] [&::-webkit-scrollbar]:hidden'>
        <button type='button' onClick={() => setFilterOpen(true)} className={cn(CHIP, chipState(filterCount > 0))}>
          Filter{filterCount ? ` (${filterCount})` : ''} <SlidersHorizontal className='size-[calc(20*var(--u))] max-lg:size-[15px]' strokeWidth={1.8} />
        </button>
        <div className='relative shrink-0'>
          <button type='button' aria-expanded={sortOpen} onClick={() => setSortOpen((o) => !o)} className={cn(CHIP, chipState(!!sort))}>
            {currentSort?.label ?? 'Sort By'} <ChevronDown className='size-[calc(18*var(--u))] max-lg:size-[14px]' strokeWidth={2} />
          </button>
        </div>
        <button type='button' aria-pressed={minPct === 30} onClick={() => setMinPct((m) => (m === 30 ? 0 : 30))} className={cn(CHIP, chipState(minPct === 30))}>
          Min 30% OFF
        </button>
        {minPct > 0 && minPct !== 30 && (
          <button type='button' aria-pressed onClick={() => setMinPct(0)} className={cn(CHIP, chipState(true))}>
            Min {minPct}% OFF
          </button>
        )}
        <button type='button' aria-pressed={season} onClick={() => setSeason((v) => !v)} className={cn(CHIP, chipState(season))}>
          End of Season Sale
        </button>
      </div>
      {sortOpen && (
        <ul className='relative z-30 -mt-4 ml-103 w-200 overflow-hidden rounded-[calc(12*var(--u))] border border-[#EEE] bg-white py-4 text-[calc(14*var(--u))] shadow-lg max-lg:ml-[90px] max-lg:w-[180px] max-lg:rounded-[12px] max-lg:text-[13px]'>
          {SORTS.map((s) => (
            <li key={s.key}>
              <button
                type='button'
                onClick={() => {
                  setSort(sort === s.key ? null : s.key)
                  setSortOpen(false)
                }}
                className={cn('w-full px-12 py-8 text-left hover:bg-gray-50 max-lg:px-[12px] max-lg:py-[8px]', sort === s.key && 'font-bold text-[#FF4800]')}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {visible.length ? (
        <div className='mt-20 grid grid-cols-3 gap-24 max-lg:mt-[14px] max-lg:grid-cols-1 max-lg:gap-[16px] max-lg:sm:grid-cols-2'>
          {visible.map((c) => (
            <OfferCard key={c.key} card={c} variant='grid' />
          ))}
        </div>
      ) : (
        <p className='mt-40 py-40 text-center text-[calc(16*var(--u))] text-[#717171] max-lg:mt-[24px] max-lg:py-[24px] max-lg:text-[14px]'>
          No offers match these filters near you.
        </p>
      )}

      {filterOpen && (
        <FilterDialog
          open
          onClose={() => setFilterOpen(false)}
          initial={draft}
          cuisineOptions={cuisineOptions}
          sections={['Sort', 'Distance', 'Ratings', 'Dietary Preferences', 'Cost for two', 'Cuisines']}
          onApply={(d) => {
            setDraft(d)
            setFilterOpen(false)
          }}
        />
      )}
    </section>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────

export function GreatDeals({ data, initialMin }: { data: GreatDealsData; initialMin: number }) {
  return (
    <div className={GD_PAGE}>
      <Hero />
      <div className='flex flex-col gap-48 px-172 pt-48 max-lg:gap-32 max-lg:px-16 max-lg:pt-24'>
        {data.dining.length > 0 && (
          <Rail title='Try new deals in dining'>
            {data.dining.map((c) => (
              <OfferCard key={c.key} card={c} variant='wide' />
            ))}
          </Rail>
        )}

        {data.stores.length > 0 && (
          <Rail title='Best offers for you'>
            {data.stores.slice(0, 12).map((c) => (
              <PayBillCard key={c.key} card={c} />
            ))}
          </Rail>
        )}

        <Rail title='More offers'>
          {COUPONS.map((c) => (
            <CouponCard key={c.key} c={c} />
          ))}
        </Rail>

        {data.stamps.length > 0 && (
          <Rail title='Collect stamps for rewards'>
            {data.stamps.map((c) => (
              <StampDealCard key={`${c.group}-${c.id}`} card={c} />
            ))}
          </Rail>
        )}

        <BankOffersSection
          cards={data.offersForYou}
          title='Offers for you'
          cardClassName='relative aspect-256/196 w-385 shrink-0 snap-start overflow-hidden rounded-[calc(24*var(--u))] bg-gray-100 max-lg:w-[256px] max-lg:rounded-[16px]'
          renderRail={(cards) => <Rail title='Offers for you'>{cards}</Rail>}
        />

        {data.exclusive.length > 0 && (
          <Rail
            head={
              <div className='flex items-start justify-between gap-16'>
                <div>
                  <h2 className='font-(family-name:--font-libre-baskerville) text-[calc(28*var(--u))] leading-[calc(40*var(--u))] font-bold text-[#FF6A30] italic max-lg:text-[22px] max-lg:leading-[30px]'>
                    Exclusive deals
                  </h2>
                  <p className='mt-3 text-[calc(14*var(--u))] leading-[calc(18*var(--u))] text-[#2C2D32] max-lg:text-[12px] max-lg:leading-[16px]'>Get access to super deals daily</p>
                </div>
                <span className='mt-8 flex shrink-0 items-center gap-5 rounded-full border border-[#6BBA80] px-10 py-3 text-[calc(13*var(--u))] leading-[calc(17*var(--u))] font-bold text-[#6BBA80] uppercase max-lg:px-[8px] max-lg:text-[10px]'>
                  <span aria-hidden className='size-[calc(9.1*var(--u))] rounded-full bg-[#3AA456] shadow-[0_0_calc(4.8*var(--u))_#2DFF64] max-lg:size-[7px]' />
                  Live now
                </span>
              </div>
            }
          >
            {data.exclusive.map((d, i) => (
              <ExclusiveCard key={d.key} deal={d} index={i} />
            ))}
          </Rail>
        )}

        <AllOffers key={initialMin} restaurants={data.diningOffers} stores={data.stores} initialMin={initialMin} />
      </div>
    </div>
  )
}
