'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const CANCELLATION_REASONS = ['Plan change', 'Found a better offer elsewhere', 'Booked by mistake', 'Others']

type ExistingBooking = {
  id: string
  booking_date: string
  booking_time: string
  party_size: number | null
  booked_slot_label: string | null
  cover_charge_amount: number | string | null
}

type Conflict = { isSameSlot: boolean; booking: ExistingBooking }

function timeLabel(value: string | null) {
  const text = String(value ?? '').trim()
  if (/\b(AM|PM)\b/i.test(text)) return text.toUpperCase()
  const match = text.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return text || '—'
  const hours = Number(match[1])
  return `${hours % 12 || 12}:${match[2]} ${hours >= 12 ? 'PM' : 'AM'}`
}

function dateLabel(value: string) {
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

const primary = 'h-12 w-full rounded-full bg-brand text-[15px] font-semibold text-white hover:bg-brand-dark disabled:bg-[#C9C9CE]'

/**
 * Warns before booking a restaurant you already hold a table at — app parity:
 * components/useExistingBookingGuard.js. A second booking at another time can
 * still go ahead; the same slot can't. `bookHref` draws the cancelled receipt.
 */
export function useExistingBookingGuard({ restaurantId, bookHref }: { restaurantId: string; bookHref: string }) {
  const router = useRouter()
  const [conflict, setConflict] = useState<Conflict | null>(null)
  const [existing, setExisting] = useState<ExistingBooking | null>(null)
  const [step, setStep] = useState<'summary' | 'reason' | null>(null)
  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const continueRef = useRef<(() => void) | null>(null)

  async function check({ dateId, time24 }: { dateId: string; time24: string }, onContinue: () => void) {
    setError(null)
    let bookings: ExistingBooking[]
    try {
      const res = await fetch(`/api/bookings/dining/active?restaurant_id=${encodeURIComponent(restaurantId)}`)
      if (!res.ok) throw new Error()
      bookings = ((await res.json()) as { bookings: ExistingBooking[] }).bookings
    } catch {
      setError('We could not verify your existing bookings right now. Please try again.')
      return
    }
    if (!bookings.length) { onContinue(); return }
    const sameSlot = bookings.find(b => b.booking_date === dateId && b.booking_time.slice(0, 5) === time24)
    continueRef.current = onContinue
    setConflict({ isSameSlot: !!sameSlot, booking: sameSlot ?? bookings[0] })
  }

  async function cancelExisting() {
    if (!existing || !reason || cancelling) return
    setCancelling(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/dining/${existing.id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, replacing: true }),
      })
      if (!res.ok) throw new Error()
      router.push(`${bookHref}?booked=${existing.id}`)
    } catch {
      setError('Cancellation failed. Please try again.')
      setCancelling(false)
    }
  }

  const coverCharge = Number(existing?.cover_charge_amount || 0)
  const summary = existing
    ? `${timeLabel(existing.booked_slot_label || existing.booking_time)}, ${dateLabel(existing.booking_date)} for ${existing.party_size || '—'} guest${Number(existing.party_size) === 1 ? '' : 's'}`
    : '—'

  const modals = (
    <>
      <Dialog open={!!conflict} onOpenChange={open => { if (!open) setConflict(null) }}>
        <DialogContent className='sm:max-w-md'>
          <DialogTitle>{conflict?.isSameSlot ? 'Booking already exists' : 'Active booking found'}</DialogTitle>
          <DialogDescription>
            {conflict?.isSameSlot ? 'A booking already exists for the same slot.' : 'Cancel existing booking or continue booking.'}
          </DialogDescription>
          <div className='mt-2 flex flex-col gap-3'>
            {!conflict?.isSameSlot && (
              <button
                type='button'
                onClick={() => { setExisting(conflict?.booking ?? null); setConflict(null); setReason(''); setStep('summary') }}
                className='h-12 w-full rounded-full border-[1.5px] border-brand text-[15px] font-semibold text-brand hover:bg-brand-tint'
              >
                Cancel existing booking
              </button>
            )}
            <button
              type='button'
              className={primary}
              onClick={() => {
                const same = conflict?.isSameSlot
                setConflict(null)
                if (!same) continueRef.current?.()
              }}
            >
              {conflict?.isSameSlot ? 'Okay' : 'Continue booking'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={step === 'summary'} onOpenChange={open => { if (!open) setStep(null) }}>
        <DialogContent className='sm:max-w-md'>
          <DialogTitle>Cancel your booking</DialogTitle>
          <p className='mt-1 text-sm font-bold text-[#2C2D32]'>Booking details</p>
          <div className='rounded-xl border border-[#FFD9C7] bg-[#FFF7F3] p-3.5'>
            <p className='text-[13px] font-medium text-[#6B6B6B]'>You have a booking for</p>
            <p className='mt-0.5 text-[15px] font-semibold text-[#2C2D32]'>{summary}</p>
            <div className='my-3 h-px bg-[#F2E4DB]' />
            <p className='text-[13px] font-medium text-[#6B6B6B]'>Cancellation available till</p>
            <p className='mt-0.5 text-[15px] font-semibold text-[#2C2D32]'>Before your booking starts</p>
          </div>
          <p className='mt-1 text-sm font-bold text-[#2C2D32]'>Refund breakdown</p>
          <div className='rounded-xl border border-[#FFD9C7] bg-[#FFF7F3] p-3.5 text-sm'>
            <p className='flex justify-between font-medium text-[#424144]'>Total cover charge paid <b className='text-[#2C2D32]'>MUR {coverCharge}</b></p>
            <p className='mt-2 flex justify-between font-medium text-[#424144]'>Cancellation charges <b className='text-[#2C2D32]'>MUR 0</b></p>
            <div className='my-3 h-px bg-[#F2E4DB]' />
            <p className='flex justify-between font-medium text-[#424144]'>Refund amount will be <b className='text-[#2C2D32]'>MUR {coverCharge}</b></p>
          </div>
          <button type='button' className={cn(primary, 'mt-2')} onClick={() => setStep('reason')}>Cancel booking</button>
        </DialogContent>
      </Dialog>

      <Dialog open={step === 'reason'} onOpenChange={open => { if (!open) setStep(null) }}>
        <DialogContent className='sm:max-w-md'>
          <DialogTitle>Cancel booking</DialogTitle>
          <DialogDescription>Select your reason here</DialogDescription>
          <div className='flex flex-wrap gap-2.5'>
            {CANCELLATION_REASONS.map(item => (
              <button
                key={item}
                type='button'
                onClick={() => setReason(item)}
                className={cn(
                  'rounded-full border px-4 py-2.5 text-sm font-medium',
                  reason === item ? 'border-brand bg-brand text-white' : 'border-[#E5E5EA] text-[#2C2D32] hover:bg-gray-50',
                )}
              >
                {item}
              </button>
            ))}
          </div>
          {error && <p role='alert' className='text-sm font-medium text-red-600'>{error}</p>}
          <button type='button' disabled={!reason || cancelling} onClick={cancelExisting} className={cn(primary, 'mt-2')}>
            {cancelling ? 'Cancelling booking...' : 'Cancel booking'}
          </button>
        </DialogContent>
      </Dialog>
    </>
  )

  return { check, modals, error }
}
