'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle, CalendarDays, RefreshCw } from 'lucide-react'
import { Suspense } from 'react'

const SESSION_KEY = 'pp_cover_charge_session'

type Phase =
  | { status: 'loading'; message: string }
  | { status: 'success'; amount: number; bookingId: string }
  | { status: 'error'; message: string; canRetry: boolean; bookingId: string }

interface StoredSession {
  sessionId: string
  merchantTrace: string
  bookingId: string
  restaurantId: string
  amount: number
}

function isPaymentSuccess(data: Record<string, unknown>): boolean {
  const status = String(data?.status ?? data?.payment_status ?? data?.transaction_status ?? '').toLowerCase()
  if (status === 'success' || status === 'approved' || status === 'completed') return true
  const authCode = data?.authorization_code ?? data?.auth_code ?? data?.authCode
  if (authCode && status !== 'failed' && status !== 'declined' && status !== 'error') return true
  return false
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
      const urlStatus = searchParams.get('status') ?? searchParams.get('payment_status') ?? ''

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
        setPhase({
          status: 'error',
          message: err instanceof Error ? err.message : 'Could not verify payment. Please contact support.',
          canRetry: false,
          bookingId,
        })
        return
      }

      if (!isPaymentSuccess(verifyData)) {
        const msg = String(verifyData?.message ?? verifyData?.error ?? 'Payment was not successful.')
        setPhase({ status: 'error', message: msg, canRetry: true, bookingId })
        return
      }

      try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }

      setPhase({ status: 'success', amount: stored?.amount ?? 0, bookingId })
      setTimeout(() => router.replace(bookingId ? `/bookings/${bookingId}` : '/bookings'), 3000)
    }

    run()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      {phase.status === 'loading' && (
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
          <p className="text-base font-semibold text-gray-700">{phase.message}</p>
          <p className="text-sm text-gray-400">Please do not close or refresh this page.</p>
        </div>
      )}

      {phase.status === 'success' && (
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
          <p className="text-2xl font-extrabold text-gray-900">Cover Charge Paid!</p>
          <p className="text-sm text-gray-500">
            Your cover charge of <span className="font-semibold text-gray-800">Rs {phase.amount.toFixed(2)}</span> has been paid.
          </p>
          <div className="w-full bg-violet-50 border border-violet-100 rounded-2xl px-6 py-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CalendarDays className="w-5 h-5 text-violet-500" />
              <p className="text-sm font-bold text-violet-700">Booking Confirmed</p>
            </div>
            <p className="text-xs text-violet-500 mt-1">Your cover charge will be redeemable at the restaurant</p>
          </div>
          <p className="text-xs text-gray-400">Redirecting you to your booking…</p>
        </div>
      )}

      {phase.status === 'error' && (
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <XCircle className="w-16 h-16 text-red-400" />
          <p className="text-xl font-extrabold text-gray-900">Payment unsuccessful</p>
          <p className="text-sm text-gray-500">{phase.message}</p>
          <div className="flex flex-col gap-2 w-full mt-2">
            {phase.canRetry && (
              <button
                type="button"
                onClick={() => router.replace(phase.bookingId ? `/bookings/${phase.bookingId}` : '/bookings')}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
            )}
            <button
              type="button"
              onClick={() => router.replace(phase.bookingId ? `/bookings/${phase.bookingId}` : '/bookings')}
              className="w-full py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50"
            >
              Go to booking
            </button>
          </div>
        </div>
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
