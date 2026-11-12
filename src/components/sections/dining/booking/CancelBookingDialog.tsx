'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// app parity: PaymentSuccessScreen.jsx CANCELLATION_REASONS
const REASONS = ['Plan change', 'Found a better offer elsewhere', 'Booked by mistake', 'Others']

/**
 * "Cancel your booking" reason sheet — app parity: PaymentSuccessScreen.jsx,
 * opened from the booking receipt's "Might need to cancel?" row. The API
 * re-checks that the booking can still be cancelled; on success the receipt
 * refreshes into its "Booking cancelled" state.
 */
export function CancelBookingDialog({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const router = useRouter()
  const [reason, setReason] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not cancel this booking right now.')
    }
    setBusy(false)
  }

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center' onClick={() => !busy && onClose()}>
      <div role='dialog' aria-modal='true' aria-labelledby='cancel-title' className='w-full max-w-sm rounded-2xl bg-white p-6 text-left' onClick={e => e.stopPropagation()}>
        <p id='cancel-title' className='text-[17px] font-bold text-gray-900'>Cancel your booking</p>
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
          <button type='button' disabled={busy} onClick={onClose} className='flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50'>
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
  )
}
