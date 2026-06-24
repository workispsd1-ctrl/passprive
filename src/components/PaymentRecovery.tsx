'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SESSION_KEY_COVER_CHARGE, SESSION_KEY_DINING_PAYMENT, SESSION_KEY_MEMBERSHIP } from '@/lib/constants/sessionKeys'

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

      const coverRaw = sessionStorage.getItem(SESSION_KEY_COVER_CHARGE)
      if (coverRaw) {
        const coverStored = JSON.parse(coverRaw) as { sessionId?: string; bookingId?: string }
        if (coverStored?.sessionId) {
          router.push('/dining/cover-charge-return')
          return
        }
      }


      const diningRaw = sessionStorage.getItem(SESSION_KEY_DINING_PAYMENT)
      if (diningRaw) {
        const diningStored = JSON.parse(diningRaw) as { sessionId?: string; bookingId?: string }
        if (diningStored?.sessionId && diningStored?.bookingId) {
          router.push(`/bookings/${diningStored.bookingId}/payment-return`)
          return
        }
      }


      const membershipRaw = sessionStorage.getItem(SESSION_KEY_MEMBERSHIP)
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
