'use client'

import Image from 'next/image'
import { DealQuotaGauge } from '@/components/shared/deals/DealQuotaGauge'
import type { CardChipKey } from '@/lib/cardChips'
import { CardChips } from '@/components/shared/CardChips'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Check, ChevronDown, Heart, Share2 } from 'lucide-react'
import { useLocation } from '@/lib/context/LocationContext'
import { canPayBill, getCashbackPct, type MerchantCapabilityFields } from '@/lib/cashback'
import { formatDistanceKm, haversineKm } from '@/lib/utils'
import type { HoursRow } from '@/lib/openingHours'
import { OpeningHoursPill } from '@/components/shared/detail/OpeningHours'
import { areaLabel } from '@/components/shared/detail/MobileTitleCard'
import { findSection } from '@/components/shared/detail/DetailSectionTabs'
import { directionsUrl, shareLink, useSaveMerchant } from '@/components/shared/detail/MerchantActions'
import { cn } from '@/lib/utils'
import { useGallery } from './PhotoGalleryClient'
import { t, tMin, u } from './designUnit'
import { AuthLink } from '@/components/shared/AuthLink'
import { HuntSpot } from '@/components/hunt/HuntSpot'

const A = '/assets/merchant-detail'
const INTER = 'font-(family-name:--font-inter)'

/** Figma tag: 21 high, 11/16 semibold on #FFF1EB. */
function Tag({ icon, label, color, iconW, iconH }: { icon: string; label: string; color: string; iconW: number; iconH: number }) {
  return (
    <span
      className='inline-flex items-center bg-[#fff1eb] font-semibold whitespace-nowrap'
      style={{ height: tMin(21, 19), borderRadius: t(15.83), paddingLeft: tMin(7, 6), paddingRight: tMin(6, 5), gap: tMin(4, 3), fontSize: tMin(11, 10), lineHeight: 1.45, color }}
    >
      <Image src={`${A}/${icon}`} alt='' width={iconW} height={iconH} style={{ width: tMin(iconW, iconW * 0.8), height: tMin(iconH, iconH * 0.8) }} />
      {label}
    </span>
  )
}

// css.txt "Heart Icon - Glass": 48 round, rgba(217,217,217,0.1) glass
const ICON_BUTTON = 'flex shrink-0 items-center justify-center rounded-full bg-[rgba(217,217,217,0.1)] text-white backdrop-blur-md hover:bg-[rgba(217,217,217,0.25)]'

/**
 * Top of the restaurant (and shopping store) page — Figma "Dining" / "Shopping
 * details": Back, then the full-width photo with save and share over it. With
 * `photos`, the photo pages through them (Figma's pager dots under the image).
 */
export function RestaurantDesktopHero({
  id,
  name,
  cover,
  photos,
  saveType = 'RESTAURANT',
  backHref = '/dining',
  radius = 12.03,
}: {
  id: string
  name: string
  cover: string | null
  /** every photo, cover first — the hero pages through them */
  photos?: string[]
  saveType?: 'RESTAURANT' | 'STORE'
  /** where Back goes without in-site history */
  backHref?: string
  /** the photo's corner radius in design px */
  radius?: number
}) {
  const router = useRouter()
  const { openAt } = useGallery()
  const saver = useSaveMerchant(id, saveType)
  const [copied, setCopied] = useState(false)
  const [page, setPage] = useState(0)
  const railRef = useRef<HTMLDivElement>(null)
  const slides = photos && photos.length > 0 ? photos : cover ? [cover] : []

  function back() {
    if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) router.back()
    else router.push(backHref)
  }
  const goTo = (i: number) => railRef.current?.scrollTo({ left: i * railRef.current.clientWidth, behavior: 'smooth' })

  return (
    <section className='relative font-(family-name:--font-dm-sans)'>
      {/* the frame's blurred peach circle, at the screen's top-left corner (550px circle at -388,-454) */}
      <Image
        src={`${A}/peach-glow.svg`}
        alt=''
        width={1750}
        height={1750}
        aria-hidden='true'
        className='pointer-events-none absolute max-w-none'
        style={{ left: `calc(50% - 50vw + ${u(-988)})`, top: u(-1054 - 96), width: u(1750), height: u(1750) }}
      />

      <div className='relative' style={{ paddingTop: t(59) }}>
        <button type='button' onClick={back} className='flex items-center font-semibold text-[#ff4800] hover:text-brand-dark' style={{ fontSize: tMin(24, 15), height: t(40) }}>
          <Image src={`${A}/back-chevron.svg`} alt='' width={40} height={40} style={{ width: t(40), height: t(40), marginRight: t(-12) }} />
          Back
        </button>

        <div className='relative overflow-hidden bg-[rgba(241,241,241,1)]' style={{ marginTop: t(25), height: u(480), borderRadius: u(radius) }}>
          <div
            ref={railRef}
            onScroll={e => setPage(Math.round(e.currentTarget.scrollLeft / (e.currentTarget.clientWidth || 1)))}
            className='scrollbar-hide absolute inset-0 flex snap-x snap-mandatory overflow-x-auto'
          >
            {(slides.length ? slides : [null]).map((src, i) => (
              <button key={i} type='button' onClick={() => openAt(i)} aria-label={`View photos of ${name}`} className='group relative h-full w-full shrink-0 snap-start overflow-hidden'>
                {src && <Image src={src} alt={i === 0 ? name : ''} fill priority={i === 0} sizes='(min-width: 1920px) 1576px, 90vw' className='object-cover transition-transform duration-500 group-hover:scale-[1.02]' />}
              </button>
            ))}
          </div>
          {slides.length > 1 && (
            // css.txt "Group 2085664855": 2px dots 22 above the bottom — the active one 25.71 wide, its neighbours 9
            <div className='absolute inset-x-0 flex items-center justify-center' style={{ bottom: tMin(22, 10), gap: tMin(8, 5) }}>
              {slides.map((_, i) => {
                const d = Math.abs(i - page)
                return (
                  <button
                    key={i}
                    type='button'
                    aria-label={`Photo ${i + 1}`}
                    onClick={() => goTo(i)}
                    className={cn('rounded-full transition-all', d === 0 ? 'bg-[#979393]' : 'bg-[rgba(173,173,173,0.5)]')}
                    style={{ height: tMin(2, 2), width: d === 0 ? tMin(25.71, 18) : d === 1 ? tMin(9, 7) : tMin(2, 2) }}
                  />
                )
              })}
            </div>
          )}
          <div className='absolute flex' style={{ top: tMin(32, 12), right: tMin(40, 12), gap: tMin(24, 8) }}>
            <button type='button' onClick={saver.onSave} aria-label={saver.saved ? 'Edit saved lists' : 'Save'} aria-pressed={saver.saved} className={ICON_BUTTON} style={{ width: tMin(48, 34), height: tMin(48, 34) }}>
              <Heart className={cn(saver.saved && 'fill-brand text-brand')} style={{ width: tMin(22, 17), height: tMin(22, 17) }} />
            </button>
            <button
              type='button'
              onClick={async () => { if (await shareLink(name)) { setCopied(true); setTimeout(() => setCopied(false), 2000) } }}
              aria-label={copied ? 'Link copied' : 'Share'}
              className={ICON_BUTTON}
              style={{ width: tMin(48, 34), height: tMin(48, 34) }}
            >
              {copied ? <Check style={{ width: tMin(22, 17), height: tMin(22, 17) }} /> : <Share2 style={{ width: tMin(22, 17), height: tMin(22, 17) }} />}
            </button>
          </div>
        </div>
        {saver.sheet(name)}
      </div>
    </section>
  )
}

/** The name, facts, hours, ways to reach the place and tags, on a card under the photo. */
export function RestaurantTitleCard({
  id,
  name,
  cuisines,
  costForTwo,
  area,
  city,
  lat,
  lng,
  address,
  phone,
  rating,
  hours,
  stampSheet,
  trending,
  exclusive,
  exclusiveZone = false,
  chips = [],
  logo = null,
  subtitle,
  gauge = true,
}: {
  /** restaurant id — the unlocks gauge loads this restaurant's deal quota */
  id: string
  /** shopping stores: the 78×85 brand logo left of the name (Figma "Shopping details") */
  logo?: string | null
  /** replaces the cuisines • cost line (stores: their categories) */
  subtitle?: string
  /** the restaurant's deal-unlocks gauge */
  gauge?: boolean
  /** app parity: pickup-premium stores' "Exclusive Zone" tag */
  exclusiveZone?: boolean
  name: string
  cuisines: string[]
  costForTwo: number | null
  area: string | null
  city: string | null
  lat: number | null
  lng: number | null
  address: string
  phone: string | null
  rating: { avg: number; count: number }
  hours: HoursRow[]
  stampSheet: boolean
  trending: boolean
  exclusive: boolean
  /** app parity: MerchantInfoCard.jsx — getCardChips(entity) */
  chips?: CardChipKey[]
}) {
  const { location } = useLocation()
  const [showAddress, setShowAddress] = useState(false)
  const distance =
    location.lat != null && location.lng != null && lat != null && lng != null
      ? formatDistanceKm(haversineKm(location.lat, location.lng, Number(lat), Number(lng)))
      : null
  const line1 = subtitle ?? [cuisines.slice(0, 2).join(', '), costForTwo != null ? `MUR ${costForTwo.toLocaleString('en-US')} for two` : null]
    .filter(Boolean)
    .join(' • ')
  const line2 = [distance, areaLabel(area, city)].filter(Boolean).join(' • ')
  const ratingCount = rating.count >= 1000 ? `${(rating.count / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(rating.count)
  const round = { width: tMin(31.73, 26), height: tMin(30.8, 25) }

  return (
    <section
      className='relative bg-white/80 font-(family-name:--font-dm-sans) drop-shadow-[0_4px_43.5px_rgba(0,0,0,0.1)]'
      style={{ marginTop: tMin(24, 14), minHeight: t(192), padding: `${tMin(14, 11)} ${tMin(24, 14)}`, borderRadius: t(18) }}
    >
      {/* app parity: MerchantInfoCard.jsx HuntSpot */}
      <HuntSpot slot='merchant-card' />
      <div className='flex items-start justify-between' style={{ gap: tMin(16, 10) }}>
        <div className='flex min-w-0 items-start' style={{ gap: tMin(20, 12) }}>
        {/* css.txt "Rectangle 240649227": 78×85 on white, radius 16, 5 below the name's top */}
        {logo && (
          <span className='relative shrink-0 overflow-hidden bg-white' style={{ width: tMin(78, 52), height: tMin(85, 56), borderRadius: t(16), marginTop: t(5) }}>
            <Image src={logo} alt='' fill sizes='80px' className='object-contain' />
          </span>
        )}
        <div className='min-w-0'>
          <h1 className='font-bold wrap-break-word text-[#2c2d32]' style={{ fontSize: tMin(30, 20), lineHeight: 1.4, letterSpacing: t(-0.5) }}>{name}</h1>
          {line1 && <p className='font-medium wrap-break-word text-[#5b5a5a]' style={{ marginTop: t(2), fontSize: tMin(14, 13), lineHeight: 1.43 }}>{line1}</p>}
          {line2 && (
            <button
              type='button'
              onClick={() => setShowAddress(v => !v)}
              aria-expanded={showAddress}
              disabled={!address}
              className='flex items-center text-left font-medium text-[#777]'
              style={{ marginTop: tMin(6, 4), gap: tMin(8, 6), fontSize: tMin(14, 13), lineHeight: 1.43 }}
            >
              <span className='min-w-0 wrap-break-word'>{line2}</span>
              {address && <ChevronDown className={cn('shrink-0 text-[#ff4800] transition-transform', showAddress && 'rotate-180')} style={{ width: tMin(16, 13), height: tMin(16, 13) }} />}
            </button>
          )}
          {showAddress && address && <p className='wrap-break-word text-[#767677]' style={{ marginTop: t(4), fontSize: tMin(14, 12) }}>{address}</p>}
        </div>
        </div>
        <div className='flex shrink-0 items-start' style={{ gap: tMin(29, 14) }}>
        {/* app parity: MerchantInfoCard's DealQuotaGauge — Figma: a 120-wide slot left of the rating */}
        {gauge && <DealQuotaGauge restaurantId={id} className='relative z-10 -mb-[calc(44*var(--t))] w-[max(64px,calc(100*var(--t)))] text-[max(11px,calc(13*var(--t)))]' />}
        {rating.avg > 0 && (
          <button type='button' onClick={() => findSection('reviews')?.scrollIntoView({ behavior: 'smooth' })} className='flex shrink-0 flex-col items-end' style={{ marginTop: t(8), gap: tMin(11, 5) }}>
            <span className={`flex items-center justify-center bg-[#3aa456] font-bold text-white ${INTER}`} style={{ width: tMin(68, 54), height: tMin(26, 22), borderRadius: t(20.9), gap: tMin(6, 4), fontSize: tMin(13.38, 12), letterSpacing: t(0.24) }}>
              {rating.avg.toFixed(1)}
              <Image src={`${A}/rating-star.svg`} alt='' width={20} height={18} style={{ width: tMin(12, 10), height: tMin(12, 10) }} />
            </span>
            <span className={`font-medium text-[#787575] underline ${INTER}`} style={{ fontSize: tMin(12, 11), lineHeight: 1.42, letterSpacing: t(0.12) }}>{ratingCount} ratings</span>
          </button>
        )}
        </div>
      </div>

      <div className='flex flex-wrap items-center' style={{ marginTop: tMin(14, 10), columnGap: tMin(12, 8), rowGap: tMin(8, 6) }}>
        <OpeningHoursPill hours={hours} variant='figma' />
        {(address || (lat != null && lng != null)) && (
          <a href={directionsUrl(lat, lng, address)} target='_blank' rel='noreferrer' aria-label='Get directions' className='shrink-0 hover:opacity-80' style={round}>
            <Image src={`${A}/Direction.webp`} alt='' width={64} height={62} className='size-full' />
          </a>
        )}
        {phone && (
          <a href={`tel:${phone}`} aria-label={`Call ${name}`} className='shrink-0 hover:opacity-80' style={round}>
            <Image src={`${A}/Call.webp`} alt='' width={64} height={62} className='size-full' />
          </a>
        )}
        <span className='flex flex-wrap items-center lg:ml-[calc(11*var(--t))]' style={{ gap: tMin(12, 8) }}>
          {stampSheet && <Tag icon='tag-stamp.svg' label='Stamp sheet' color='#ff4800' iconW={11} iconH={12} />}
          {trending && <Tag icon='tag-trending.svg' label='Trending' color='#ff6a30' iconW={8.13} iconH={11} />}
          {exclusive && <Tag icon='tag-exclusive.svg' label='Exclusive' color='#ff6a30' iconW={10.98} iconH={9.61} />}
          {exclusiveZone && <Tag icon='tag-exclusive.svg' label='Exclusive Zone' color='#ff6a30' iconW={10.98} iconH={9.61} />}
        </span>
      </div>
      <CardChips chips={chips} height='max(17px, calc(21*var(--t)))' className='mt-[max(8px,calc(12*var(--t)))]' />
    </section>
  )
}

/** "Earn up to X% cashback" with Book table and Pay bill — first in the sidebar. */
export function RestaurantCtaCard({ merchant, bookHref, payHref, className, leftCoin = true }: { merchant: MerchantCapabilityFields; bookHref: string | null; payHref: string | null; className?: string; /** Figma "Shopping details" draws only the right-hand coin */ leftCoin?: boolean }) {
  // "up to" — what a Black member earns here
  const upTo = canPayBill(merchant) ? getCashbackPct(merchant, 'black') : 0
  if (!bookHref && !payHref && !upTo) return null
  const button = { height: tMin(45.2, 36), borderRadius: t(21.66), fontSize: tMin(16.9, 13), lineHeight: tMin(22, 17) }
  return (
    // css.txt "Frame 2147223656": 390×120, radius 16, white 90%→70%, 0 4px 15.1px rgba(0,0,0,.1)
    <section
      className={cn('relative bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.7)_100%)] font-(family-name:--font-dm-sans) shadow-[0_calc(4*var(--t))_calc(15.1*var(--t))_rgba(0,0,0,0.1)]', className)}
      style={{ padding: `${tMin(12, 10)} ${tMin(23, 12)} ${tMin(30, 14)}`, borderRadius: t(16) }}
    >
      {/* css.txt "Ellipse 43772": rgba(255,72,0,0.4), 421×69 at -21,-67, blur 38.245 — clipped to the card */}
      <span aria-hidden='true' className='pointer-events-none absolute inset-0 overflow-hidden' style={{ borderRadius: t(16) }}>
        <span
          className='absolute rounded-[50%] bg-[rgba(255,72,0,0.4)]'
          style={{ left: '-5.4%', top: t(-67), width: '108%', height: t(69), filter: `blur(${t(38.245)})` }}
        />
      </span>
      {/* Figma: the 6x coins on the card's top corners (56px left, 63px right, hanging past the edge) */}
      {upTo > 0 && (
        <>
          {/* css.txt "image 4754": a 42.85 coin in a 56.08 box at -2.9,1.3 and a 50.37 coin in a 63.45 box at 342.6,4.65 (both turned) */}
          {leftCoin && <Image src='/assets/merchant-detail/earn-coin.png' alt='' width={96} height={96} className='pointer-events-none absolute -rotate-20' style={{ left: t(3.71), top: t(7.92), width: t(42.85), height: t(42.85) }} />}
          <Image src='/assets/merchant-detail/earn-coin.png' alt='' width={96} height={96} className='pointer-events-none absolute -rotate-16' style={{ right: t(-9.5), top: t(11.19), width: t(50.37), height: t(50.37) }} />
        </>
      )}
      {upTo > 0 && (
        <p className={`relative flex items-center justify-center font-semibold text-[#424144] ${INTER}`} style={{ gap: tMin(6, 4), fontSize: tMin(14, 11), lineHeight: tMin(20, 16), paddingInline: t(24) }}>
          <span className='min-w-0 text-center'>Earn up to <span className='font-semibold text-[#0248f6]'>{upTo}% cashback</span> on bill payment</span>
          <Link href='/membership' aria-label='How cashback works' className='shrink-0'>
            <Image src={`${A}/info.svg`} alt='' width={18} height={18} style={{ width: tMin(16, 12), height: tMin(16, 12) }} />
          </Link>
        </p>
      )}
      {(bookHref || payHref) && (
        <div className='relative flex flex-wrap' style={{ marginTop: upTo > 0 ? tMin(13, 10) : 0, gap: tMin(7, 6) }}>
          {bookHref && (
            <AuthLink href={bookHref} className='flex min-w-fit flex-1 items-center justify-center border-solid border-[#ff4800] bg-[rgba(217,217,217,0.1)] px-3 font-semibold whitespace-nowrap text-[#ff4800] transition-colors hover:bg-[#fff1eb]' style={{ ...button, borderWidth: 0.94 }}>
              Book table
            </AuthLink>
          )}
          {payHref && (
            <AuthLink href={payHref} className={`flex min-w-fit flex-1 items-center justify-center bg-[#ff4800] px-3 font-semibold whitespace-nowrap text-[#fffbff] transition-colors hover:bg-brand-dark ${INTER}`} style={button}>
              Pay bill
            </AuthLink>
          )}
        </div>
      )}
    </section>
  )
}
