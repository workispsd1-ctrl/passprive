'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { hasLiveProposal, proposalCoverAmount, proposalLabel, proposalPayNow, type ProposalRow } from '@/lib/booking/status'
import { initiateCoverRequestPayment } from '@/lib/booking/client'
import { useBookingPayment } from '@/components/shared/useBookingPayment'
import { cn } from '@/lib/utils'

const ERRORS: Record<string, string> = {
  proposal_expired: 'This proposal is no longer available.',
  not_found: 'This booking could not be found.',
}

const fmt = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 2 })

/**
 * "New time proposed" with accept / decline — app parity: BookingProposalBanner.jsx
 * + ProposalRequestBox (b2ff80a). Store appointments get proposals too, and a
 * proposal can ask for a cover charge: accepting then goes straight to paying it.
 */
export function BookingProposalBanner({
  booking,
  kind = 'restaurant',
  merchantId,
  restaurantName,
  bookHref,
  className,
}: {
  booking: ProposalRow & { id: string }
  kind?: 'restaurant' | 'store'
  /** the restaurant / store — needed to pay a cover charge asked with the new time */
  merchantId?: string
  restaurantName?: string | null
  /** the restaurant's booking page, to come back to the receipt once paid */
  bookHref?: string
  className?: string
}) {
  const router = useRouter()
  const payment = useBookingPayment()
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null)
  const [confirmDecline, setConfirmDecline] = useState(false)
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null)
  // read the clock once on mount; the server re-checks when answering
  const [now] = useState(() => Date.now())

  const live = hasLiveProposal(booking, now, kind)
  if (!notice && !live) return null
  const label = live ? proposalLabel(booking) : ''
  const name = restaurantName || (kind === 'store' ? 'The store' : 'The restaurant')
  const what = kind === 'store' ? 'appointment' : 'table'
  const cover = proposalCoverAmount(booking)
  const payNow = proposalPayNow(booking)

  async function respond(accept: boolean) {
    if (busy) return
    setConfirmDecline(false)
    setBusy(accept ? 'accept' : 'decline')
    // open the bank's window inside the click, in case accepting leaves a cover charge to pay
    const payTo = accept && payNow > 0 ? merchantId : undefined
    try {
      const url = kind === 'store' ? `/api/bookings/store/${booking.id}/proposal` : `/api/bookings/dining/${booking.id}/proposal`
      if (payTo) {
        await payment.run(async () => {
          const data = await post(url, accept)
          if (!data.coverRequested || !(data.coverDue > 0)) throw new Accepted(data)
          return initiateCoverRequestPayment(kind, payTo, booking.id, { bookHref })
        })
        return
      }
      const data = await post(url, accept)
      if (accept && data.coverRequested) {
        setNotice({ title: 'New time accepted', body: `Pay the cover charge to confirm your ${what} for ${label}.` })
        return
      }
      setNotice(
        accept
          ? { title: 'Booking confirmed', body: `Your ${what} is now booked for ${label}.` }
          : { title: 'Booking cancelled', body: 'You declined the new time, so this booking has been cancelled.' },
      )
    } catch (err) {
      if (err instanceof Accepted) {
        // accepted, but there was nothing to pay after all
        setNotice({ title: 'Booking confirmed', body: `Your ${what} is now booked for ${label}.` })
      } else {
        setNotice({ title: 'Could not update booking', body: err instanceof Error ? err.message : 'Please check your connection and try again.' })
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      {label && (
        <div className={cn('rounded-2xl border border-brand-tint-strong bg-brand-tint p-4', className)}>
          <p className='text-[11px] font-bold tracking-wider text-brand'>NEW TIME PROPOSED</p>
          <p className='mt-1 text-sm leading-5 text-gray-800'>
            {name} can&apos;t take you at your chosen time and proposed <span className='font-bold'>{label}</span>
            {cover > 0 && (
              <>, with a <span className='font-bold'>MUR {fmt(cover)}</span> cover charge that comes off your bill</>
            )}
            .
          </p>
          <div className='mt-3 flex gap-2'>
            <button
              type='button'
              disabled={!!busy}
              onClick={() => setConfirmDecline(true)}
              className='flex h-10 flex-1 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60'
            >
              {busy === 'decline' ? <Loader2 className='size-4 animate-spin' /> : 'Decline'}
            </button>
            <button
              type='button'
              disabled={!!busy}
              onClick={() => respond(true)}
              className='flex h-10 flex-[1.4] items-center justify-center rounded-full bg-brand text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60'
            >
              {busy === 'accept' ? <Loader2 className='size-4 animate-spin' /> : payNow > 0 ? `Accept & pay MUR ${fmt(payNow)}` : 'Accept new time'}
            </button>
          </div>
        </div>
      )}

      <Dialog open={confirmDecline} onOpenChange={setConfirmDecline}>
        <DialogContent className='sm:max-w-sm'>
          <DialogTitle>Decline the new time?</DialogTitle>
          <DialogDescription>Your booking at {name} will be cancelled.</DialogDescription>
          <div className='mt-2 flex gap-2'>
            <button type='button' onClick={() => setConfirmDecline(false)} className='h-10 flex-1 rounded-full border border-gray-300 text-sm font-semibold text-gray-900 hover:bg-gray-50'>Keep booking</button>
            <button type='button' onClick={() => respond(false)} className='h-10 flex-1 rounded-full bg-red-600 text-sm font-semibold text-white hover:bg-red-700'>Decline</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!notice} onOpenChange={open => { if (!open) { setNotice(null); router.refresh() } }}>
        <DialogContent className='sm:max-w-sm'>
          <DialogTitle>{notice?.title}</DialogTitle>
          <DialogDescription>{notice?.body}</DialogDescription>
          <button type='button' onClick={() => { setNotice(null); router.refresh() }} className='mt-2 h-10 rounded-full bg-brand text-sm font-semibold text-white hover:bg-brand-dark'>OK</button>
        </DialogContent>
      </Dialog>

      {payment.overlay}
    </>
  )
}

type ProposalAnswer = { coverRequested: boolean; coverDue: number }

/** Accepted, with nothing left to pay — ends the payment attempt without an error. */
class Accepted extends Error {
  constructor(readonly answer: ProposalAnswer) {
    super('accepted')
  }
}

async function post(url: string, accept: boolean): Promise<ProposalAnswer> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accept }),
  }).catch(() => null)
  const data = (await res?.json().catch(() => ({}))) as { error?: string; coverRequested?: boolean; coverDue?: number } | undefined
  if (!res?.ok) throw new Error(ERRORS[data?.error ?? ''] ?? 'Please check your connection and try again.')
  return { coverRequested: !!data?.coverRequested, coverDue: Number(data?.coverDue) || 0 }
}
