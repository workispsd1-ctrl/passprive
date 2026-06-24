'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

import { isPaymentSuccess } from '@/lib/utils/payment'
import { SESSION_KEY_COVER_CHARGE as SESSION_KEY } from '@/lib/constants/sessionKeys'
import { PaymentLoadingScreen } from '@/components/shared/PaymentLoadingScreen'
import { PaymentErrorCard } from '@/components/shared/PaymentErrorCard'

type Phase =
  | { status: 'loading'; message: string }
  | { status: 'error'; message: string; canRetry: boolean; bookingId: string }

interface StoredSession {
  sessionId: string
  merchantTrace: string
  bookingId: string
  restaurantId: string
  amount: number
}

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

      let stored: StoredSession | null = null
      try {
        const raw = sessionStorage.getItem(SESSION_KEY)
        if (raw) stored = JSON.parse(raw) as StoredSession
      } catch { /* ignore */ }

      const sessionId = urlSessionId || stored?.sessionId || ''
      const merchantTrace = urlMerchantTrace || stored?.merchantTrace || ''
      const bookingId = stored?.bookingId ?? ''

      if (!sessionId) {
        setPhase({ status: 'error', message: 'Payment session not found. Please try again.', canRetry: false, bookingId })
        return
      }

      setPhase({ status: 'loading', message: 'Verifying your cover charge payment…' })
      let verifyData: Record<string, unknown>
      try {
        const vRes = await fetch('/api/payments/booking/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, merchant_trace: merchantTrace, status: urlStatus, booking_id: bookingId }),
        })
        verifyData = await vRes.json() as Record<string, unknown>
        if (!vRes.ok) throw new Error((verifyData?.error as string) ?? 'Verification failed')
      } catch (err) {
        try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
        setPhase({
          status: 'error',
          message: err instanceof Error ? err.message : 'Could not verify payment. Please contact support.',
          canRetry: false,
          bookingId,
        })
        return
      }

      if (!isPaymentSuccess(verifyData)) {
        try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
        const msg = String(verifyData?.message ?? verifyData?.error ?? 'Payment was not successful.')
        setPhase({ status: 'error', message: msg, canRetry: true, bookingId })
        return
      }

      try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }

      router.replace(bookingId ? `/bookings/${bookingId}?cover_paid=1` : '/bookings')
    }

    run()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      {phase.status === 'loading' && <PaymentLoadingScreen message={phase.message} />}

      {phase.status === 'error' && (
        <PaymentErrorCard
          message={phase.message}
          onRetry={phase.canRetry ? () => router.replace(phase.bookingId ? `/bookings/${phase.bookingId}` : '/bookings') : undefined}
          onSecondary={() => router.replace(phase.bookingId ? `/bookings/${phase.bookingId}` : '/bookings')}
          secondaryLabel="Go to booking"
        />
      )}
    </main>
  )
}

export default function CoverChargeReturnPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
      </main>
    }>
      <CoverChargeReturnInner />
    </Suspense>
  )
}
