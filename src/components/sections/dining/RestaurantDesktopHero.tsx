'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocation } from '@/lib/context/LocationContext'
import { canPayBill, getCashbackPct, type MerchantCapabilityFields } from '@/lib/cashback'
import { formatDistanceKm, haversineKm } from '@/lib/utils'
import type { HoursRow } from '@/lib/openingHours'
import { OpeningHoursPill } from '@/components/shared/detail/OpeningHours'
import { areaLabel } from '@/components/shared/detail/MobileTitleCard'
import { findSection } from '@/components/shared/detail/DetailSectionTabs'
import { useGallery } from './PhotoGalleryClient'
import { t, u } from './designUnit'

const A = '/figma/detail'
const INTER = 'font-(family-name:--font-inter)'

function Tag({ icon, label, color, iconW, iconH }: { icon: string; label: string; color: string; iconW: number; iconH: number }) {
  return (
    <span
      className='inline-flex items-center rounded-full bg-[#fff1eb] font-semibold whitespace-nowrap'
      style={{ height: t(46), paddingLeft: t(15), paddingRight: t(18), gap: t(9), fontSize: t(24), lineHeight: t(35), color }}
    >
      <Image src={`${A}/${icon}`} alt='' width={iconW} height={iconH} style={{ width: t(iconW), height: t(iconH) }} />
      {label}
    </span>
  )
}

/**
 * Restaurant detail header on desktop — Figma "Dining - Pay Bill"
 * (PASS-PRIVE-HOMEPAGE 11318:17535), drawn on its 1920 frame: layout in `u`
 * (fluid with the screen), type and controls in `t` (stepped per breakpoint,
 * full size only at 1920). Phones keep MobileTitleCard.
 */
export function RestaurantDesktopHero({
  name,
  cover,
  photoCount,
  cuisines,
  costForTwo,
  area,
  city,
  lat,
  lng,
  rating,
  hours,
  stampSheet,
  trending,
  exclusive,
  merchant,
  bookHref,
  payHref,
}: {
  name: string
  cover: string | null
  photoCount: number
  cuisines: string[]
  costForTwo: number | null
  area: string | null
  city: string | null
  lat: number | null
  lng: number | null
  rating: { avg: number; count: number }
  hours: HoursRow[]
  stampSheet: boolean
  trending: boolean
  exclusive: boolean
  merchant: MerchantCapabilityFields
  bookHref: string | null
  payHref: string | null
}) {
  const router = useRouter()
  const { openAt } = useGallery()
  const { location } = useLocation()
  const distance =
    location.lat != null && location.lng != null && lat != null && lng != null
      ? formatDistanceKm(haversineKm(location.lat, location.lng, Number(lat), Number(lng)))
      : null
  const line1 = [cuisines.slice(0, 2).join(', '), costForTwo != null ? `MUR ${costForTwo.toLocaleString('en-US')} for two` : null]
    .filter(Boolean)
    .join(' •  ')
  const line2 = [distance, areaLabel(area, city)].filter(Boolean).join(' • ')
  // "up to" — what a Black member earns here
  const upTo = canPayBill(merchant) ? getCashbackPct(merchant, 'black') : 0
  const ratingCount = rating.count >= 1000 ? `${(rating.count / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(rating.count)

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
        <button type='button' onClick={back} className='flex items-center font-semibold text-[#ff4800] hover:text-brand-dark' style={{ fontSize: t(24), height: t(40) }}>
          <Image src={`${A}/back-chevron.svg`} alt='' width={40} height={40} style={{ width: t(40), height: t(40), marginRight: t(-12) }} />
          Back
        </button>

        <div className='flex items-start' style={{ marginTop: t(24), gap: u(60) }}>
          <button
            type='button'
            onClick={() => openAt(0)}
            aria-label={`View photos of ${name}`}
            className='group relative shrink-0 overflow-hidden bg-[rgba(241,241,241,1)]'
            style={{ width: u(760), height: u(464), borderRadius: u(35.03) }}
          >
            {cover && (
              <Image src={cover} alt={name} fill priority sizes='(min-width: 1920px) 760px, 40vw' className='object-cover transition-transform duration-500 group-hover:scale-[1.03]' />
            )}
            {photoCount > 1 && (
              <span
                className='absolute flex items-center rounded-full bg-white/95 font-semibold text-gray-900 shadow-sm'
                style={{ right: t(20), bottom: t(20), padding: `${t(8)} ${t(16)}`, fontSize: t(15) }}
              >
                Show all {photoCount} photos
              </span>
            )}
          </button>

          <div className='flex min-w-0 flex-1 flex-col' style={{ paddingTop: t(6) }}>
            <div className='flex items-start justify-between' style={{ gap: t(24) }}>
              <div className='flex min-w-0 flex-col' style={{ gap: t(17.5) }}>
                <h1 className='font-semibold text-[#2c2d32]' style={{ fontSize: t(44), lineHeight: t(57) }}>{name}</h1>
                <div className='flex flex-col font-medium whitespace-pre text-[#5b5a5a]' style={{ fontSize: t(28), lineHeight: t(36), gap: t(3.5) }}>
                  {line1 && <p>{line1}</p>}
                  {line2 && <p>{line2}</p>}
                </div>
              </div>
              {rating.avg > 0 && (
                <button
                  type='button'
                  onClick={() => findSection('reviews')?.scrollIntoView({ behavior: 'smooth' })}
                  className='flex shrink-0 flex-col items-center'
                  style={{ width: t(120), gap: t(4) }}
                >
                  <span
                    className={`flex items-center justify-center rounded-full bg-[#3aa456] font-bold text-white ${INTER}`}
                    style={{ width: t(120), height: t(48), gap: t(7), fontSize: t(28), letterSpacing: t(0.52) }}
                  >
                    {rating.avg.toFixed(1)}
                    <Image src={`${A}/rating-star.svg`} alt='' width={20} height={18} style={{ width: t(20), height: t(18) }} />
                  </span>
                  <span className={`font-medium text-[#787575] underline ${INTER}`} style={{ fontSize: t(16), lineHeight: t(22) }}>
                    {ratingCount} ratings
                  </span>
                </button>
              )}
            </div>

            <div style={{ marginTop: t(32) }}>
              <OpeningHoursPill hours={hours} variant='figma' />
            </div>

            {(stampSheet || trending || exclusive) && (
              <div className='flex flex-wrap' style={{ marginTop: t(16), gap: t(13) }}>
                {stampSheet && <Tag icon='tag-stamp.svg' label='Stamp sheet' color='#ff4800' iconW={24} iconH={26} />}
                {trending && <Tag icon='tag-trending.svg' label='Trending' color='#ff6a30' iconW={18} iconH={24} />}
                {exclusive && <Tag icon='tag-exclusive.svg' label='Exclusive' color='#ff6a30' iconW={24} iconH={21} />}
              </div>
            )}

            {upTo > 0 && (
              <p
                className={`flex items-center font-semibold whitespace-nowrap text-[#424144] ${INTER}`}
                style={{ marginTop: t(26), gap: t(3), fontSize: t(15.75), lineHeight: t(22.4) }}
              >
                <Image src={`${A}/earn-coin.png`} alt='' width={48} height={48} style={{ width: t(48), height: t(48) }} />
                <span>
                  Earn up to <span className='text-[#0248f6]'>{upTo}% cashback</span> on bill payment
                </span>
                <Link href='/membership' aria-label='How cashback works' style={{ marginLeft: t(6) }}>
                  <Image src={`${A}/info.svg`} alt='' width={18} height={18} style={{ width: t(18), height: t(18) }} />
                </Link>
              </p>
            )}

            {(bookHref || payHref) && (
              <div className='flex' style={{ marginTop: t(15), gap: t(20) }}>
                {bookHref && (
                  <Link
                    href={bookHref}
                    className={`flex items-center justify-center rounded-full border-solid border-[#ff4800] bg-white font-semibold text-[#ff4800] transition-colors hover:bg-brand-tint ${INTER}`}
                    style={{ width: t(280), height: t(72), borderWidth: t(1.52), fontSize: t(28) }}
                  >
                    Book table
                  </Link>
                )}
                {payHref && (
                  <Link
                    href={payHref}
                    className={`flex items-center justify-center rounded-full bg-[#ff4800] font-semibold text-[#fffbff] transition-colors hover:bg-brand-dark ${INTER}`}
                    style={{ width: t(264), height: t(72), fontSize: t(28) }}
                  >
                    Pay bill
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
