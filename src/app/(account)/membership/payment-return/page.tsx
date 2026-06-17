'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { Suspense } from 'react'

const SESSION_KEY = 'pp_payment_session'

type Phase =
  | { status: 'loading'; message: string }
  | { status: 'success' }
  | { status: 'error'; message: string; canRetry: boolean }

function isVerifiedPaymentSuccess(data: Record<string, unknown>): boolean {
  const status = String(data?.status ?? data?.payment_status ?? data?.transaction_status ?? '').toLowerCase()
  if (status === 'success' || status === 'approved' || status === 'completed') return true
  const authCode = data?.authorization_code ?? data?.auth_code ?? data?.authCode
  if (authCode && status !== 'failed' && status !== 'declined' && status !== 'error') return true
  return false
}

function PaymentReturnInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const ran = useRef(false)

  const [phase, setPhase] = useState<Phase>({ status: 'loading', message: 'Verifying your payment…' })

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    async function run() {
      // Read URL params first
      const urlSessionId = searchParams.get('session_id') ?? searchParams.get('sessionId') ?? ''
      const urlMerchantTrace = searchParams.get('merchant_trace') ?? searchParams.get('merchantTrace') ?? ''
      const urlStatus = searchParams.get('status') ?? searchParams.get('payment_status') ?? ''

      // Merge with sessionStorage
      let storedSessionId = ''
      let storedMerchantTrace = ''
      try {
        const raw = sessionStorage.getItem(SESSION_KEY)
        if (raw) {
          const stored = JSON.parse(raw) as { sessionId?: string; merchantTrace?: string }
          storedSessionId = stored.sessionId ?? ''
          storedMerchantTrace = stored.merchantTrace ?? ''
        }
      } catch { /* ignore */ }

      const sessionId = urlSessionId || storedSessionId
      const merchantTrace = urlMerchantTrace || storedMerchantTrace

      if (!sessionId) {
        setPhase({ status: 'error', message: 'Payment session not found. Please try again.', canRetry: true })
        return
      }

      // Step 1: verify
      setPhase({ status: 'loading', message: 'Verifying your payment…' })
      let verifyData: Record<string, unknown>
      try {
        const vRes = await fetch('/api/payments/membership/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, merchant_trace: merchantTrace, status: urlStatus }),
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

      if (!isVerifiedPaymentSuccess(verifyData)) {
        const msg = String(verifyData?.message ?? verifyData?.error ?? 'Payment was not successful.')
        setPhase({ status: 'error', message: msg, canRetry: true })
        return
      }

      // Step 2: activate
      setPhase({ status: 'loading', message: 'Activating your membership…' })
      try {
        const aRes = await fetch('/api/payments/membership/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        })
        const aData = await aRes.json() as Record<string, unknown>
        if (!aRes.ok) throw new Error((aData?.error as string) ?? 'Membership activation failed')
      } catch (err) {
        setPhase({
          status: 'error',
          message: err instanceof Error ? err.message : 'Payment succeeded but activation failed. Contact support.',
          canRetry: false,
        })
        return
      }

      // Clean up sessionStorage
      try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }

      setPhase({ status: 'success' })

      // Redirect to membership page after short delay
      setTimeout(() => router.replace('/membership'), 2500)
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
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
          <p className="text-2xl font-extrabold text-gray-900">Membership activated!</p>
          <p className="text-sm text-gray-500 max-w-xs">
            Welcome to PassPrivé. Your cashback benefits are now live. Redirecting you…
          </p>
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
                onClick={() => router.replace('/membership')}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
            )}
            <button
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

export default function PaymentReturnPage() {
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
