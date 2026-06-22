'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const RETURN_PATHS = [
  '/dining/cover-charge-return',
  '/membership/payment-return',
  '/payment-return',
]

export function PaymentRecovery() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip if already on a return page to avoid redirect loops
    if (RETURN_PATHS.some(p => pathname.startsWith(p)) || pathname.includes('/payment-return')) return

    try {
      // Cover charge (booking) — redirect to /dining/cover-charge-return
      const coverRaw = sessionStorage.getItem('pp_cover_charge_session')
      if (coverRaw) {
        const coverStored = JSON.parse(coverRaw) as { sessionId?: string; bookingId?: string }
        if (coverStored?.sessionId) {
          router.push('/dining/cover-charge-return')
          return
        }
      }

      // Bill payment — redirect to /bookings/[id]/payment-return
      const diningRaw = sessionStorage.getItem('pp_dining_payment_session')
      if (diningRaw) {
        const diningStored = JSON.parse(diningRaw) as { sessionId?: string; bookingId?: string }
        if (diningStored?.sessionId && diningStored?.bookingId) {
          router.push(`/bookings/${diningStored.bookingId}/payment-return`)
          return
        }
      }

      // Membership payment — redirect to /membership/payment-return
      const membershipRaw = sessionStorage.getItem('pp_payment_session')
      if (membershipRaw) {
        const membershipStored = JSON.parse(membershipRaw) as { sessionId?: string }
        if (membershipStored?.sessionId) {
          router.push('/membership/payment-return')
          return
        }
      }
    } catch { /* sessionStorage unavailable */ }
  }, [pathname]) // re-run on every navigation

  return null
}
