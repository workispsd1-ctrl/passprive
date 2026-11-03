'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { hasLiveProposal, proposalLabel, type ProposalRow } from '@/lib/booking/status'
import { cn } from '@/lib/utils'

const ERRORS: Record<string, string> = {
  proposal_expired: 'This proposal is no longer available.',
  not_found: 'This booking could not be found.',
}

/** "New time proposed" with accept / decline — app parity: BookingProposalBanner.jsx. */
export function BookingProposalBanner({
  booking,
  restaurantName,
  className,
}: {
  booking: ProposalRow & { id: string }
  restaurantName?: string | null
  className?: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null)
  const [confirmDecline, setConfirmDecline] = useState(false)
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null)
  // read the clock once on mount; the server re-checks when answering
  const [now] = useState(() => Date.now())

  if (!notice && !hasLiveProposal(booking, now)) return null
  const label = hasLiveProposal(booking, now) ? proposalLabel(booking) : ''

  async function respond(accept: boolean) {
    if (busy) return
    setConfirmDecline(false)
    setBusy(accept ? 'accept' : 'decline')
    try {
      const res = await fetch(`/api/bookings/dining/${booking.id}/proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setNotice({
          title: 'Could not update booking',
          body: ERRORS[data.error ?? ''] ?? 'Please check your connection and try again.',
        })
        return
      }
      setNotice(
        accept
          ? { title: 'Booking confirmed', body: `Your table is now booked for ${label}.` }
          : { title: 'Booking cancelled', body: 'You declined the new time, so this booking has been cancelled.' },
      )
    } catch {
      setNotice({ title: 'Could not update booking', body: 'Please check your connection and try again.' })
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
            {restaurantName || 'The restaurant'} can&apos;t seat you at your chosen time and proposed{' '}
            <span className='font-bold'>{label}</span>.
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
              className='flex h-10 flex-1 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60'
            >
              {busy === 'accept' ? <Loader2 className='size-4 animate-spin' /> : 'Accept'}
            </button>
          </div>
        </div>
      )}

      <Dialog open={confirmDecline} onOpenChange={setConfirmDecline}>
        <DialogContent className='sm:max-w-sm'>
          <DialogTitle>Decline new time?</DialogTitle>
          <DialogDescription>Your booking will be cancelled.</DialogDescription>
          <div className='mt-2 flex gap-2'>
            <button type='button' onClick={() => setConfirmDecline(false)} className='h-10 flex-1 rounded-full border border-gray-300 text-sm font-semibold text-gray-900 hover:bg-gray-50'>Keep</button>
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
    </>
  )
}
