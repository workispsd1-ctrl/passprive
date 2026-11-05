'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ChevronDown, Heart, Share2 } from 'lucide-react'
import { useGallery } from '@/components/sections/dining/PhotoGalleryClient'
import { t, tMin, u } from '@/components/sections/dining/designUnit'
import { OpeningHoursPill } from '@/components/shared/detail/OpeningHours'
import { areaLabel } from '@/components/shared/detail/MobileTitleCard'
import { directionsUrl, shareLink, useSaveMerchant } from '@/components/shared/detail/MerchantActions'
import { UpsellBannerPager } from '@/components/shared/detail/UpsellBannerPager'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { canPayBill, getCashbackPct } from '@/lib/cashback'
import { useLocation } from '@/lib/context/LocationContext'
import type { HoursRow } from '@/lib/openingHours'
import type { DiscountCaps } from '@/lib/services/membershipCaps'
import type { ServiceStore } from '@/lib/types/stores'
import { cn, formatDistanceKm, haversineKm } from '@/lib/utils'

const A = '/assets/merchant-detail'
const INTER = 'font-(family-name:--font-inter)'
const ICON_BUTTON = 'flex shrink-0 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm hover:bg-black/40'

function Tag({ icon, label, iconW, iconH }: { icon: string; label: string; iconW: number; iconH: number }) {
  return (
    <span
      className='inline-flex items-center border border-[#e4e4e4] bg-white font-medium whitespace-nowrap text-[#5b5a5a]'
      style={{ height: tMin(24, 20), borderRadius: t(16), padding: `0 ${tMin(10, 7)}`, gap: tMin(4, 3), fontSize: tMin(12, 10) }}
    >
      <Image src={`${A}/${icon}`} alt='' width={iconW} height={iconH} style={{ width: tMin(iconW, iconW * 0.8), height: tMin(iconH, iconH * 0.8) }} />
      {label}
    </span>
  )
}

/** Earn line + "Book a slot" / "Pay bill" — app parity: ServiceStoreDetails.jsx bottom actions. */
function Actions({ store, bookHref }: { store: ServiceStore; bookHref: string | null }) {
  const [payInfo, setPayInfo] = useState(false)
  const showPay = canPayBill(store)
  // "up to" — what a Black member earns here
  const upTo = showPay ? getCashbackPct(store, 'black') : 0
  const button = { height: tMin(48, 36), fontSize: tMin(16, 13) }
  if (!bookHref && !showPay) return null

  return (
    <>
      {upTo > 0 && (
        <p className={`flex items-center font-medium text-[#424144] ${INTER}`} style={{ marginTop: tMin(18, 11), gap: tMin(10, 6), fontSize: tMin(15, 12) }}>
          {/* the coin's art says "6x": Black's 3% against the free 0.5% */}
          {upTo === 3 && <Image src={`${A}/earn-coin.png`} alt='' width={47} height={47} className='shrink-0' style={{ width: tMin(36, 24), height: tMin(36, 24) }} />}
          <span className='min-w-0'>Earn up to <span className='font-semibold text-[#0248f6]'>{upTo}% cashback</span> on bill payment</span>
          <Link href='/membership' aria-label='How cashback works' className='shrink-0'>
            <Image src={`${A}/info.svg`} alt='' width={18} height={18} style={{ width: tMin(15, 12), height: tMin(15, 12) }} />
          </Link>
        </p>
      )}
      <div className='flex flex-wrap' style={{ marginTop: tMin(18, 11), gap: tMin(12, 8) }}>
        {bookHref && (
          <Link href={bookHref} className='flex min-w-fit flex-1 items-center justify-center rounded-full border border-[#ff4800] bg-white px-3 font-semibold whitespace-nowrap text-[#ff4800] transition-colors hover:bg-[#fff1eb]' style={button}>
            Book a slot
          </Link>
        )}
        {showPay && (
          <button type='button' onClick={() => setPayInfo(true)} className={`flex min-w-fit flex-1 items-center justify-center rounded-full bg-[#ff4800] px-3 font-semibold whitespace-nowrap text-[#fffbff] transition-colors hover:bg-brand-dark ${INTER}`} style={button}>
            Pay bill
          </button>
        )}
      </div>
      {/* the web's pay-bill flow only takes restaurants so far; salons pay in the app */}
      <Dialog open={payInfo} onOpenChange={setPayInfo}>
        <DialogContent className='gap-0 rounded-3xl bg-white p-6 font-(family-name:--font-dm-sans) sm:max-w-md'>
          <DialogTitle className='text-[20px] font-bold text-[#161616]'>Pay your bill in the app</DialogTitle>
          <DialogDescription className='mt-2 text-[14px] leading-5 text-[#5B5A5A]'>
            Pay with Privé Credits or card at {store.name} in the PassPrivé app.
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Top of the salon page on desktop: the photo beside the details and the membership banner. */
export function WellnessDesktopHero({
  store,
  address,
  hours,
  bookHref,
  offerZone,
  offerPct,
  caps,
}: {
  store: ServiceStore
  address: string
  hours: HoursRow[]
  bookHref: string | null
  offerZone: boolean
  offerPct: number
  caps: DiscountCaps
}) {
  const { openAt } = useGallery()
  const { location } = useLocation()
  const saver = useSaveMerchant(store.id, 'STORE')
  const [copied, setCopied] = useState(false)
  const [showAddress, setShowAddress] = useState(false)

  const { lat, lng, name, phone } = store
  const distance =
    location.lat != null && location.lng != null && lat != null && lng != null
      ? formatDistanceKm(haversineKm(location.lat, location.lng, Number(lat), Number(lng)))
      : null
  const subtitle = [store.category, store.subcategory].filter(Boolean).join(' • ')
  const place = [distance, areaLabel(store.location_name, store.city)].filter(Boolean).join(' • ')
  const logo = store.logo_url ?? store.cover_image
  const round = { width: tMin(31.73, 26), height: tMin(30.8, 25) }
  const iconSize = { width: tMin(22, 17), height: tMin(22, 17) }
  const iconBox = { width: tMin(44, 34), height: tMin(44, 34) }

  return (
    <section className='hidden font-(family-name:--font-dm-sans) md:block lg:grid lg:grid-cols-[minmax(0,973fr)_minmax(0,565fr)]' style={{ paddingTop: t(40), columnGap: u(27) }}>
      <div className='relative overflow-hidden bg-[#f1f1f1]' style={{ minHeight: u(476), borderRadius: t(18) }}>
        <button type='button' onClick={() => openAt(0)} aria-label={`View photos of ${name}`} className='group absolute inset-0'>
          {store.cover_image && <Image src={store.cover_image} alt={name} fill priority sizes='(min-width: 1024px) 55vw, 90vw' className='object-cover transition-transform duration-500 group-hover:scale-[1.02]' />}
        </button>
        <div className='absolute flex' style={{ top: tMin(24, 12), right: tMin(24, 12), gap: tMin(12, 8) }}>
          <button type='button' onClick={saver.onSave} aria-label={saver.saved ? 'Edit saved lists' : 'Save'} aria-pressed={saver.saved} className={ICON_BUTTON} style={iconBox}>
            <Heart className={cn(saver.saved && 'fill-brand text-brand')} style={iconSize} />
          </button>
          <button
            type='button'
            onClick={async () => { if (await shareLink(name)) { setCopied(true); setTimeout(() => setCopied(false), 2000) } }}
            aria-label={copied ? 'Link copied' : 'Share'}
            className={ICON_BUTTON}
            style={iconBox}
          >
            {copied ? <Check style={iconSize} /> : <Share2 style={iconSize} />}
          </button>
        </div>
        {saver.sheet(name)}
      </div>

      <div className='flex min-w-0 flex-col max-lg:mt-4' style={{ gap: tMin(24, 14) }}>
        <div className='flex-1 bg-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.1)]' style={{ padding: tMin(26, 14), borderRadius: t(18) }}>
          <div className='flex items-start' style={{ gap: tMin(18, 11) }}>
            {logo && (
              <span className='relative shrink-0 overflow-hidden bg-gray-100' style={{ width: tMin(83, 52), height: tMin(83, 52), borderRadius: t(14) }}>
                <Image src={logo} alt='' fill sizes='83px' className='object-cover' />
              </span>
            )}
            <div className='min-w-0'>
              <h1 className='font-bold wrap-break-word text-[#2c2d32]' style={{ fontSize: tMin(30, 20), lineHeight: 1.3, letterSpacing: t(-0.5) }}>{name}</h1>
              {subtitle && <p className='font-medium wrap-break-word text-[#5b5a5a]' style={{ marginTop: t(2), fontSize: tMin(14, 12), lineHeight: 1.43 }}>{subtitle}</p>}
              {place && (
                <button
                  type='button'
                  onClick={() => setShowAddress(v => !v)}
                  aria-expanded={showAddress}
                  disabled={!address}
                  className='flex items-center text-left font-medium text-[#777]'
                  style={{ marginTop: tMin(4, 2), gap: tMin(8, 6), fontSize: tMin(14, 12), lineHeight: 1.43 }}
                >
                  <span className='min-w-0 wrap-break-word'>{place}</span>
                  {address && <ChevronDown className={cn('shrink-0 text-[#ff4800] transition-transform', showAddress && 'rotate-180')} style={{ width: tMin(16, 13), height: tMin(16, 13) }} />}
                </button>
              )}
              {showAddress && address && <p className='wrap-break-word text-[#767677]' style={{ marginTop: t(4), fontSize: tMin(14, 12) }}>{address}</p>}
            </div>
          </div>

          <div className='flex flex-wrap items-center' style={{ marginTop: tMin(16, 10), columnGap: tMin(12, 8), rowGap: tMin(8, 6) }}>
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
          </div>

          {(store.is_promoted || offerZone) && (
            <div className='flex flex-wrap items-center' style={{ marginTop: tMin(14, 9), gap: tMin(10, 6) }}>
              {store.is_promoted && <Tag icon='tag-trending.svg' label='Trending' iconW={8.13} iconH={11} />}
              {offerZone && <Tag icon='tag-exclusive.svg' label='Exclusive Zone' iconW={10.98} iconH={9.61} />}
            </div>
          )}

          <Actions store={store} bookHref={bookHref} />
        </div>

        <UpsellBannerPager
          merchantType={store.merchant_type}
          merchantId={store.id}
          kind='store'
          offerPct={offerPct}
          caps={caps}
          variant='figma'
        />
      </div>
    </section>
  )
}
