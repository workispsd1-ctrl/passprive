'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PaymentErrorCard } from '@/components/shared/PaymentErrorCard'
import { DESIGN_UNIT, TYPE_SCALE } from '@/components/sections/dining/designUnit'
import { isPaymentSuccess } from '@/lib/utils/payment'
import { PENDING_BILL_KEY, fmtMur, type PendingBillPayment } from '@/lib/payBill'
import { cn } from '@/lib/utils'
import { BillCleared, PaymentSuccessful, ProcessingScreen } from '@/components/sections/dining/PaymentScreens'

type Phase =
  | { status: 'loading' }
  | { status: 'success'; bill: PendingBillPayment; earned: number }
  | { status: 'done'; bill: PendingBillPayment; earned: number }
  | { status: 'error'; message: string; retryTo: string | null }

/**
 * Back from the bank's card page — app parity: PaymentReturnScreen (verify +
 * finalize-bill, both in /api/payments/dining/verify) then
 * BillPaymentSuccessScreen. UI from the Figma frames: "Processing…", then
 * "Payment successful!", then the "Bill cleared" receipt.
 */
function ReturnInner() {
  const params = useSearchParams()
  const router = useRouter()
  const ran = useRef(false)
  const [phase, setPhase] = useState<Phase>({ status: 'loading' })

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    ;(async () => {
      let pending: PendingBillPayment | null = null
      try {
        const raw = sessionStorage.getItem(PENDING_BILL_KEY)
        if (raw) pending = JSON.parse(raw) as PendingBillPayment
      } catch { /* ignore */ }
      const sessionId = params.get('session_id') ?? params.get('sessionId') ?? pending?.sessionId ?? ''
      const merchantTrace = params.get('merchant_trace') ?? params.get('merchantTrace') ?? pending?.merchantTrace ?? ''
      const outcome = params.get('outcome') ?? params.get('status') ?? params.get('payment_status') ?? ''
      const retryTo = pending ? `/pay-bill?restaurant_id=${pending.restaurantId}` : null

      if (!sessionId) {
        setPhase({ status: 'error', message: 'We couldn’t find this payment. If you were charged, contact support.', retryTo })
        return
      }
      try {
        const res = await fetch('/api/payments/dining/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, merchant_trace: merchantTrace, status: outcome }),
        })
        const data = (await res.json()) as Record<string, unknown>
        if (!res.ok) throw new Error((data.error as string) ?? 'Payment verification failed')
        if (!isPaymentSuccess(data)) {
          setPhase({ status: 'error', message: String(data.message ?? data.error ?? 'The payment didn’t go through. You were not charged.'), retryTo })
          return
        }
        try { sessionStorage.removeItem(PENDING_BILL_KEY) } catch { /* ignore */ }
        const earned = Number(data.cashback_credited) || pending?.cashback || 0
        const bill = pending ?? { sessionId, merchantTrace, restaurantId: '', restaurantName: 'Your bill', location: '', originalAmount: 0, discount: 0, paidAmount: 0, cashback: earned }
        setPhase({ status: 'success', bill, earned })
        // Figma: "Payment successful!" for a moment, then the receipt
        setTimeout(() => setPhase({ status: 'done', bill, earned }), 1600)
      } catch (err) {
        setPhase({ status: 'error', message: err instanceof Error ? err.message : 'Could not verify the payment. Please contact support.', retryTo: null })
      }
    })()
  }, [params])

  if (phase.status === 'loading') return <ProcessingScreen />
  if (phase.status === 'success') return <PaymentSuccessful />
  if (phase.status === 'error') {
    return (
      <div className='flex min-h-[70vh] items-center justify-center px-4'>
        <PaymentErrorCard
          message={phase.message}
          onRetry={phase.retryTo ? () => router.replace(phase.retryTo!) : undefined}
          onSecondary={() => router.replace('/support')}
          secondaryLabel='Contact support'
        />
      </div>
    )
  }

  const { bill, earned } = phase
  const share = () => {
    const text = `I paid MUR ${fmtMur(bill.paidAmount)} at ${bill.restaurantName} via PassPrivé!`
    if (navigator.share) navigator.share({ text }).catch(() => {})
    else navigator.clipboard?.writeText(text).catch(() => {})
  }
  return (
    <BillCleared
      name={bill.restaurantName}
      location={bill.location}
      originalAmount={bill.originalAmount}
      paidAmount={bill.paidAmount}
      saved={bill.discount}
      earned={earned}
      onShare={share}
      onDone={() => router.replace(bill.restaurantId ? `/dining/${bill.restaurantId}` : '/')}
    />
  )
}

export default function BillPaymentReturnPage() {
  return (
    <main className={cn('min-h-screen bg-white font-(family-name:--font-dm-sans) max-md:[--t:0.62px]', TYPE_SCALE)} style={{ ['--u' as string]: DESIGN_UNIT }}>
      <Suspense fallback={<ProcessingScreen />}>
        <ReturnInner />
      </Suspense>
    </main>
  )
}
