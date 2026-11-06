'use client'

import Image from 'next/image'
import type { CardChipKey } from '@/lib/cardChips'
import { CardChips } from '@/components/shared/CardChips'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
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

const ICON_BUTTON = 'flex shrink-0 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm hover:bg-black/40'

/**
 * Top of the restaurant page on desktop — Figma "Dining": Back, then the full
 * column photo with save and share over it. Phones keep the app's cover hero.
 */
export function RestaurantDesktopHero({ id, name, cover }: { id: string; name: string; cover: string | null }) {
  const router = useRouter()
  const { openAt } = useGallery()
  const saver = useSaveMerchant(id, 'RESTAURANT')
  const [copied, setCopied] = useState(false)

  function back() {
    if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) router.back()
    else router.push('/dining')
  }

  return (
    <section className='relative hidden font-(family-name:--font-dm-sans) md:block'>
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

        <div className='relative overflow-hidden bg-[rgba(241,241,241,1)]' style={{ marginTop: t(25), height: u(480), borderRadius: u(12.03) }}>
          <button type='button' onClick={() => openAt(0)} aria-label={`View photos of ${name}`} className='group absolute inset-0'>
            {cover && <Image src={cover} alt={name} fill priority sizes='(min-width: 1920px) 1576px, 90vw' className='object-cover transition-transform duration-500 group-hover:scale-[1.02]' />}
          </button>
          <div className='absolute flex' style={{ top: tMin(24, 12), right: tMin(24, 12), gap: tMin(12, 8) }}>
            <button type='button' onClick={saver.onSave} aria-label={saver.saved ? 'Edit saved lists' : 'Save'} aria-pressed={saver.saved} className={ICON_BUTTON} style={{ width: tMin(44, 34), height: tMin(44, 34) }}>
              <Heart className={cn(saver.saved && 'fill-brand text-brand')} style={{ width: tMin(22, 17), height: tMin(22, 17) }} />
            </button>
            <button
              type='button'
              onClick={async () => { if (await shareLink(name)) { setCopied(true); setTimeout(() => setCopied(false), 2000) } }}
              aria-label={copied ? 'Link copied' : 'Share'}
              className={ICON_BUTTON}
              style={{ width: tMin(44, 34), height: tMin(44, 34) }}
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
  chips = [],
}: {
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
  const line1 = [cuisines.slice(0, 2).join(', '), costForTwo != null ? `MUR ${costForTwo.toLocaleString('en-US')} for two` : null]
    .filter(Boolean)
    .join(' • ')
  const line2 = [distance, areaLabel(area, city)].filter(Boolean).join(' • ')
  const ratingCount = rating.count >= 1000 ? `${(rating.count / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(rating.count)
  const round = { width: tMin(31.73, 26), height: tMin(30.8, 25) }

  return (
    <section
      className='relative hidden bg-white/80 font-(family-name:--font-dm-sans) drop-shadow-[0_4px_43.5px_rgba(0,0,0,0.1)] md:block'
      style={{ marginTop: tMin(24, 14), minHeight: t(192), padding: `${tMin(14, 11)} ${tMin(24, 14)}`, borderRadius: t(18) }}
    >
      <div className='flex items-start justify-between' style={{ gap: tMin(16, 10) }}>
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
        </span>
      </div>
      <CardChips chips={chips} height='max(17px, calc(21*var(--t)))' className='mt-[max(8px,calc(12*var(--t)))]' />
    </section>
  )
}

/** "Earn up to X% cashback" with Book table and Pay bill — first in the sidebar. */
export function RestaurantCtaCard({ merchant, bookHref, payHref, className }: { merchant: MerchantCapabilityFields; bookHref: string | null; payHref: string | null; className?: string }) {
  // "up to" — what a Black member earns here
  const upTo = canPayBill(merchant) ? getCashbackPct(merchant, 'black') : 0
  if (!bookHref && !payHref && !upTo) return null
  const button = { height: tMin(48, 36), fontSize: tMin(16, 13) }
  return (
    <section className={cn('relative bg-white font-(family-name:--font-dm-sans) drop-shadow-[0_8px_23.8px_rgba(0,0,0,0.1)]', className)} style={{ padding: tMin(22, 12), borderRadius: t(24) }}>
      {upTo > 0 && (
        <p className={`flex items-center justify-center font-medium text-[#424144] ${INTER}`} style={{ gap: tMin(6, 4), fontSize: tMin(13, 11) }}>
          <span className='min-w-0 text-center'>Earn up to <span className='font-semibold text-[#0248f6]'>{upTo}% cashback</span> on bill payment</span>
          <Link href='/membership' aria-label='How cashback works' className='shrink-0'>
            <Image src={`${A}/info.svg`} alt='' width={18} height={18} style={{ width: tMin(15, 12), height: tMin(15, 12) }} />
          </Link>
        </p>
      )}
      {(bookHref || payHref) && (
        <div className='flex flex-wrap' style={{ marginTop: upTo > 0 ? tMin(14, 10) : 0, gap: tMin(12, 8) }}>
          {bookHref && (
            <Link href={bookHref} className='flex min-w-fit flex-1 items-center justify-center rounded-full border border-[#ff4800] bg-white px-3 font-semibold whitespace-nowrap text-[#ff4800] transition-colors hover:bg-[#fff1eb]' style={button}>
              Book table
            </Link>
          )}
          {payHref && (
            <Link href={payHref} className={`flex min-w-fit flex-1 items-center justify-center rounded-full bg-[#ff4800] px-3 font-semibold whitespace-nowrap text-[#fffbff] transition-colors hover:bg-brand-dark ${INTER}`} style={button}>
              Pay bill
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
