'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { usePaymentWindow, type PaymentSession } from '@/lib/hooks/usePaymentWindow'

/** Where a booking payment ends, whatever page the gateway finishes on. */
export function bookingReturnHref({ sessionId, merchantTrace, outcome }: PaymentSession & { outcome?: string }) {
  const qs = new URLSearchParams({ session_id: sessionId, merchant_trace: merchantTrace })
  if (outcome) qs.set('outcome', outcome)
  return `/dining/cover-charge-return?${qs}`
}

/**
 * A booking payment on the bank's page in its own window — app parity
 * (b2ff80a): PaymentProcessing for BOOKING, now MIPS. `run` must be called
 * inside the click (pop-up blockers) with a function that starts the session;
 * when the session ends the page moves to the booking return page, which
 * waits for the booking to be confirmed. `overlay` covers the page meanwhile.
 */
export function useBookingPayment() {
  const router = useRouter()
  const bank = usePaymentWindow(end => router.replace(bookingReturnHref(end)))
  const [starting, setStarting] = useState(false)

  async function run(start: () => Promise<{ data: Record<string, unknown>; session: PaymentSession }>) {
    bank.open()
    setStarting(true)
    try {
      const { data, session } = await start()
      // false: the gateway took over this tab
      if (!bank.launch(data, session)) return
    } catch (err) {
      bank.close()
      throw err
    } finally {
      setStarting(false)
    }
  }

  const overlay = starting || bank.waiting ? (
    <div className='fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/95 px-6 text-center font-(family-name:--font-dm-sans)'>
      <Loader2 className='size-10 animate-spin text-[#FF4800]' />
      <p className='text-lg font-bold text-[#1C1007]'>{bank.waiting ? 'Waiting for your payment…' : 'Opening your bank’s secure page…'}</p>
      <p className='max-w-sm text-sm text-[#6B6670]'>
        {bank.waiting
          ? 'Enter your card details and the OTP in the bank’s secure window. We’ll confirm your booking as soon as it’s done.'
          : 'Please do not close this window.'}
      </p>
      {bank.waiting && (
        <div className='mt-2 flex flex-wrap justify-center gap-3'>
          <button type='button' onClick={bank.focus} className='h-11 rounded-full bg-[#FF4800] px-6 text-sm font-semibold text-white hover:bg-[#E64200]'>
            Show payment window
          </button>
          <button type='button' onClick={bank.cancel} className='h-11 rounded-full border border-[#D5D5D5] px-6 text-sm font-semibold text-[#5B5A5A] hover:border-[#BDBDBD]'>
            Cancel
          </button>
        </div>
      )}
    </div>
  ) : null

  return { run, overlay, busy: starting || !!bank.waiting }
}
