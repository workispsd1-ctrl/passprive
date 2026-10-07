'use client'

import { useState, useSyncExternalStore } from 'react'
import { ChevronDown, ChevronUp, CalendarX, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BookingDate, Slot } from '@/lib/booking/slots'

/** Horizontal date chips — app parity: BookTableModal / ServiceBookSlotScreen date rail. */
export function DateStrip({
  dates,
  selectedId,
  onSelect,
}: {
  dates: BookingDate[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className='scrollbar-hide -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1'>
      {dates.map(d => {
        const active = d.id === selectedId
        return (
          <button
            key={d.id}
            type='button'
            onClick={() => onSelect(d.id)}
            className={cn(
              'flex w-16 shrink-0 flex-col items-center rounded-2xl border py-2 transition-colors',
              active ? 'border-[#FF4800] bg-[#FF4800]/5' : 'border-gray-200 hover:border-gray-400',
            )}
          >
            <span className={cn('text-[10px] font-semibold uppercase', active ? 'text-[#FF4800]' : 'text-gray-400')}>
              {d.topLabel === 'Today' || d.topLabel === 'Tomorrow' ? d.topLabel : d.month}
            </span>
            <span className={cn('text-[18px] leading-tight font-bold', active ? 'text-[#FF4800]' : 'text-gray-900')}>
              {d.day}
            </span>
            <span className='text-[11px] text-gray-500'>{d.weekday}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Slot grid with the app's "show 6, then View all" behaviour. */
export function SlotGrid({
  slots,
  selected,
  onSelect,
  badge,
  emptyText,
}: {
  slots: Slot[]
  selected: string | null
  onSelect: (slot: Slot) => void
  /** e.g. a TIME_SLOT offer label shown under each time */
  badge?: string
  emptyText: string
}) {
  const [showAll, setShowAll] = useState(false)

  if (!slots.length) {
    return (
      <div className='flex flex-col items-center gap-2 py-8 text-center'>
        <CalendarX className='h-9 w-9 text-gray-300' />
        <p className='text-sm font-semibold text-gray-500'>{emptyText}</p>
        <p className='text-xs text-gray-400'>Please pick a different date</p>
      </div>
    )
  }

  const visible = showAll ? slots : slots.slice(0, 6)

  return (
    <div>
      <div className='grid grid-cols-3 gap-2.5 sm:grid-cols-4'>
        {visible.map(slot => {
          const active = slot.time24 === selected
          return (
            <button
              key={slot.absoluteMinutes}
              type='button'
              onClick={() => onSelect(slot)}
              className={cn(
                'flex flex-col items-center rounded-xl border px-1 py-2.5 transition-colors',
                active ? 'border-[#FF4800] bg-[#FF4800] text-white' : 'border-gray-200 text-gray-800 hover:border-gray-400',
              )}
            >
              <span className='text-[13px] font-bold'>{slot.label}</span>
              {badge && (
                <span className={cn('mt-0.5 text-[10px] font-semibold', active ? 'text-white/90' : 'text-green-700')}>
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {slots.length > 6 && (
        <button
          type='button'
          onClick={() => setShowAll(v => !v)}
          className='mx-auto mt-3 flex items-center gap-1 text-[13px] font-semibold text-gray-600 hover:text-gray-900'
        >
          {showAll ? <>View fewer slots <ChevronUp className='h-4 w-4' /></> : <>View all slots <ChevronDown className='h-4 w-4' /></>}
        </button>
      )}
    </div>
  )
}

export function TermsBlock({ terms }: { terms: string[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className='rounded-2xl border border-gray-200 bg-white p-4'>
      <button type='button' onClick={() => setOpen(v => !v)} className='flex w-full items-center justify-between'>
        <span className='text-[14px] font-bold text-gray-900'>Terms &amp; conditions</span>
        {open ? <ChevronUp className='h-4 w-4 text-gray-500' /> : <ChevronDown className='h-4 w-4 text-gray-500' />}
      </button>
      {open && (
        <ul className='mt-3 list-disc space-y-1.5 pl-5 text-[12px] leading-relaxed text-gray-600'>
          {terms.map(t => <li key={t}>{t}</li>)}
        </ul>
      )}
    </div>
  )
}

/**
 * Renders children only after mount — booking dates, slots and the default
 * meal depend on the visitor's clock, which the server can't know.
 */
const noopSubscribe = () => () => {}

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  if (!mounted) {
    return (
      <div className='flex justify-center py-16'>
        <Loader2 className='h-8 w-8 animate-spin text-gray-300' />
      </div>
    )
  }
  return <>{children}</>
}
