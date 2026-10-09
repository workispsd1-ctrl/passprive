'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronDown, Navigation, Phone, Share2, Star, Check } from 'lucide-react'
import { useLocation } from '@/lib/context/LocationContext'
import { cn, formatDistanceKm, haversineKm } from '@/lib/utils'
import type { OpeningHour, ServiceStore } from '@/lib/types/stores'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function toMinutes(t: string | null | undefined): number | null {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return Number.isFinite(h) ? h * 60 + (m || 0) : null
}

function fmt(mins: number): string {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`
}

function windowFor(hours: OpeningHour[], day: number) {
  const row = hours.find(h => h.day_of_week === day)
  if (!row || row.is_closed) return null
  const start = toMinutes(row.open_time)
  const end = toMinutes(row.close_time)
  return start == null || end == null ? null : { start, end }
}

/** app parity: ServiceStoreDetails.jsx `getOpenStatus` — handles past-midnight windows. */
function getOpenStatus(hours: OpeningHour[]): { isOpen: boolean; label: string } | null {
  if (!hours.length) return null
  const now = new Date()
  const day = now.getDay()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const today = windowFor(hours, day)
  if (today) {
    const wraps = today.end <= today.start
    if ((!wraps && nowMin >= today.start && nowMin <= today.end) || (wraps && nowMin >= today.start)) {
      return { isOpen: true, label: ` till ${fmt(today.end)}` }
    }
  }
  const yesterday = windowFor(hours, (day + 6) % 7)
  if (yesterday && yesterday.end <= yesterday.start && nowMin <= yesterday.end) {
    return { isOpen: true, label: ` till ${fmt(yesterday.end)}` }
  }

  for (let offset = 0; offset < 7; offset++) {
    const d = (day + offset) % 7
    const w = windowFor(hours, d)
    if (!w) continue
    if (offset === 0 && nowMin >= w.start) continue
    return { isOpen: false, label: ` · Opens ${offset === 0 ? 'Today' : DAY_NAMES[d].slice(0, 3)} at ${fmt(w.start)}` }
  }
  return { isOpen: false, label: '' }
}

function HoursDropdown({ hours }: { hours: OpeningHour[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const status = useMemo(() => getOpenStatus(hours), [hours])
  const today = new Date().getDay()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!status) return null

  return (
    <div ref={ref} className='relative'>
      <button
        type='button'
        onClick={() => setOpen(v => !v)}
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px]',
          status.isOpen ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50',
        )}
      >
        <span className={cn('font-semibold', status.isOpen ? 'text-green-700' : 'text-orange-600')}>
          {status.isOpen ? 'Open' : 'Closed'}
        </span>
        <span className='text-gray-600'>{status.label || (status.isOpen ? ' now' : '')}</span>
        <ChevronDown className={cn('h-3 w-3 text-gray-500 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className='absolute top-full left-0 z-40 mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg'>
          <p className='mb-2 px-2 text-[14px] font-bold text-gray-900'>Opening hours</p>
          <ul className='space-y-0.5'>
            {[1, 2, 3, 4, 5, 6, 0].map(d => {
              const row = hours.find(h => h.day_of_week === d)
              const w = windowFor(hours, d)
              return (
                <li
                  key={d}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-2 py-1 text-[13px]',
                    d === today && 'bg-gray-50 font-semibold',
                  )}
                >
                  <span className={d === today ? 'text-gray-900' : 'text-gray-500'}>{DAY_NAMES[d]}</span>
                  {!row || !w ? (
                    <span className='font-medium text-orange-500'>Closed</span>
                  ) : (
                    <span className='text-gray-700'>{fmt(w.start)} – {fmt(w.end)}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

interface Props {
  store: ServiceStore
  hours: OpeningHour[]
  rating: { avg: number; count: number }
}

/** app parity: ServiceStoreDetails.jsx top info row + status pill + action icons. */
export function ServiceHeader({ store, hours, rating }: Props) {
  const { location } = useLocation()
  const [copied, setCopied] = useState(false)

  const distance =
    location.lat != null && location.lng != null && store.lat != null && store.lng != null
      ? formatDistanceKm(haversineKm(location.lat, location.lng, store.lat, store.lng))
      : null
  const area = [store.location_name, store.city].filter(Boolean).join(', ')
  const categories = [store.category, store.subcategory].filter(Boolean).join(' • ')
  const address = store.address_line1 ?? area
  const directionsHref =
    store.lat != null && store.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || store.name)}`

  async function handleShare() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: store.name, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const actionClass =
    'flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-1.5 text-[12px] font-semibold text-gray-700 transition-colors hover:border-brand hover:text-brand'

  return (
    <div className='mt-4 md:mt-2'>
      <div className='flex items-start gap-3'>
        <div className='relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-900'>
          {store.logo_url ? (
            <Image src={store.logo_url} alt={store.name} fill className='object-cover' sizes='56px' />
          ) : (
            <span className='text-[22px] font-bold text-white'>{store.name[0]}</span>
          )}
        </div>

        <div className='min-w-0 flex-1'>
          <h1 className='text-[22px] leading-tight font-bold text-gray-900 md:text-[28px]'>{store.name}</h1>
          {categories && <p className='mt-0.5 truncate text-[13px] text-gray-500'>{categories}</p>}
          {(distance || area) && (
            <p className='mt-0.5 truncate text-[13px] font-medium text-brand'>
              {[distance, area].filter(Boolean).join(' • ')}
            </p>
          )}
        </div>

        {rating.avg > 0 && (
          <a href='#reviews' className='flex shrink-0 flex-col items-center'>
            <span className='inline-flex items-center gap-1 rounded-lg bg-green-700 px-2 py-1 text-[13px] font-bold text-white'>
              {rating.avg.toFixed(1)} <Star className='h-3 w-3 fill-white' />
            </span>
            <span className='mt-1 text-[11px] text-gray-500'>{rating.count.toLocaleString()} ratings</span>
          </a>
        )}
      </div>

      {address && <p className='mt-3 text-[12px] leading-snug text-gray-500'>{address}</p>}

      <div className='mt-4 flex flex-wrap items-center gap-2'>
        <HoursDropdown hours={hours} />
        <a href={directionsHref} target='_blank' rel='noopener noreferrer' className={actionClass}>
          <Navigation className='h-3.5 w-3.5' /> Direction
        </a>
        {store.phone && (
          <a href={`tel:${store.phone}`} className={actionClass}>
            <Phone className='h-3.5 w-3.5' /> Call
          </a>
        )}
        <button type='button' onClick={handleShare} className={actionClass}>
          {copied ? <Check className='h-3.5 w-3.5' /> : <Share2 className='h-3.5 w-3.5' />}
          {copied ? 'Link copied' : 'Share'}
        </button>
      </div>
    </div>
  )
}
