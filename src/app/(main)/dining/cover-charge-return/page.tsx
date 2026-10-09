'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'

import { isPaymentSuccess } from '@/lib/utils/payment'
import { SESSION_KEY_COVER_CHARGE as SESSION_KEY } from '@/lib/constants/sessionKeys'
import { extractBooking } from '@/lib/booking/payload'
import type { StoredBookingPayment } from '@/lib/booking/client'
import { PaymentLoadingScreen } from '@/components/shared/PaymentLoadingScreen'
import { PaymentErrorCard } from '@/components/shared/PaymentErrorCard'

type Phase =
  | { status: 'loading'; message: string }
  | { status: 'error'; message: string }
  | { status: 'store-done'; storeName?: string; storeHref?: string }

/**
 * Return page for booking cover-charge payments (restaurants and service
 * stores) — app parity: PaymentReturnScreen.jsx's BOOKING branch: verify the
 * iVeri payment, then `finalize-booking`, which creates the booking.
 */
function CoverChargeReturnInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const ran = useRef(false)

  const [phase, setPhase] = useState<Phase>({ status: 'loading', message: 'Verifying your payment…' })

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    async function run() {
      const urlSessionId = searchParams.get('session_id') ?? searchParams.get('sessionId') ?? ''
      const urlMerchantTrace = searchParams.get('merchant_trace') ?? searchParams.get('merchantTrace') ?? ''
      const urlStatus = searchParams.get('outcome') ?? searchParams.get('status') ?? searchParams.get('payment_status') ?? ''

      let stored: StoredBookingPayment | null = null
      try {
        const raw = sessionStorage.getItem(SESSION_KEY)
        if (raw) stored = JSON.parse(raw) as StoredBookingPayment
      } catch { /* ignore */ }
      const clear = () => { try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ } }

      const sessionId = urlSessionId || stored?.sessionId || ''
      const merchantTrace = urlMerchantTrace || stored?.merchantTrace || ''

      if (!sessionId) {
        setPhase({ status: 'error', message: 'Payment session not found. Please try again.' })
        return
      }

      try {
        const vRes = await fetch('/api/payments/booking/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, merchant_trace: merchantTrace, status: urlStatus }),
        })
        const verifyData = await vRes.json() as Record<string, unknown>
        if (!vRes.ok) throw new Error((verifyData?.error as string) ?? 'Verification failed')
        if (!isPaymentSuccess(verifyData)) {
          throw new Error(String(verifyData?.message ?? verifyData?.error ?? 'Payment was not successful.'))
        }

        setPhase({ status: 'loading', message: 'Finalizing your booking…' })
        const fRes = await fetch('/api/payments/booking/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, merchant_trace: merchantTrace || undefined }),
        })
        const finalData = await fRes.json() as Record<string, unknown>
        if (!fRes.ok) throw new Error((finalData?.error as string) ?? 'Could not confirm your booking. Please contact support.')

        clear()
        if (stored?.kind === 'store') {
          setPhase({ status: 'store-done', storeName: stored.storeName, storeHref: stored.storeHref })
          return
        }
        const bookingId = extractBooking(finalData)?.id
        router.replace(bookingId ? `/bookings/${bookingId}?cover_paid=1` : '/bookings')
      } catch (err) {
        clear()
        setPhase({ status: 'error', message: err instanceof Error ? err.message : 'Could not verify payment. Please contact support.' })
      }
    }

    run()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      {phase.status === 'loading' && <PaymentLoadingScreen message={phase.message} />}

      {phase.status === 'error' && (
        <PaymentErrorCard
          message={phase.message}
          onSecondary={() => router.replace('/bookings')}
          secondaryLabel="Go to my bookings"
        />
      )}

      {phase.status === 'store-done' && (
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <CheckCircle2 className="h-14 w-14 text-green-600" />
          <p className="text-xl font-extrabold text-gray-900">Appointment booked</p>
          <p className="text-sm text-gray-500">
            Your cover charge is paid and your appointment{phase.storeName ? ` at ${phase.storeName}` : ''} is confirmed.
          </p>
          <Link
            href={phase.storeHref ?? '/wellness'}
            className="mt-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-dark"
          >
            Done
          </Link>
        </div>
      )}
    </main>
  )
}

export default function CoverChargeReturnPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand/70 animate-spin" />
      </main>
    }>
      <CoverChargeReturnInner />
    </Suspense>
  )
}
