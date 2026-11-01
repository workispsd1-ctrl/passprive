'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { ChevronDown, Clock } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { t } from '@/components/sections/dining/designUnit'
import {
  DAY_NAMES,
  WEEK_ORDER,
  formatMinutes,
  getOpenStatus,
  mauritiusNow,
  windowFor,
  type HoursRow,
} from '@/lib/openingHours'

// A per-minute clock: the open/closed state flips while the page is open.
const subscribeMinute = (onChange: () => void) => {
  const id = setInterval(onChange, 60_000)
  return () => clearInterval(id)
}
const currentMinute = () => Math.floor(Date.now() / 60_000)

export function useOpenStatus(hours: HoursRow[]) {
  const minute = useSyncExternalStore(subscribeMinute, currentMinute, currentMinute)
  return useMemo(() => {
    const at = new Date(minute * 60_000)
    return { status: getOpenStatus(hours, at), today: mauritiusNow(at).day }
  }, [hours, minute])
}

/** Monday–Sunday hours, today highlighted. */
export function WeekHours({ hours, today, className }: { hours: HoursRow[]; today: number; className?: string }) {
  return (
    <ul className={cn('space-y-0.5', className)}>
      {WEEK_ORDER.map(d => {
        const w = windowFor(hours, d)
        return (
          <li
            key={d}
            className={cn(
              'flex items-center justify-between gap-4 rounded-lg px-2.5 py-1.5 text-[13px]',
              d === today && 'bg-gray-50 font-semibold',
            )}
          >
            <span className={d === today ? 'text-gray-900' : 'text-gray-500'}>{DAY_NAMES[d]}</span>
            {w ? (
              <span className='text-gray-800 tabular-nums'>
                {formatMinutes(w.start)} – {formatMinutes(w.end)}
              </span>
            ) : (
              <span className='font-medium text-[#E5484D]'>Closed</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * "Open · Closes 10 PM ▾" — app parity: the detail screens' status pill; it
 * opens the week's hours.
 */
export function OpeningHoursPill({ hours, variant = 'web' }: { hours: HoursRow[]; /** 'app' — the app's grey "Open till 10 PM" pill */ variant?: 'web' | 'app' | 'figma' }) {
  const { status, today } = useOpenStatus(hours)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  if (!status) return null

  return (
    <div ref={ref} className='relative'>
      {variant === 'figma' ? (
        // desktop restaurant page — Figma "Dining - Pay Bill" status pill, in design units
        <button
          type='button'
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          className='inline-flex items-center rounded-full bg-[#f4f4f4] whitespace-nowrap'
          style={{ height: t(52.5), paddingLeft: t(17), paddingRight: t(20), gap: t(10), fontSize: t(24), lineHeight: t(34.4) }}
        >
          <span>
            <span className={cn('font-semibold', status.isOpen ? 'text-[#3aa456]' : 'text-[#C62828]')} style={{ letterSpacing: t(0.43) }}>
              {status.isOpen ? 'Open' : 'Closed'}
            </span>
            <span className='text-[#666]'>
              {status.isOpen ? ` ${status.detail.replace(/^Closes /, 'till ')}` : ` · ${status.detail}`}
            </span>
          </span>
          <Image
            src='/figma/detail/chevron-down.svg'
            alt=''
            width={8}
            height={15}
            className={cn('transition-transform', open ? 'rotate-90' : '-rotate-90')}
            style={{ width: t(7.5), height: t(15) }}
          />
        </button>
      ) : variant === 'app' ? (
        <button
          type='button'
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          className='inline-flex max-w-full items-center gap-1 rounded-full bg-[#F4F4F4] px-3 py-1.5 text-[14px]'
        >
          <span className='truncate'>
            <span className={cn('font-semibold tracking-[0.25px]', status.isOpen ? 'text-[#3AA456]' : 'text-[#C62828]')}>
              {status.isOpen ? 'Open' : 'Closed'}
            </span>
            <span className='text-[#666666]'>
              {status.isOpen ? ` ${status.detail.replace(/^Closes/, 'till')}` : ` · ${status.detail}`}
            </span>
          </span>
          <ChevronDown className={cn('size-3.5 shrink-0 text-[#666666] transition-transform', open && 'rotate-180')} />
        </button>
      ) : (
      <button
        type='button'
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors',
          status.isOpen ? 'border-[#CDEBD6] bg-[#F0FAF3] hover:bg-[#E5F6EA]' : 'border-[#FBD9C9] bg-[#FFF5F0] hover:bg-[#FFECE3]',
        )}
      >
        <span className={cn('size-1.5 rounded-full', status.isOpen ? 'bg-[#1BA94C]' : 'bg-[#E5484D]')} />
        <span className={cn('font-bold', status.isOpen ? 'text-[#167C3B]' : 'text-[#C2410C]')}>
          {status.isOpen ? 'Open now' : 'Closed'}
        </span>
        <span className='text-gray-600'>· {status.detail}</span>
        <ChevronDown className={cn('size-3.5 text-gray-500 transition-transform', open && 'rotate-180')} />
      </button>
      )}
      {open && (
        <div className='absolute top-full left-0 z-40 mt-2 w-72 rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.12)]'>
          <p className='mb-1.5 flex items-center gap-2 px-2.5 text-[14px] font-bold text-gray-900'>
            <Clock className='size-4 text-brand' /> Opening hours
          </p>
          <WeekHours hours={hours} today={today} />
        </div>
      )}
    </div>
  )
}
