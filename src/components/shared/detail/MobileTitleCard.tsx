'use client'

import Image from 'next/image'
import { ChevronDown, Flame, Gem } from 'lucide-react'
import { useLocation } from '@/lib/context/LocationContext'
import { cn, formatDistanceKm, haversineKm } from '@/lib/utils'
import type { HoursRow } from '@/lib/openingHours'
import { OpeningHoursPill } from './OpeningHours'
import { directionsUrl } from './MerchantActions'

/** app parity: RestaurantDetails areaLabel — area + city, without repeating the city. */
export function areaLabel(area: string | null | undefined, city: string | null | undefined) {
  const a = String(area ?? '').trim()
  const c = String(city ?? '').trim()
  if (!a) return c
  if (!c) return a
  return a.toLowerCase().includes(c.toLowerCase()) ? a : `${a}, ${c}`
}

/**
 * The phone title block, built to the app's frame — RestaurantDetails.jsx
 * titleCard (overlapping the hero by 67pt, 18pt radius, soft shadow): name,
 * "cuisines • MUR X for two", "distance • area ▾", the green rating badge;
 * then the grey "Open till 10 PM ▾" pill with the Direction / Call icons,
 * and the Trending / Offer Zone pills. Stores add the dark logo tile
 * (ServiceStoreDetails.jsx topInfoRow). Desktop keeps DetailTitleBlock.
 */
export function MobileTitleCard({
  name,
  subtitle,
  logo,
  showLogo = false,
  area,
  city,
  lat,
  lng,
  address,
  phone,
  rating,
  hours = [],
  trending = false,
  offerZone = false,
}: {
  name: string
  subtitle?: string | null
  logo?: string | null
  showLogo?: boolean
  area?: string | null
  city?: string | null
  lat?: number | null
  lng?: number | null
  address: string
  phone?: string | null
  rating: { avg: number; count: number }
  hours?: HoursRow[]
  trending?: boolean
  offerZone?: boolean
}) {
  const { location } = useLocation()
  const distance =
    location.lat != null && location.lng != null && lat != null && lng != null
      ? formatDistanceKm(haversineKm(location.lat, location.lng, Number(lat), Number(lng)))
      : null
  const locationLine = [distance, areaLabel(area, city)].filter(Boolean).join(' • ')

  return (
    <div className='font-(family-name:--font-dm-sans) md:hidden'>
      <div className='relative z-20 -mx-0.75 -mt-16.75 mb-1.5 rounded-[18px] bg-white/98 px-3.25 py-3.5 shadow-[0_0_8px_rgba(44,35,53,0.10)]'>
        <div className='flex items-start justify-between'>
          {showLogo && (
            <div className='relative mr-3 flex size-13 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#111111]'>
              {logo ? (
                <Image src={logo} alt='' fill sizes='52px' className='object-contain p-1' />
              ) : (
                <span className='text-[20px] font-bold text-white'>{name.charAt(0)}</span>
              )}
            </div>
          )}
          <div className='flex min-w-0 flex-1 flex-col gap-1 pr-3.5'>
            <h1 className='line-clamp-2 text-[22px] leading-6 font-bold tracking-[-0.5px] text-[#141414]'>{name}</h1>
            {subtitle && <p className='truncate text-[14px] leading-5 font-medium text-[#717171]'>{subtitle}</p>}
            {locationLine && (
              <a href='#location' className='flex min-w-0 items-center text-[14px] leading-5 font-medium text-[#9B969D]'>
                <span className='truncate'>{locationLine}</span>
                <ChevronDown className='ml-0.5 size-3.5 shrink-0 text-brand' />
              </a>
            )}
          </div>
          {rating.avg > 0 && (
            <a href='#reviews' className='ml-2.5 flex shrink-0 flex-col items-center'>
              <span className='flex h-5.5 items-center rounded-[11px] bg-[#3AA456] px-2.25 text-[13px] font-bold tracking-[0.24px] text-white'>
                {rating.avg.toFixed(1)} ★
              </span>
              <span className='mt-0.75 text-[8px] leading-2.5 font-medium tracking-[0.12px] text-[#787575] underline'>
                {rating.count.toLocaleString('en-US')} ratings
              </span>
            </a>
          )}
        </div>
      </div>

      <div className='my-2.5 flex items-center gap-1.5'>
        <div className='min-w-0 shrink'>
          <OpeningHoursPill hours={hours} variant='app' />
        </div>
        <div className='flex shrink-0 items-center gap-1.5'>
          <a href={directionsUrl(lat, lng, address || name)} target='_blank' rel='noopener noreferrer' aria-label='Get directions'>
            <Image src='/deals/Direction.webp' alt='' width={32} height={31} />
          </a>
          {phone && (
            <a href={`tel:${phone}`} aria-label={`Call ${name}`}>
              <Image src='/deals/Call.webp' alt='' width={32} height={31} />
            </a>
          )}
        </div>
      </div>

      {(trending || offerZone) && (
        <div className='flex flex-wrap items-center gap-1.5'>
          {trending && (
            <span className='flex h-5.25 items-center gap-1 rounded-[10px] border border-[#A5C569] bg-white px-2 text-[11px] leading-3.5 text-[#595B61]'>
              <Flame className='size-3 text-brand' strokeWidth={2} /> Trending
            </span>
          )}
          {offerZone && (
            <span className={cn('flex h-5.25 items-center gap-1 rounded-[10px] border border-[#FFBA50] bg-white px-2 text-[11px] leading-3.5 text-[#595B61]')}>
              <Gem className='size-3 text-[#F5A623]' strokeWidth={2} /> Offer Zone
            </span>
          )}
        </div>
      )}
    </div>
  )
}
