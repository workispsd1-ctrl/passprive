'use client'

import { useState } from 'react'
import { ChevronDown, MapPin, Navigation, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DAY_NAMES, formatMinutes, windowFor } from '@/lib/openingHours'
import type { HoursRow } from '@/lib/openingHours'
import { DetailSection } from './DetailSection'
import { WeekHours, useOpenStatus } from './OpeningHours'
import { directionsUrl } from './MerchantActions'

/**
 * Location — the map beside the address, directions / call, and the week's
 * opening hours. Replaces the per-page location blocks so every merchant
 * page ends the same way.
 */
export function DetailLocation({
  name,
  address,
  lat,
  lng,
  phone,
  hours = [],
}: {
  name: string
  address: string
  lat?: number | null
  lng?: number | null
  phone?: string | null
  hours?: HoursRow[]
}) {
  const { today, status } = useOpenStatus(hours)
  // phones start with today's hours only; the full week is one tap away
  const [weekOpen, setWeekOpen] = useState(false)
  const todayWindow = windowFor(hours, today)
  if (!address && (lat == null || lng == null)) return null
  const la = Number(lat)
  const lo = Number(lng)
  const hasCoords = lat != null && lng != null && Number.isFinite(la) && Number.isFinite(lo)

  return (
    <DetailSection id='location' title='Location & hours'>
      <div className='grid overflow-hidden rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.05)] md:grid-cols-[1.25fr_1fr]'>
        <div className='relative h-56 bg-[#EEF1F4] md:h-auto md:min-h-80'>
          {hasCoords ? (
            <iframe
              title={`Map showing ${name}`}
              loading='lazy'
              // Google's keyless embed renders as plain tiles — no WebGL needed (OSM's vector embed shows an error without it)
              src={`https://maps.google.com/maps?q=${la},${lo}&z=16&output=embed`}
              referrerPolicy='no-referrer-when-downgrade'
              className='absolute inset-0 h-full w-full border-0'
            />
          ) : (
            <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_center,#F7F8FA,#E9EDF1)] text-gray-400'>
              <MapPin className='size-8' />
              <span className='text-[12px]'>Map not available</span>
            </div>
          )}
        </div>

        <div className='flex flex-col bg-white p-5 md:p-6'>
          <p className='text-[16px] font-bold text-gray-900'>{name}</p>
          {address && <p className='mt-1 text-[13px] leading-5 text-gray-500'>{address}</p>}
          <div className='mt-4 flex gap-2'>
            <a
              href={directionsUrl(lat, lng, address || name)}
              target='_blank'
              rel='noopener noreferrer'
              className='flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#141414] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-black'
            >
              <Navigation className='size-3.5' /> Directions
            </a>
            {phone && (
              <a
                href={`tel:${phone}`}
                className='flex flex-1 items-center justify-center gap-1.5 rounded-full border border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-gray-800 transition-colors hover:border-brand hover:text-brand'
              >
                <Phone className='size-3.5' /> Call
              </a>
            )}
          </div>
          {hours.length > 0 && (
            <div className='mt-5 border-t border-gray-100 pt-4'>
              <button
                type='button'
                onClick={() => setWeekOpen(v => !v)}
                aria-expanded={weekOpen}
                className='flex w-full items-center justify-between gap-3 px-2.5 text-left md:pointer-events-none'
              >
                <span className='text-[13px] font-bold text-gray-900'>Opening hours</span>
                <ChevronDown className={cn('size-4 text-gray-500 transition-transform md:hidden', weekOpen && 'rotate-180')} />
              </button>
              {!weekOpen && (
                <p className='mt-1.5 flex items-center justify-between px-2.5 text-[13px] md:hidden'>
                  <span className='flex items-center gap-1.5'>
                    <span className={cn('size-1.5 rounded-full', status?.isOpen ? 'bg-[#1BA94C]' : 'bg-[#E5484D]')} />
                    <span className='font-semibold text-gray-900'>Today</span>
                    <span className='text-gray-400'>({DAY_NAMES[today]})</span>
                  </span>
                  <span className='text-gray-800 tabular-nums'>
                    {todayWindow ? `${formatMinutes(todayWindow.start)} – ${formatMinutes(todayWindow.end)}` : 'Closed'}
                  </span>
                </p>
              )}
              <WeekHours hours={hours} today={today} className={cn('mt-1.5', !weekOpen && 'hidden md:block')} />
            </div>
          )}
        </div>
      </div>
    </DetailSection>
  )
}
