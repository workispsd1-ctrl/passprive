'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'

import { SESSION_KEY_COVER_CHARGE as SESSION_KEY } from '@/lib/constants/sessionKeys'
import type { StoredBookingPayment } from '@/lib/booking/client'
import { PaymentErrorCard } from '@/components/shared/PaymentErrorCard'
import { PaymentSuccessful, ProcessingScreen } from '@/components/sections/dining/PaymentScreens'
import { DESIGN_UNIT, TYPE_SCALE } from '@/components/sections/dining/designUnit'
import { cn } from '@/lib/utils'

type Phase =
  | { status: 'loading'; message: string }
  | { status: 'error'; message: string }
  | { status: 'store-done'; storeName?: string; storeHref?: string }
  | { status: 'paid' }

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function sessionStatus(sessionId: string) {
  return fetch(`/api/pay-bill/status?session_id=${encodeURIComponent(sessionId)}`, { cache: 'no-store' })
    .then(res => res.json() as Promise<{ status?: string; reference?: string | null }>)
    .then(d => ({ status: String(d.status ?? ''), reference: d.reference ? String(d.reference) : '' }))
    .catch(() => ({ status: '', reference: '' }))
}

/**
 * Return page for booking payments (restaurants and service stores) — app
 * parity (b2ff80a): PaymentReturnScreen's MIPS + BOOKING branch: wait for the
 * payment (45s after a success, 8s otherwise), then for the backend to create
 * the booking — the session FINALIZED with its id, up to 40s — and show it.
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
      let stored: StoredBookingPayment | null = null
      try {
        const raw = sessionStorage.getItem(SESSION_KEY)
        if (raw) stored = JSON.parse(raw) as StoredBookingPayment
      } catch { /* ignore */ }
      const clear = () => { try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ } }

      const sessionId = searchParams.get('session_id') ?? searchParams.get('sessionId') ?? stored?.sessionId ?? ''
      if (!sessionId) {
        setPhase({ status: 'error', message: 'Payment session not found. Please try again.' })
        return
      }

      // app parity: waitForMipsPayment
      const paidBy = Date.now() + (searchParams.get('outcome') === 'success' ? 45000 : 8000)
      let paid = false
      for (;;) {
        const { status } = await sessionStatus(sessionId)
        if (status === 'VERIFIED_SUCCESS' || status === 'FINALIZED') { paid = true; break }
        if (status === 'VERIFIED_FAILED' || status === 'FAILED' || Date.now() > paidBy) break
        await sleep(2500)
      }
      if (!paid) {
        clear()
        setPhase({ status: 'error', message: 'Your payment was not completed successfully.' })
        return
      }

      setPhase({ status: 'loading', message: 'Confirming your booking…' })
      let bookingId = ''
      const confirmBy = Date.now() + 40000
      while (Date.now() < confirmBy) {
        const { status, reference } = await sessionStatus(sessionId)
        if (status === 'FINALIZED' && reference) { bookingId = reference; break }
        await sleep(2000)
      }
      clear()
      if (!bookingId) {
        setPhase({
          status: 'error',
          message: 'Your payment went through, but we are still confirming your booking. It will appear in Your Bookings shortly. If it does not, contact support and you will be refunded.',
        })
        return
      }

      if (stored?.kind === 'store') {
        // a cover charge on an existing appointment goes back to the bookings
        if (stored.coverRequest) { router.replace('/bookings'); return }
        // "Payment successful!", then "Appointment booked" on the salon's booking page (its website frame)
        if (stored.storeHref) {
          setPhase({ status: 'paid' })
          const qs = new URLSearchParams({ booked: bookingId, paid: '1' })
          setTimeout(() => router.replace(`${stored.storeHref}/book?${qs}`), 1600)
          return
        }
        setPhase({ status: 'store-done', storeName: stored.storeName, storeHref: stored.storeHref })
        return
      }
      // Figma "Flow Book Table": Payment successful! → the "Table booked" receipt on the booking page
      if (stored?.bookHref) {
        setPhase({ status: 'paid' })
        const qs = new URLSearchParams({ booked: bookingId, paid: '1' })
        if (stored.offerLabel) qs.set('offer', stored.offerLabel)
        setTimeout(() => router.replace(`${stored.bookHref}?${qs}`), 1600)
        return
      }
      router.replace('/bookings')
    }

    run()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main
      className={cn('min-h-screen flex flex-col items-center justify-center px-4 bg-white font-(family-name:--font-dm-sans) max-md:[--t:0.62px]', TYPE_SCALE)}
      style={{ ['--u' as string]: DESIGN_UNIT }}
    >
      {phase.status === 'loading' && <ProcessingScreen sub={phase.message} />}
      {phase.status === 'paid' && <PaymentSuccessful />}

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
