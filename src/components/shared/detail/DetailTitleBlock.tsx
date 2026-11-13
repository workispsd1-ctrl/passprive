'use client'

import Image from 'next/image'
import type { CardChipKey } from '@/lib/cardChips'
import { CardChips } from '@/components/shared/CardChips'
import { MapPin, Star } from 'lucide-react'
import { useLocation } from '@/lib/context/LocationContext'
import { cn, formatDistanceKm, haversineKm } from '@/lib/utils'
import type { HoursRow } from '@/lib/openingHours'
import { OpeningHoursPill } from './OpeningHours'
import { HuntSpot } from '@/components/hunt/HuntSpot'

/**
 * Name block at the top of every merchant detail page — app parity: the
 * detail screens' title card (logo, name, category line, distance, rating,
 * status pill, address, action icons), shared so dining, stores and wellness
 * read the same.
 */
export function DetailTitleBlock({
  name,
  eyebrow,
  logo,
  showLogo = false,
  badges,
  rating,
  meta = [],
  lat,
  lng,
  hours = [],
  address,
  actions,
  className,
  chips = [],
}: {
  name: string
  /** category / cuisines line above the name */
  eyebrow?: string
  logo?: string | null
  /** stores show their logo tile (initial when there's no logo); restaurants don't */
  showLogo?: boolean
  badges?: React.ReactNode
  rating: { avg: number; count: number }
  /** "MUR 600 for two", … — joined with the distance and shown under the name */
  meta?: (string | null | undefined)[]
  lat?: number | null
  lng?: number | null
  hours?: HoursRow[]
  address?: string | null
  actions?: React.ReactNode
  className?: string
  /** app parity: MerchantInfoCard.jsx — getCardChips(entity) */
  chips?: CardChipKey[]
}) {
  const { location } = useLocation()
  const distance =
    location.lat != null && location.lng != null && lat != null && lng != null
      ? formatDistanceKm(haversineKm(location.lat, location.lng, Number(lat), Number(lng)))
      : null
  const metaLine = [...meta, distance && `${distance} away`].filter(Boolean).join('  •  ')

  return (
    <header className={cn('relative font-(family-name:--font-dm-sans)', className)}>
      {/* app parity: MerchantInfoCard.jsx HuntSpot */}
      <HuntSpot slot='merchant-card' />
      <div className='flex items-start gap-4'>
        {showLogo && (
          <div className='relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)]'>
            {logo ? (
              <Image src={logo} alt='' fill className='object-contain p-1.5' sizes='64px' />
            ) : (
              <span className='text-[24px] font-bold text-gray-400'>{name[0]}</span>
            )}
          </div>
        )}

        <div className='min-w-0 flex-1'>
          {eyebrow && (
            <p className='truncate text-[12px] font-semibold tracking-[0.08em] text-brand uppercase'>{eyebrow}</p>
          )}
          <div className='mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1'>
            <h1 className='text-[26px] leading-[1.15] font-bold tracking-[-0.6px] text-[#141414] md:text-[34px]'>{name}</h1>
            {badges}
          </div>
          {metaLine && <p className='mt-1.5 text-[14px] text-gray-600'>{metaLine}</p>}
        </div>

        {rating.avg > 0 && (
          <a
            href='#reviews'
            className='flex shrink-0 flex-col items-center rounded-2xl border border-gray-100 px-3 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-colors hover:border-gray-200'
          >
            <span className='inline-flex items-center gap-1 rounded-lg bg-[#1F8A3B] px-2 py-0.5 text-[15px] font-bold text-white'>
              {rating.avg.toFixed(1)} <Star className='size-3.5 fill-white' />
            </span>
            <span className='mt-1 text-[11px] font-medium text-gray-500 underline-offset-2 hover:underline'>
              {rating.count.toLocaleString('en-US')} {rating.count === 1 ? 'rating' : 'ratings'}
            </span>
          </a>
        )}
      </div>

      {(hours.length > 0 || address) && (
        <div className='mt-4 flex flex-wrap items-center gap-x-4 gap-y-2'>
          <OpeningHoursPill hours={hours} />
          {address && (
            <p className='flex min-w-0 items-start gap-1.5 text-[13px] leading-snug text-gray-500'>
              <MapPin className='mt-0.5 size-3.5 shrink-0 text-gray-400' />
              <span>{address}</span>
            </p>
          )}
        </div>
      )}
      <CardChips chips={chips} className='mt-3' />

      {actions && <div className='mt-5'>{actions}</div>}
    </header>
  )
}
