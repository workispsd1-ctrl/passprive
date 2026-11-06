'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react'
import type { ProfileBooking } from '@/lib/services/profileSummary'
import { cn } from '@/lib/utils'
import { BOOKING_CARD_UNIT } from './units'

const HEADING = 'text-[calc(24*var(--u))] leading-28 font-bold text-[#2C2D32]'
const ARROW = 'absolute top-142.5 z-10 hidden size-40 items-center justify-center rounded-full bg-white text-[#1F1F1F] shadow-[0_calc(4*var(--u))_calc(4*var(--u))_rgba(0,0,0,0.25)] lg:flex'

function statusTone(status: string) {
  return ['confirmed', 'accepted'].includes(status.toLowerCase())
    ? 'border-[#4CAF50] text-[#4CAF50]'
    : 'border-[#FFB020] text-[#FFB020]'
}

/** One "Your upcoming booking" card — 528×229, photo hero (150) over a date · time · guests row. */
function BookingCard({ b }: { b: ProfileBooking }) {
  const info = [
    { icon: Calendar, text: b.date },
    { icon: Clock, text: b.time },
    ...(b.guests ? [{ icon: Users, text: `${b.guests} Guest${b.guests === 1 ? '' : 's'}` }] : []),
  ].filter(i => i.text)

  return (
    <Link
      href={b.href}
      className={cn(
        'relative block h-229 w-528 shrink-0 snap-start overflow-hidden rounded-[calc(25.83*var(--u))] bg-white shadow-[0_calc(6.46*var(--u))_calc(19.37*var(--u))_rgba(0,0,0,0.15)]',
        BOOKING_CARD_UNIT,
      )}
    >
      {/* hero-section */}
      <div className='relative h-150 overflow-hidden bg-[#2C2D32]'>
        {b.image && <Image src={b.image} alt='' fill sizes='(min-width: 1024px) 28vw, 90vw' className='object-cover' />}
        <span aria-hidden className='absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.6)_25%,rgba(0,0,0,0)_75%)]' />
        <span aria-hidden className='absolute inset-y-0 left-0 w-362 bg-[linear-gradient(270deg,rgba(24,24,24,0)_0%,rgba(24,24,24,0.5)_100%)]' />

        <div className='absolute top-16 left-26 max-w-340'>
          <p className='text-[calc(17.76*var(--u))] leading-23 text-white/80 uppercase'>Your upcoming booking</p>
          <p className='truncate text-[calc(32.29*var(--u))] leading-42 font-extrabold tracking-[-0.01em] text-white'>{b.name}</p>
        </div>

        <span
          className={cn(
            'absolute right-20 bottom-16.5 flex h-34 items-center rounded-full border-[length:calc(1.61*var(--u))] bg-black/60 px-13 text-[calc(16.15*var(--u))] leading-21 font-bold uppercase',
            statusTone(b.status),
          )}
        >
          {b.status}
        </span>

        {/* white notch holding the category art */}
        <span aria-hidden className='absolute bottom-0 left-0 h-84 w-98.5 rounded-tr-[calc(55*var(--u))] bg-white'>
          <Image
            src={b.kind === 'dining' ? '/assets/nav/dining.webp' : '/assets/nav/wellness.webp'}
            alt=''
            width={190}
            height={211}
            className='absolute top-37.25 left-9.75 h-46.75 w-42 object-contain drop-shadow-[0_calc(2.43*var(--u))_calc(2.43*var(--u))_rgba(0,0,0,0.1)]'
          />
        </span>
      </div>

      {/* info-section */}
      <div className='flex h-79 items-center justify-between pr-45 pl-26'>
        {info.map(({ icon: Icon, text }) => (
          <span key={text} className='flex items-center gap-9.75 text-[calc(21*var(--u))] leading-27 font-semibold whitespace-nowrap text-[#1A1A1A]'>
            <Icon className='size-26 shrink-0' strokeWidth={2.4} />
            {text}
          </span>
        ))}
      </div>
    </Link>
  )
}

/** "Active bookings" — horizontally scrolling cards, 20 apart, with round prev/next buttons on desktop. */
export function ProfileActiveBookings({ bookings }: { bookings: ProfileBooking[] }) {
  const scroller = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })

  const measure = useCallback(() => {
    const el = scroller.current
    if (!el) return
    setEdges({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 })
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  const page = (dir: 1 | -1) => {
    const el = scroller.current
    const card = el?.firstElementChild as HTMLElement | null
    if (!el || !card) return
    el.scrollBy({ left: dir * (card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0')), behavior: 'smooth' })
  }

  return (
    <section className='relative'>
      <h2 className={HEADING}>Active bookings</h2>

      {bookings.length === 0 ? (
        <p className='mt-20 flex h-229 items-center justify-center rounded-[calc(25.83*var(--u))] border border-dashed border-[#D5D5D5] text-[calc(16*var(--u))] text-[#717171]'>
          No upcoming bookings
        </p>
      ) : (
        <>
          {/* padding + negative margin keep the card shadows from being clipped */}
          <div
            ref={scroller}
            onScroll={measure}
            className='scrollbar-hide -mx-16 -mb-24 flex snap-x scroll-px-16 gap-20 overflow-x-auto px-16 pt-20 pb-24 lg:-mx-20 lg:scroll-px-20 lg:px-20'
          >
            {bookings.map(b => <BookingCard key={b.key} b={b} />)}
          </div>
          {!edges.start && (
            <button type='button' aria-label='Previous bookings' onClick={() => page(-1)} className={cn(ARROW, '-left-20')}>
              <ChevronLeft className='size-24' strokeWidth={2.2} />
            </button>
          )}
          {!edges.end && (
            <button type='button' aria-label='Next bookings' onClick={() => page(1)} className={cn(ARROW, '-right-20')}>
              <ChevronRight className='size-24' strokeWidth={2.2} />
            </button>
          )}
        </>
      )}
    </section>
  )
}
