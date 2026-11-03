'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PaymentErrorCard } from '@/components/shared/PaymentErrorCard'
import { DESIGN_UNIT, TYPE_SCALE } from '@/components/sections/dining/designUnit'
import { PENDING_BILL_KEY, fmtMur, type PendingBillPayment } from '@/lib/payBill'
import { ORDER_CART_KEY } from '@/lib/orderCollect'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BillCleared, PaymentSuccessful, ProcessingScreen } from '@/components/sections/dining/PaymentScreens'

type Phase =
  | { status: 'loading' }
  | { status: 'success'; bill: PendingBillPayment; earned: number }
  | { status: 'done'; bill: PendingBillPayment; earned: number }
  | { status: 'error'; message: string; retryTo: string | null }

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** app parity: waitForMipsPayment — payment_sessions.status until paid, failed or out of time. */
async function waitForPayment(sessionId: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const status = await fetch(`/api/pay-bill/status?session_id=${encodeURIComponent(sessionId)}`, { cache: 'no-store' })
      .then(res => res.json() as Promise<{ status?: string }>)
      .then(d => String(d.status ?? ''))
      .catch(() => '')
    if (status === 'VERIFIED_SUCCESS' || status === 'FINALIZED') return true
    if (status === 'VERIFIED_FAILED' || status === 'FAILED') return false
    await sleep(2500)
  }
  return false
}

/**
 * After the payment page — app parity: PaymentReturnScreen's MIPS branch: wait
 * for the session (45s after a success, 8s otherwise), "Payment successful!"
 * for 1.8s, then BillPaymentSuccessScreen. The backend has finalized the bill
 * and credited the cashback; this page only reads the outcome.
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
      const sessionId = params.get('session_id') ?? pending?.sessionId ?? ''
      const retryTo = pending ? `/pay-bill?restaurant_id=${pending.restaurantId}` : null

      if (!sessionId) {
        setPhase({ status: 'error', message: 'We could not find the payment session to resume.', retryTo })
        return
      }
      const paid = await waitForPayment(sessionId, params.get('outcome') === 'success' ? 45000 : 8000)
      if (!paid) {
        setPhase({ status: 'error', message: 'Your payment was not completed successfully.', retryTo })
        return
      }
      try {
        sessionStorage.removeItem(PENDING_BILL_KEY)
        sessionStorage.removeItem(ORDER_CART_KEY)
      } catch { /* ignore */ }
      const bill = pending ?? { sessionId, merchantTrace: '', restaurantId: '', restaurantName: 'Your bill', location: '', originalAmount: 0, discount: 0, paidAmount: 0, cashback: 0 }
      setPhase({ status: 'success', bill, earned: bill.cashback })
      setTimeout(() => setPhase({ status: 'done', bill, earned: bill.cashback }), 1800)
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
  if (bill.orderItems?.length) return <OrderPlaced bill={bill} />
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

/** After an Order & Collect payment — app parity: OrderPlacedScreen.jsx. */
function OrderPlaced({ bill }: { bill: PendingBillPayment }) {
  return (
    <main className='mx-auto flex min-h-[70vh] max-w-lg flex-col px-4 py-10 font-(family-name:--font-dm-sans)'>
      <span className='mx-auto flex size-20 items-center justify-center rounded-full bg-brand-tint text-brand'><ShoppingBag className='size-9' /></span>
      <h1 className='mt-4 text-center font-(family-name:--font-libre-baskerville) text-3xl font-bold text-[#2C2D32] italic'>Order placed</h1>
      <p className='mt-1 text-center text-[15px] font-semibold text-[#2C2D32]'>{bill.restaurantName}</p>
      {bill.location && <p className='text-center text-sm text-[#6B6B6B]'>{bill.location}</p>}
      <h2 className='mt-8 text-base font-bold text-[#2C2D32]'>Order details</h2>
      <ul className='mt-2 divide-y divide-[#EFEFEF]'>
        {bill.orderItems?.map(item => (
          <li key={item.id} className='flex justify-between gap-4 py-2.5 text-sm text-[#2C2D32]'>
            <span>{item.qty} × {item.name}</span>
            <span className='shrink-0 font-medium'>MUR {fmtMur(item.price * item.qty)}</span>
          </li>
        ))}
      </ul>
      <p className='mt-2 flex justify-between border-t border-[#2C2D32] pt-3 text-base font-bold text-[#2C2D32]'>Paid <span>MUR {fmtMur(bill.paidAmount)}</span></p>
      <Link href='/help' className='mt-6 rounded-2xl bg-[#F6F6F6] p-4 text-sm hover:bg-[#EFEFEF]'>
        <span className='block font-semibold text-[#2C2D32]'>Need help with this payment?</span>
        <span className='font-semibold text-brand'>Contact help &amp; support</span>
      </Link>
      <Link href={bill.restaurantId ? `/dining/${bill.restaurantId}` : '/'} className='mt-6 flex h-12 items-center justify-center rounded-full bg-brand font-semibold text-white hover:bg-brand-dark'>Done</Link>
    </main>
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
