'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronRight, Clock, X } from 'lucide-react'
import { CancelBookingDialog } from './CancelBookingDialog'
import { cn } from '@/lib/utils'
import { getMerchantNow, longDate } from '@/lib/booking/slots'
import { t } from '@/components/sections/dining/designUnit'
import { CheckRings } from '@/components/sections/dining/PaymentScreens'
import { FlowLayout, type MerchantPanelData } from '@/components/sections/dining/MerchantFlowParts'
import { cancelDeadline } from './bookingTimes'
import { hasLiveProposal, isBookingConfirmed, isBookingRejected, type ProposalRow } from '@/lib/booking/status'
import { BookingProposalBanner } from '@/components/shared/BookingProposalBanner'
import { CoverRequestBox } from '@/components/shared/CoverRequestBox'
import type { CoverRequestFields } from '@/lib/types/bookings'
import { usePlatformFlags } from '@/lib/context/PlatformFlagsContext'

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
  /** this booking page — to come back to this receipt after paying a cover charge */
  bookHref: string
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
  // "Today" by the Mauritius calendar, wherever the browser is
  const [ty, tm, td] = getMerchantNow().dateId.split('-').map(Number)
  const today = new Date(ty, tm - 1, td)
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
 * table" with what happens next. Laid out like the booking steps before it:
 * the restaurant on the left, the receipt in the card (phones: stacked).
 */
export function BookingResult({ b, panel, backHref }: { b: BookingResultData; panel: MerchantPanelData; backHref: string }) {
  const router = useRouter()
  const { earn } = usePlatformFlags()
  const confirmed = isBookingConfirmed(b)
  const cancelled = isBookingRejected(b)
  const proposal = { ...b.proposal, id: b.id }
  const proposed = hasLiveProposal(proposal)
  // app parity (b2ff80a): PaymentSuccessScreen — the new time accepted, its cover charge still to pay
  const awaitingPay = !cancelled && b.coverRequest.cover_request_status === 'requested'

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

  const title = awaitingPay ? 'Accepted! Pay to confirm' : confirmed ? 'Table booked' : cancelled ? 'Booking cancelled' : 'Requested table'
  const badge = awaitingPay ? 'ACCEPTED · PAY TO CONFIRM' : confirmed ? 'CONFIRMED' : cancelled ? 'CANCELLED' : proposed ? 'NEW TIME' : 'REQUESTED'

  // the website frame of the booking steps — the restaurant on the left, the receipt in the card
  return (
    <FlowLayout r={panel} label='Your booking at' onBack={() => router.push(backHref)}>
      <div className='flex items-center' style={{ gap: t(24) }}>
        {confirmed && !awaitingPay ? (
          <CheckRings size={84} />
        ) : (
          <span className={cn('flex shrink-0 items-center justify-center rounded-full', cancelled ? 'bg-[#f2f2f2]' : 'bg-[#fff1eb]')} style={{ width: t(84), height: t(84) }}>
            <span className={cn('flex items-center justify-center rounded-full', cancelled ? 'bg-[#e2e2e2]' : 'bg-[#ffd9c7]')} style={{ width: t(62), height: t(62) }}>
              {cancelled
                ? <X className='text-[#5b5a5a]' style={{ width: t(30), height: t(30) }} />
                : <Clock className='text-[#ff4800]' style={{ width: t(30), height: t(30) }} />}
            </span>
          </span>
        )}
        <div className='min-w-0'>
          <h1
            className={cn('font-(family-name:--font-libre-baskerville) font-bold italic', awaitingPay ? 'text-[#ff4800]' : confirmed ? 'text-[#3aa456]' : cancelled ? 'text-[#2c2d32]' : 'text-[#ff4800]')}
            style={{ fontSize: t(44), letterSpacing: t(-1.5), lineHeight: t(52) }}
          >
            {title}
          </h1>
          <p className='font-semibold text-[#2c2d32]' style={{ marginTop: t(4), fontSize: t(24) }}>{b.restaurantName}</p>
        </div>
      </div>
      {confirmed && earn && b.rewardAmount > 0 && (
        <p className='font-medium text-[#3aa456]' style={{ marginTop: t(16), fontSize: t(18) }}>
          MUR {b.rewardAmount.toLocaleString('en-US')} Privé Credits pending · unlocks after your visit
        </p>
      )}
      {b.offer && !cancelled && (
        <p className='self-start rounded-full bg-[#fff1eb] font-semibold text-[#ff4800]' style={{ marginTop: t(16), padding: `${t(8)} ${t(20)}`, fontSize: t(20) }}>{b.offer}</p>
      )}

      <div className='grid lg:grid-cols-2' style={{ marginTop: t(32), gap: t(28) }}>
        <div className='border border-[#efefef]' style={{ borderRadius: t(24), padding: `${t(12)} ${t(24)}` }}>
          <div className='flex items-center justify-between' style={{ gap: t(12), padding: `${t(10)} 0` }}>
            <span className='font-bold text-[#2c2d32]' style={{ fontSize: t(22) }}>Booking details</span>
            <span
              className={cn('rounded-full text-center font-bold tracking-wider', awaitingPay ? 'bg-[#fff3e6] text-[#c46a12]' : confirmed ? 'bg-[#e8f6ec] text-[#2e8b4a]' : cancelled ? 'bg-[#f2f2f2] text-[#5b5a5a]' : 'bg-[#fff3e6] text-[#c46a12]')}
              style={{ padding: `${t(6)} ${t(14)}`, fontSize: t(15) }}
            >
              {badge}
            </span>
          </div>
          <Line label={longDate(b.date)} value={relDay(b.date)} />
          <Line label={meal} value={to12(b.time24)} />
          <Line label='Guests' value={`for ${b.guests}`} />
          {b.location && <Line label='Location' value={b.location} />}
          {b.code && <Line label='Booking code' value={b.code} />}
          {b.paid && <Line label='Cover charge' value='Paid — redeemed on your bill' />}
        </div>

        <div className='flex flex-col' style={{ gap: t(20) }}>
          {proposed && <BookingProposalBanner booking={proposal} merchantId={b.restaurantId} restaurantName={b.restaurantName} bookHref={b.bookHref} />}
          <CoverRequestBox booking={{ ...b.coverRequest, id: b.id }} kind='restaurant' merchantId={b.restaurantId} merchantName={b.restaurantName} bookHref={b.bookHref} />

      {!confirmed && !cancelled && !proposed && (
        <div className='bg-[#fff8f5]' style={{ borderRadius: t(24), padding: `${t(18)} ${t(28)}` }}>
          <p className='font-bold text-[#2c2d32]' style={{ fontSize: t(22) }}>What next?</p>
          <ul className='list-disc text-[#5b5a5a]' style={{ marginTop: t(8), paddingLeft: t(24), fontSize: t(18), lineHeight: 1.6 }}>
            <li>They will call you or confirm directly as soon as they check the request.</li>
            <li>It can take up to 45 mins to confirm.</li>
            <li>You can contact support, modify or cancel the request.</li>
          </ul>
        </div>
      )}

      {!cancelled && <div className='flex flex-col' style={{ gap: t(8), fontSize: t(18) }}>
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
        </div>
      </div>
      {cancelOpen && <CancelBookingDialog bookingId={b.id} onClose={() => setCancelOpen(false)} />}

      <Link href='/help' className='flex items-center justify-between bg-[#f6f6f6] hover:bg-[#efefef]' style={{ marginTop: t(28), borderRadius: t(24), padding: `${t(18)} ${t(28)}` }}>
        <span>
          <span className='block font-semibold text-[#2c2d32]' style={{ fontSize: t(20) }}>Need help with this booking?</span>
          <span className='flex items-center font-semibold text-[#ff4800]' style={{ fontSize: t(17), gap: t(4) }}>Contact help &amp; support <ChevronRight style={{ width: t(16), height: t(16) }} /></span>
        </span>
        <span className='flex items-center justify-center rounded-full bg-[#ff4800] font-bold text-white' style={{ width: t(40), height: t(40), fontSize: t(20) }}>!</span>
      </Link>

      <div className='mt-auto flex flex-col sm:flex-row' style={{ paddingTop: t(36), gap: t(16) }}>
        <Link
          href='/bookings'
          className='flex flex-1 items-center justify-center rounded-full border border-[#d5d5d5] font-semibold text-[#2c2d32] hover:border-[#bdbdbd]'
          style={{ height: t(81), fontSize: t(24) }}
        >
          View my bookings
        </Link>
        {/* app parity: PaymentSuccessScreen handleGoHome */}
        <button
          type='button'
          onClick={() => router.push('/')}
          className='flex flex-1 items-center justify-center rounded-full bg-[#ff4800] font-semibold text-white hover:bg-brand-dark'
          style={{ height: t(81), fontSize: t(24) }}
        >
          Done
        </button>
      </div>
    </FlowLayout>
  )
}
