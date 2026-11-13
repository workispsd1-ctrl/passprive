'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { startCoverRequestPayment } from '@/lib/booking/client'
import { hasOpenCoverRequest } from '@/lib/booking/status'
import type { CoverRequestFields } from '@/lib/types/bookings'
import { cn } from '@/lib/utils'

const fmt = (v: unknown) => Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })

function timeLeft(dueAt: string | null | undefined, now: number) {
  const ms = Date.parse(dueAt ?? '') - now
  if (!Number.isFinite(ms) || ms <= 0) return 'now'
  const mins = Math.ceil(ms / 60000)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

/**
 * "{Merchant} asks for a MUR X cover charge" with Pay / Decline — app parity:
 * components/CoverRequestBox.jsx. Paying goes to the card gateway with the
 * booking's id; declining cancels the booking (and refunds what was paid).
 */
export function CoverRequestBox({
  booking,
  kind,
  merchantId,
  merchantName,
  className,
}: {
  booking: CoverRequestFields & { id: string }
  kind: 'restaurant' | 'store'
  merchantId: string
  merchantName?: string | null
  className?: string
}) {
  const router = useRouter()
  const [now, setNow] = useState(() => Date.now())
  const [confirmDecline, setConfirmDecline] = useState(false)
  const [busy, setBusy] = useState<'pay' | 'decline' | null>(null)
  const [error, setError] = useState('')

  // app: re-checks the countdown every 30s
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  if (!hasOpenCoverRequest(booking, now)) return null

  const due = Number(booking.cover_request_amount) || 0
  const total = Number(booking.cover_request_total) || due
  const paid = Math.max(0, total - due)
  const name = merchantName || 'The restaurant'

  async function pay() {
    if (busy) return
    setBusy('pay')
    setError('')
    try {
      await startCoverRequestPayment(kind, merchantId, booking.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment could not be started. Please try again.')
      setBusy(null)
    }
  }

  async function decline() {
    if (busy) return
    setBusy('decline')
    setError('')
    const res = await fetch('/api/bookings/cover-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: booking.id, kind }),
    }).catch(() => null)
    setBusy(null)
    if (!res?.ok) {
      setError('We could not cancel this booking. Please try again.')
      return
    }
    setConfirmDecline(false)
    router.refresh()
  }

  return (
    <>
      <div className={cn('rounded-2xl border-[1.5px] border-[#FF4800] bg-white p-4 shadow-[0_4px_14px_rgba(255,72,0,0.18)]', className)}>
        <p className='text-[15px] leading-5 font-bold text-[#1C1007]'>
          {name} asks for a MUR {fmt(total)} cover charge
        </p>
        <p className='mt-1 text-[12.5px] leading-[17px] text-[#6B6670]'>
          {paid > 0 ? `MUR ${fmt(paid)} already paid. ` : ''}Pay within {timeLeft(booking.cover_request_due_at, now)} or the booking is cancelled. It comes off your bill.
        </p>
        {error && !confirmDecline && <p className='mt-2 text-[13px] font-medium text-[#D93B2B]'>{error}</p>}
        <div className='mt-3 flex gap-2.5'>
          <button
            type='button'
            disabled={!!busy}
            onClick={() => setConfirmDecline(true)}
            className='flex h-10 flex-1 items-center justify-center rounded-full border-[1.5px] border-[#D9D6DD] text-sm font-semibold text-[#1C1007] hover:bg-gray-50 disabled:opacity-60'
          >
            Decline
          </button>
          <button
            type='button'
            disabled={!!busy}
            onClick={pay}
            className='flex h-10 flex-[1.6] items-center justify-center gap-2 rounded-full bg-[#FF4800] text-sm font-semibold text-white hover:bg-[#E64200] disabled:opacity-70'
          >
            {busy === 'pay' && <Loader2 className='size-4 animate-spin' />}
            Pay MUR {fmt(due)}
          </button>
        </div>
      </div>

      <Dialog open={confirmDecline} onOpenChange={o => { if (!o && !busy) setConfirmDecline(false) }}>
        <DialogContent showCloseButton={false} className='gap-0 rounded-3xl bg-white p-6 text-center font-(family-name:--font-dm-sans) sm:max-w-sm'>
          <DialogTitle className='text-[18px] leading-6 font-bold text-[#1C1007]'>Decline the cover charge?</DialogTitle>
          <DialogDescription className='mt-2 text-[14px] leading-5 text-[#6B6670]'>
            Your booking at {name} will be cancelled. Any amount you already paid will be refunded.
          </DialogDescription>
          {error && <p className='mt-3 text-[13px] font-medium text-[#D93B2B]'>{error}</p>}
          <button
            type='button'
            onClick={decline}
            disabled={!!busy}
            className='mt-5 flex h-12 items-center justify-center rounded-full bg-[#FF4800] text-[15px] font-semibold text-white hover:bg-[#E64200] disabled:opacity-70'
          >
            {busy === 'decline' ? <Loader2 className='size-5 animate-spin' /> : 'Decline and cancel booking'}
          </button>
          <button type='button' onClick={() => setConfirmDecline(false)} disabled={!!busy} className='mt-1 h-11 text-[15px] font-semibold text-[#6B6670] disabled:opacity-50'>
            Keep booking
          </button>
        </DialogContent>
      </Dialog>
    </>
  )
}
