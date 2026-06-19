'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle, Coins, RefreshCw } from 'lucide-react'
import { Suspense } from 'react'

const SESSION_KEY = 'pp_dining_payment_session'

type Phase =
  | { status: 'loading'; message: string }
  | { status: 'success'; earned: number; billAmount: number }
  | { status: 'error'; message: string; canRetry: boolean }

interface StoredSession {
  sessionId: string
  merchantTrace: string
  bookingId: string
  restaurantId: string
  billAmount: number
  cashbackRate: number
}

function isPaymentSuccess(data: Record<string, unknown>): boolean {
  const status = String(data?.status ?? data?.payment_status ?? data?.transaction_status ?? '').toLowerCase()
  if (status === 'success' || status === 'approved' || status === 'completed') return true
  const authCode = data?.authorization_code ?? data?.auth_code ?? data?.authCode
  if (authCode && status !== 'failed' && status !== 'declined' && status !== 'error') return true
  return false
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
      const urlStatus = searchParams.get('status') ?? searchParams.get('payment_status') ?? ''

      let stored: StoredSession | null = null
      try {
        const raw = sessionStorage.getItem(SESSION_KEY)
        if (raw) stored = JSON.parse(raw) as StoredSession
      } catch { /* ignore */ }

      const sessionId = urlSessionId || stored?.sessionId || ''
      const merchantTrace = urlMerchantTrace || stored?.merchantTrace || ''
      const restaurantId = stored?.restaurantId ?? ''
      const billAmount = stored?.billAmount ?? 0
      const cashbackRate = stored?.cashbackRate ?? 0.5

      if (!sessionId) {
        setPhase({ status: 'error', message: 'Payment session not found. Please try again.', canRetry: true })
        return
      }

      // Step 1: verify with gateway
      setPhase({ status: 'loading', message: 'Verifying your payment…' })
      let verifyData: Record<string, unknown>
      try {
        const vRes = await fetch('/api/payments/dining/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, merchant_trace: merchantTrace, status: urlStatus, payment_context: 'BILL_PAYMENT' }),
        })
        verifyData = await vRes.json() as Record<string, unknown>
        if (!vRes.ok) throw new Error((verifyData?.error as string) ?? 'Payment verification failed')
      } catch (err) {
        setPhase({
          status: 'error',
          message: err instanceof Error ? err.message : 'Could not verify payment. Please contact support.',
          canRetry: false,
        })
        return
      }

      if (!isPaymentSuccess(verifyData)) {
        const msg = String(verifyData?.message ?? verifyData?.error ?? 'Payment was not successful.')
        setPhase({ status: 'error', message: msg, canRetry: true })
        return
      }

      // Step 2: credit cashback
      setPhase({ status: 'loading', message: 'Crediting your PP Coins…' })
      let earned = 0
      try {
        const cRes = await fetch('/api/wallet/cashback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bill_amount: billAmount, restaurant_id: restaurantId }),
        })
        const cData = await cRes.json() as { cashback_credited?: number; error?: string }
        if (!cRes.ok) throw new Error(cData?.error ?? 'Failed to credit cashback')
        earned = cData.cashback_credited ?? Math.round(billAmount * cashbackRate / 100 * 100) / 100
      } catch (err) {
        setPhase({
          status: 'error',
          message: err instanceof Error ? err.message : 'Payment succeeded but cashback failed. Contact support.',
          canRetry: false,
        })
        return
      }

      try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }

      setPhase({ status: 'success', earned, billAmount })
      setTimeout(() => router.replace(`/bookings/${bookingId}`), 3000)
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
          <p className="text-2xl font-extrabold text-gray-900">Payment Successful!</p>
          <p className="text-sm text-gray-500">
            Your bill of <span className="font-semibold text-gray-800">Rs {phase.billAmount.toFixed(2)}</span> has been paid.
          </p>
          <div className="w-full bg-violet-50 border border-violet-100 rounded-2xl px-6 py-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Coins className="w-5 h-5 text-violet-500" />
              <p className="text-sm font-bold text-violet-700">Cashback Credited</p>
            </div>
            <p className="text-3xl font-extrabold text-violet-600">Rs {phase.earned.toFixed(2)}</p>
            <p className="text-xs text-violet-400 mt-1">PP Coins added to your wallet · 1 coin = Rs 1</p>
          </div>
          <p className="text-xs text-gray-400">Redirecting you back to your booking…</p>
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
                onClick={() => router.replace(`/bookings/${bookingId}`)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
            )}
            <button
              type="button"
              onClick={() => router.replace('/support')}
              className="w-full py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50"
            >
              Contact support
            </button>
          </div>
        </div>
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
