'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

import { SESSION_KEY_DINING_PAYMENT as SESSION_KEY } from '@/lib/constants/sessionKeys'
import { PaymentLoadingScreen } from '@/components/shared/PaymentLoadingScreen'
import { PaymentErrorCard } from '@/components/shared/PaymentErrorCard'

type Phase =
  | { status: 'loading'; message: string }
  | { status: 'error'; message: string; canRetry: boolean }

interface StoredSession {
  sessionId: string
  merchantTrace: string
  bookingId: string
  restaurantId: string
  billAmount: number
  cashbackRate: number
}

function PaymentReturnInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
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
      const restaurantId = stored?.restaurantId ?? ''
      const billAmount = stored?.billAmount ?? 0

      if (!sessionId) {
        setPhase({ status: 'error', message: 'Payment session not found. Please try again.', canRetry: true })
        return
      }

      // Verify payment and credit cashback in one server-side call
      setPhase({ status: 'loading', message: 'Verifying your payment…' })
      let verifyData: Record<string, unknown>
      try {
        const vRes = await fetch('/api/payments/dining/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            merchant_trace: merchantTrace,
            status: urlStatus,
            bill_amount: billAmount,
            restaurant_id: restaurantId,
          }),
        })
        verifyData = await vRes.json() as Record<string, unknown>
        if (!vRes.ok) throw new Error((verifyData?.error as string) ?? 'Payment verification failed')
      } catch (err) {
        try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
        setPhase({
          status: 'error',
          message: err instanceof Error ? err.message : 'Could not verify payment. Please contact support.',
          canRetry: false,
        })
        return
      }

      const txStatus = String(
        verifyData?.status ?? verifyData?.payment_status ?? verifyData?.transaction_status ??
        verifyData?.outcome ?? verifyData?.inferred_outcome ?? verifyData?.result ?? ''
      ).toLowerCase()
      const SUCCESS_STATUSES = ['success', 'approved', 'completed', 'authorized', 'finalized', 'paid', 'verified_success']
      const authCode = verifyData?.authorization_code ?? verifyData?.auth_code ?? verifyData?.authCode
      const paymentOk =
        verifyData?.verified === true ||
        SUCCESS_STATUSES.includes(txStatus) ||
        String(verifyData?.gateway_status) === '0' ||
        String(verifyData?.result_description ?? '').toLowerCase() === 'approved' ||
        (!!authCode && !['failed', 'declined', 'error', 'cancelled'].includes(txStatus))
      if (!paymentOk) {
        try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
        const msg = String(verifyData?.message ?? verifyData?.error ?? 'Payment was not successful.')
        setPhase({ status: 'error', message: msg, canRetry: true })
        return
      }

      const earned = (verifyData.cashback_credited as number | undefined) ?? 0

      try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }

      router.replace(`/bookings/${bookingId}?bill_paid=1&earned=${earned}`)
    }

    run()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      {phase.status === 'loading' && <PaymentLoadingScreen message={phase.message} />}

      {phase.status === 'error' && (
        <PaymentErrorCard
          message={phase.message}
          onRetry={phase.canRetry ? () => router.replace(`/bookings/${bookingId}`) : undefined}
          onSecondary={() => router.replace('/support')}
          secondaryLabel="Contact support"
        />
      )}
    </main>
  )
}

export default function DiningPaymentReturnPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
      </main>
    }>
      <PaymentReturnInner />
    </Suspense>
  )
}
