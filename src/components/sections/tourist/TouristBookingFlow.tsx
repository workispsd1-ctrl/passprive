'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Check, ChevronLeft, Info, Minus, Phone, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  MAX_GUESTS,
  PAYMENT_LABELS,
  bookingOptions,
  bookingTotal,
  bookingWindow,
  dateKey,
  durationLabel,
  packagesForTab,
  parseDateKey,
  quickDates,
  sessionTabs,
  shortDateLabel,
  type TourPackage,
} from '@/lib/touristBooking'

const formatRs = (v: number) => `Rs ${Math.round(v).toLocaleString('en-US')}`

interface Props {
  placeName: string
  placeHref: string
  phone: string | null
  advanceDays: number | null
  packages: TourPackage[]
  pricing: { price: number; was: number | null }
  /** accepted payment methods; empty or 'free' = free entry */
  payments: string[]
}

/**
 * Tourist "Check availability" — app parity: TouristCheckAvailabilityScreen.jsx
 * (package tabs → Add → summary with date / guests / options → proceed).
 *
 * The app's final step only shows a "Booking confirmed" alert: there is no
 * tourist bookings table, so nothing is saved. Rather than tell web visitors
 * they've booked when they haven't, the last step here is honest about that
 * and points them to the operator.
 */
export function TouristBookingFlow({ placeName, placeHref, phone, advanceDays, packages, pricing, payments }: Props) {
  const range = useMemo(() => bookingWindow(advanceDays), [advanceDays])
  const chips = useMemo(() => quickDates(range), [range])
  const tabs = useMemo(() => sessionTabs(packages), [packages])

  const [tabKey, setTabKey] = useState(tabs[0]?.key)
  const [addedKey, setAddedKey] = useState<string | null>(null)
  const [guests, setGuests] = useState(2)
  const [day, setDay] = useState(dateKey(range.min))
  const [optionKey, setOptionKey] = useState<string | null>(null)
  const [requested, setRequested] = useState(false)

  const isFree = !payments.length || payments.includes('free')
  const visible = packagesForTab(packages, tabKey)
  const pkg = packages.find(p => p.key === addedKey) ?? null
  const options = bookingOptions(pkg, pricing)
  const option = options.find(o => o.key === optionKey) ?? options[options.length - 1] ?? null
  const total = pkg ? bookingTotal(pkg.price, guests) : 0
  const date = parseDateKey(day)

  if (isFree) {
    return (
      <div className='mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center'>
        <Check className='mx-auto h-12 w-12 rounded-full bg-green-50 p-2.5 text-green-600' />
        <p className='mt-3 text-xl font-extrabold text-gray-900'>Free entry</p>
        <p className='mt-1 text-sm text-gray-500'>No booking is required for {placeName}. Enjoy your visit!</p>
        <Link href={placeHref} className='mt-5 inline-block rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-dark'>
          Back to {placeName}
        </Link>
      </div>
    )
  }

  if (requested && pkg) {
    return (
      <div className='mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6'>
        <p className='text-lg font-extrabold text-gray-900'>Your selection</p>
        <div className='mt-3 space-y-1.5 rounded-xl bg-gray-50 p-4 text-sm text-gray-700'>
          <p className='font-semibold text-gray-900'>{pkg.title}</p>
          <p>{guests} guest{guests === 1 ? '' : 's'}{date ? ` · ${shortDateLabel(date)}` : ''}</p>
          {option && <p>{option.label}</p>}
          <p className='pt-1 text-base font-bold text-gray-900'>Total {formatRs(total)}</p>
        </div>
        <p className='mt-4 flex items-start gap-2 text-sm text-gray-600'>
          <Info className='mt-0.5 h-4 w-4 shrink-0 text-brand' />
          Online booking for tourist places isn’t live on PassPrivé yet — nothing has been reserved. Contact {placeName} to book this slot.
        </p>
        <p className='mt-3 text-xs text-gray-500'>
          Accepted payment: {payments.map(p => PAYMENT_LABELS[p] ?? p).join(', ')}
        </p>
        <div className='mt-5 flex flex-col gap-2'>
          {phone && (
            <a href={`tel:${phone}`} className='flex items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-bold text-white hover:bg-brand-dark'>
              <Phone className='h-4 w-4' /> Call {placeName}
            </a>
          )}
          <button type='button' onClick={() => setRequested(false)} className='rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50'>
            Change selection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-5'>
      {!packages.length ? (
        <div className='rounded-2xl border border-gray-200 bg-white p-8 text-center'>
          <p className='font-semibold text-gray-800'>No tours are listed for {placeName} yet.</p>
          <Link href={placeHref} className='mt-3 inline-block text-sm font-semibold text-brand'>Back to {placeName}</Link>
        </div>
      ) : (
        <div className='rounded-2xl border border-gray-200 bg-white'>
          {tabs.length > 1 && (
            <div className='scrollbar-hide flex gap-6 overflow-x-auto border-b border-gray-100 px-4'>
              {tabs.map(t => (
                <button
                  key={t.key}
                  type='button'
                  onClick={() => setTabKey(t.key)}
                  className={cn(
                    'shrink-0 border-b-2 py-3 text-[14px] transition-colors',
                    t.key === tabKey ? 'border-brand font-semibold text-gray-900' : 'border-transparent text-gray-600 hover:text-gray-900',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <ul className='divide-y divide-gray-100'>
            {visible.map(p => {
              const added = p.key === addedKey
              const duration = durationLabel(p.durationMinutes)
              return (
                <li key={p.key} className='flex items-start justify-between gap-4 px-4 py-4'>
                  <div className='min-w-0'>
                    <p className='text-[15px] font-bold text-gray-900'>{p.title}</p>
                    <p className='mt-1 text-[12px] text-gray-500'>
                      <span className='text-[14px] font-bold text-brand'>{formatRs(p.price)}</span> onwards
                      {duration && ` · Total ${duration}`}
                    </p>
                    {p.description && <p className='mt-1.5 line-clamp-2 text-[12px] text-gray-600'>{p.description}</p>}
                    {p.includes && <p className='mt-1 text-[11px] text-gray-400'>Includes: {p.includes}</p>}
                  </div>
                  <button
                    type='button'
                    onClick={() => { setAddedKey(p.key); setOptionKey(null) }}
                    className={cn(
                      'shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors',
                      added ? 'bg-brand text-white' : 'border border-brand text-brand hover:bg-brand-tint',
                    )}
                  >
                    {added ? 'Added' : 'Add'}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {pkg && (
        <div className='flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5'>
          <div>
            <p className='mb-3 flex items-center gap-1.5 text-[14px] font-bold text-gray-900'>
              <CalendarDays className='h-4 w-4' /> Select date
            </p>
            <div className='scrollbar-hide -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1'>
              {chips.map(c => (
                <button
                  key={c.key}
                  type='button'
                  onClick={() => setDay(c.key)}
                  className={cn(
                    'flex w-20 shrink-0 flex-col items-center rounded-2xl border py-2 transition-colors',
                    c.key === day ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-400',
                  )}
                >
                  <span className={cn('text-[12px] font-semibold', c.key === day ? 'text-brand' : 'text-gray-800')}>{c.top}</span>
                  <span className='text-[11px] text-gray-500'>{c.sub}</span>
                </button>
              ))}
              <label className='flex shrink-0 cursor-pointer items-center rounded-2xl border border-gray-200 px-3 text-[12px] font-semibold text-gray-700 hover:border-gray-400'>
                Other date
                <input
                  type='date'
                  className='ml-2 text-[12px]'
                  min={dateKey(range.min)}
                  max={dateKey(range.max)}
                  value={day}
                  onChange={e => e.target.value && setDay(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <p className='text-[14px] font-bold text-gray-900'>Guests</p>
            <div className='flex items-center gap-3'>
              <button type='button' aria-label='Fewer guests' disabled={guests <= 1} onClick={() => setGuests(g => g - 1)} className='rounded-full border border-gray-300 p-1.5 disabled:opacity-40'>
                <Minus className='h-4 w-4' />
              </button>
              <span className='w-6 text-center text-[15px] font-bold'>{guests}</span>
              <button type='button' aria-label='More guests' disabled={guests >= MAX_GUESTS} onClick={() => setGuests(g => g + 1)} className='rounded-full border border-gray-300 p-1.5 disabled:opacity-40'>
                <Plus className='h-4 w-4' />
              </button>
            </div>
          </div>

          <div>
            <p className='mb-2 text-[14px] font-bold text-gray-900'>Options</p>
            <div className='flex flex-col gap-2'>
              {options.map(o => {
                const active = o.key === option?.key
                return (
                  <button
                    key={o.key}
                    type='button'
                    onClick={() => setOptionKey(o.key)}
                    className={cn('flex items-start justify-between gap-3 rounded-xl border p-3 text-left', active ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-400')}
                  >
                    <div>
                      <p className='text-[14px] font-semibold text-gray-900'>{o.label}</p>
                      <p className='text-[12px] text-gray-500'>{o.sub}</p>
                    </div>
                    <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', active ? 'border-brand' : 'border-gray-300')}>
                      {active && <span className='h-2.5 w-2.5 rounded-full bg-brand' />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className='flex items-center justify-between border-t border-gray-100 pt-4'>
            <div>
              <p className='text-[12px] text-gray-500'>{guests} × {formatRs(pkg.price)}</p>
              <p className='text-[18px] font-extrabold text-gray-900'>{formatRs(total)}</p>
            </div>
            <button type='button' onClick={() => setRequested(true)} className='rounded-full bg-brand px-6 py-3 text-[14px] font-bold text-white hover:bg-brand-dark'>
              Proceed
            </button>
          </div>
        </div>
      )}

      {packages.length > 0 && (
        <Link href={placeHref} className='flex items-center justify-center gap-1 text-[13px] text-gray-500 hover:text-gray-800'>
          <ChevronLeft className='h-4 w-4' /> Back to {placeName}
        </Link>
      )}
    </div>
  )
}
