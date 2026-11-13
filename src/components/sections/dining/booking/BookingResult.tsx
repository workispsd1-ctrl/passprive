'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronRight, Clock, X } from 'lucide-react'
import { CancelBookingDialog } from './CancelBookingDialog'
import { cn } from '@/lib/utils'
import { longDate } from '@/lib/booking/slots'
import { t } from '@/components/sections/dining/designUnit'
import { CheckRings } from '@/components/sections/dining/PaymentScreens'
import { cancelDeadline } from './bookingTimes'
import { hasLiveProposal, isBookingConfirmed, isBookingRejected, type ProposalRow } from '@/lib/booking/status'
import { BookingProposalBanner } from '@/components/shared/BookingProposalBanner'
import { CoverRequestBox } from '@/components/shared/CoverRequestBox'
import type { CoverRequestFields } from '@/lib/types/bookings'
import { usePlatformFlags } from '@/lib/context/PlatformFlagsContext'

const P = '/assets/pay-bill'

export type BookingResultData = {
  id: string
  code: string
  status: string
  date: string
  time24: string
  guests: number
  restaurantName: string
  location: string
  offer: string | null
  paid: boolean
  cancellation: { available: boolean; cutoffMinutes: number | null }
  /** the restaurant's counter-offer, when it made one */
  proposal: ProposalRow
  restaurantId: string
  /** the restaurant asking for a cover charge after booking (app: PaymentSuccessScreen CoverRequestBox) */
  coverRequest: CoverRequestFields
  rewardAmount: number
}

function to12(time24: string) {
  const [h, m] = time24.split(':').map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function relDay(dateId: string) {
  const [y, m, d] = dateId.split('-').map(Number)
  const day = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000)
  return diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : day.toLocaleDateString('en-US', { weekday: 'long' })
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between' style={{ gap: t(16), padding: `${t(12)} 0`, fontSize: t(20) }}>
      <span className='text-[#5b5a5a]'>{label}</span>
      <span className='text-right font-semibold text-[#2c2d32]'>{value}</span>
    </div>
  )
}

/**
 * Figma "Table booked" (11429:3212) / "Requested table" (11429:3283) — app
 * parity: PaymentSuccessScreen "Table booked!". A booking the restaurant has
 * confirmed reads "Table booked"; one still waiting on them reads "Requested
 * table" with what happens next.
 */
export function BookingResult({ b }: { b: BookingResultData }) {
  const router = useRouter()
  const { earn } = usePlatformFlags()
  const confirmed = isBookingConfirmed(b)
  const cancelled = isBookingRejected(b)
  const proposal = { ...b.proposal, id: b.id }
  const proposed = hasLiveProposal(proposal)

  // app parity: PaymentSuccessScreen re-reads the booking every 15s, so the restaurant's answer shows up here
  useEffect(() => {
    if (confirmed || cancelled) return
    const timer = setInterval(() => router.refresh(), 15000)
    return () => clearInterval(timer)
  }, [confirmed, cancelled, router])

  const meal = Number(b.time24.slice(0, 2)) >= 17 ? 'Dinner' : 'Lunch'
  const deadline = b.cancellation.available ? cancelDeadline(b.date, b.time24, b.cancellation.cutoffMinutes) : null
  // app parity: PaymentSuccessScreen canCancel — the restaurant allows it and the booking hasn't started (the API re-checks)
  const [now] = useState(() => Date.now())
  const canCancel = b.cancellation.available && !cancelled && new Date(`${b.date}T${b.time24.slice(0, 5)}:00+04:00`).getTime() > now
  const [cancelOpen, setCancelOpen] = useState(false)

  return (
    <div className='relative mx-auto flex w-full flex-col items-center text-center' style={{ maxWidth: t(760) }}>
      <Image
        src={`${P}/green-glow.svg`}
        alt=''
        width={824}
        height={828}
        aria-hidden='true'
        className={cn('pointer-events-none absolute left-1/2 max-w-none -translate-x-1/2', !confirmed && 'opacity-0')}
        style={{ top: t(-120), width: t(824), height: t(828) }}
      />

      <span className='relative'>
        {confirmed ? (
          <CheckRings />
        ) : cancelled ? (
          <span className='flex items-center justify-center rounded-full bg-[#f2f2f2]' style={{ width: t(110), height: t(110) }}>
            <span className='flex items-center justify-center rounded-full bg-[#e2e2e2]' style={{ width: t(80), height: t(80) }}>
              <X className='text-[#5b5a5a]' style={{ width: t(40), height: t(40) }} />
            </span>
          </span>
        ) : (
          <span className='flex items-center justify-center rounded-full bg-[#fff1eb]' style={{ width: t(110), height: t(110) }}>
            <span className='flex items-center justify-center rounded-full bg-[#ffd9c7]' style={{ width: t(80), height: t(80) }}>
              <Clock className='text-[#ff4800]' style={{ width: t(40), height: t(40) }} />
            </span>
          </span>
        )}
      </span>
      <h1
        className={cn('relative font-(family-name:--font-libre-baskerville) font-bold italic', confirmed ? 'text-[#3aa456]' : cancelled ? 'text-[#2c2d32]' : 'text-[#ff4800]')}
        style={{ marginTop: t(32), fontSize: t(54), letterSpacing: t(-2.78), lineHeight: t(60) }}
      >
        {confirmed ? 'Table booked' : cancelled ? 'Booking cancelled' : 'Requested table'}
      </h1>
      <p className='relative font-semibold text-[#2c2d32]' style={{ marginTop: t(10), fontSize: t(26) }}>{b.restaurantName}</p>
      {confirmed && earn && b.rewardAmount > 0 && (
        <p className='relative font-medium text-[#3aa456]' style={{ marginTop: t(10), fontSize: t(18) }}>
          MUR {b.rewardAmount.toLocaleString('en-US')} Privé Credits pending · unlocks after your visit
        </p>
      )}
      {b.offer && !cancelled && (
        <p className='relative rounded-full bg-[#fff1eb] font-semibold text-[#ff4800]' style={{ marginTop: t(16), padding: `${t(8)} ${t(20)}`, fontSize: t(20) }}>{b.offer}</p>
      )}

      <div className='relative w-full border border-[#efefef] bg-white text-left shadow-[4px_4px_47px_rgba(0,0,0,0.08)]' style={{ marginTop: t(32), borderRadius: t(28), padding: `${t(16)} ${t(28)}` }}>
        <div className='flex items-center justify-between' style={{ padding: `${t(8)} 0` }}>
          <span className='font-bold text-[#2c2d32]' style={{ fontSize: t(22) }}>Booking details</span>
          <span
            className={cn('rounded-full font-bold tracking-wider', confirmed ? 'bg-[#e8f6ec] text-[#2e8b4a]' : cancelled ? 'bg-[#f2f2f2] text-[#5b5a5a]' : 'bg-[#fff3e6] text-[#c46a12]')}
            style={{ padding: `${t(6)} ${t(14)}`, fontSize: t(15) }}
          >
            {confirmed ? 'CONFIRMED' : cancelled ? 'CANCELLED' : proposed ? 'NEW TIME' : 'REQUESTED'}
          </span>
        </div>
        <Line label={longDate(b.date)} value={relDay(b.date)} />
        <Line label={meal} value={to12(b.time24)} />
        <Line label='Guests' value={`for ${b.guests}`} />
        {b.location && <Line label='Location' value={b.location} />}
        {b.code && <Line label='Booking code' value={b.code} />}
        {b.paid && <Line label='Cover charge' value='Paid — redeemed on your bill' />}
      </div>

      {proposed && <BookingProposalBanner booking={proposal} restaurantName={b.restaurantName} className='relative mt-4 w-full text-left' />}
      <CoverRequestBox booking={{ ...b.coverRequest, id: b.id }} kind='restaurant' merchantId={b.restaurantId} merchantName={b.restaurantName} className='relative mt-4 w-full text-left' />

      {!confirmed && !cancelled && !proposed && (
        <div className='relative w-full rounded-[inherit] bg-[#fff8f5] text-left' style={{ marginTop: t(20), borderRadius: t(24), padding: `${t(18)} ${t(28)}` }}>
          <p className='font-bold text-[#2c2d32]' style={{ fontSize: t(22) }}>What next?</p>
          <ul className='list-disc text-[#5b5a5a]' style={{ marginTop: t(8), paddingLeft: t(24), fontSize: t(18), lineHeight: 1.6 }}>
            <li>They will call you or confirm directly as soon as they check the request.</li>
            <li>It can take up to 45 mins to confirm.</li>
            <li>You can contact support, modify or cancel the request.</li>
          </ul>
        </div>
      )}

      {!cancelled && <div className='relative flex w-full flex-col text-left' style={{ marginTop: t(20), gap: t(8), fontSize: t(18) }}>
        <p className='text-[#5b5a5a]'>
          <span className='font-semibold text-[#2c2d32]'>Need modifications? </span>
          {deadline ? `Valid till ${deadline}` : 'Contact the restaurant or support'}
        </p>
        {/* app parity: PaymentSuccessScreen "Might need to cancel?" opens the cancel sheet */}
        <button
          type='button'
          disabled={!canCancel}
          onClick={() => setCancelOpen(true)}
          className='flex items-center justify-between text-left text-[#5b5a5a] enabled:hover:text-[#2c2d32] disabled:cursor-default'
          style={{ gap: t(8) }}
        >
          <span>
            <span className={cn('font-semibold', canCancel ? 'text-[#2c2d32]' : 'text-[#b0b0b0]')}>Might need to cancel? </span>
            {canCancel
              ? deadline ? `100% refund till ${deadline}` : 'Cancel anytime before the booking starts'
              : 'Not eligible for cancellation'}
          </span>
          {canCancel && <ChevronRight className='shrink-0 text-[#ababab]' style={{ width: t(18), height: t(18) }} />}
        </button>
      </div>}
      {cancelOpen && <CancelBookingDialog bookingId={b.id} onClose={() => setCancelOpen(false)} />}

      <Link href='/help' className='relative flex w-full items-center justify-between bg-[#f6f6f6] text-left hover:bg-[#efefef]' style={{ marginTop: t(24), borderRadius: t(24), padding: `${t(18)} ${t(28)}` }}>
        <span>
          <span className='block font-semibold text-[#2c2d32]' style={{ fontSize: t(20) }}>Need help with this booking?</span>
          <span className='flex items-center font-semibold text-[#ff4800]' style={{ fontSize: t(17), gap: t(4) }}>Contact help &amp; support <ChevronRight style={{ width: t(16), height: t(16) }} /></span>
        </span>
        <span className='flex items-center justify-center rounded-full bg-[#ff4800] font-bold text-white' style={{ width: t(40), height: t(40), fontSize: t(20) }}>!</span>
      </Link>

      <div className='relative flex w-full flex-col sm:flex-row' style={{ marginTop: t(36), gap: t(16) }}>
        {/* app parity: PaymentSuccessScreen handleGoHome — there's no separate booking page */}
        <button
          type='button'
          onClick={() => router.push('/')}
          className='flex flex-1 items-center justify-center rounded-full bg-[#ff4800] font-semibold text-white hover:bg-brand-dark'
          style={{ height: t(81), fontSize: t(24) }}
        >
          Done
        </button>
      </div>
    </div>
  )
}
