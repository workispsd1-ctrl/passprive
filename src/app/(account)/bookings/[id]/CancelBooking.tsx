'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, ChevronRight, Loader2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// app parity: PaymentSuccessScreen.jsx CANCELLATION_REASONS
const REASONS = ['Plan change', 'Found a better offer elsewhere', 'Booked by mistake', 'Others']

function startsAt(date: string, time: string) {
  return new Date(`${date}T${time.slice(0, 5)}:00+04:00`) // Mauritius local time
}

/**
 * "Might need to cancel?" row + reason dialog — app parity: PaymentSuccessScreen.jsx.
 * Offered only when the restaurant allows cancellation and the booking is
 * active and hasn't started; the API re-checks all of that.
 */
export function CancelBooking({
  bookingId,
  bookingDate,
  bookingTime,
  isActive,
  cancellationAvailable,
  cutoffMinutes,
}: {
  bookingId: string
  bookingDate: string
  bookingTime: string
  isActive: boolean
  cancellationAvailable: boolean
  cutoffMinutes: number | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // read the clock once on mount; the API re-checks at submit time
  const [now] = useState(() => Date.now())

  const start = startsAt(bookingDate, bookingTime)
  const canCancel = cancellationAvailable && isActive && start.getTime() > now

  // app parity: "100% refund till <time>, today" when a cutoff is set
  const deadline =
    cutoffMinutes != null && Number.isFinite(cutoffMinutes)
      ? new Date(start.getTime() - cutoffMinutes * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : null

  async function confirm() {
    if (!reason) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/dining/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'We could not cancel this booking right now.')
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not cancel this booking right now.')
    }
    setBusy(false)
  }

  if (!canCancel) {
    return (
      <div className='flex items-start gap-3 px-5 py-4'>
        <Ban className='mt-0.5 h-4 w-4 shrink-0 text-gray-400' />
        <div>
          <p className='text-sm font-semibold text-gray-700'>Cancellation not available</p>
          <p className='mt-0.5 text-xs text-gray-400'>
            {!isActive ? 'This booking is no longer active' : 'Not eligible for cancellation'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        type='button'
        onClick={() => { setReason(null); setError(null); setOpen(true) }}
        className='flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50'
      >
        <XCircle className='mt-0.5 h-4 w-4 shrink-0 text-gray-600' />
        <div className='flex-1'>
          <p className='text-sm font-semibold text-gray-800'>Might need to cancel?</p>
          <p className='mt-0.5 text-xs text-gray-500'>
            {deadline ? `100% refund till ${deadline} on the booking day` : 'Cancel anytime before the booking starts'}
          </p>
        </div>
        <ChevronRight className='mt-0.5 h-4 w-4 text-gray-400' />
      </button>

      {open && (
        <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center' onClick={() => !busy && setOpen(false)}>
          <div role='dialog' aria-modal='true' aria-labelledby='cancel-title' className='w-full max-w-sm rounded-2xl bg-white p-6' onClick={e => e.stopPropagation()}>
            <p id='cancel-title' className='text-[17px] font-bold text-gray-900'>Cancel this booking?</p>
            <p className='mt-1 text-[13px] text-gray-500'>Tell us why you’re cancelling.</p>
            <div className='mt-4 flex flex-col gap-2'>
              {REASONS.map(r => (
                <button
                  key={r}
                  type='button'
                  onClick={() => setReason(r)}
                  className={cn(
                    'flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm',
                    reason === r ? 'border-brand bg-brand-tint font-semibold text-gray-900' : 'border-gray-200 text-gray-700 hover:border-gray-400',
                  )}
                >
                  {r}
                  <span className={cn('flex h-4 w-4 items-center justify-center rounded-full border-2', reason === r ? 'border-brand' : 'border-gray-300')}>
                    {reason === r && <span className='h-2 w-2 rounded-full bg-brand' />}
                  </span>
                </button>
              ))}
            </div>
            {error && <p className='mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600'>{error}</p>}
            <div className='mt-5 flex gap-2'>
              <button type='button' disabled={busy} onClick={() => setOpen(false)} className='flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50'>
                Keep booking
              </button>
              <button
                type='button'
                disabled={!reason || busy}
                onClick={confirm}
                className='flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40'
              >
                {busy && <Loader2 className='h-4 w-4 animate-spin' />} Cancel booking
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
