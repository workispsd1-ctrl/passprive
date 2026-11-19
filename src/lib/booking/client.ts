'use client'

import { resolveSessionId, resolveMerchantTrace } from '@/lib/utils/payment'
import { SESSION_KEY_COVER_CHARGE } from '@/lib/constants/sessionKeys'
import {
  bookingPaymentBody,
  diningConfirmBody,
  extractBooking,
  storeConfirmBody,
  type DiningBooking,
  type ServiceBooking,
} from './payload'

/** What the booking return page needs once the payment session ends. */
export type StoredBookingPayment = {
  sessionId: string
  merchantTrace: string
  kind: 'restaurant' | 'store'
  /** where to send the user once the store booking is confirmed */
  storeHref?: string
  storeName?: string
  /** restaurant booking page — the receipt ("Table booked") is drawn there */
  bookHref?: string
  /** the chosen offer, for the receipt */
  offerLabel?: string
  /** paying a cover-charge request on an existing booking — back to the receipt (bookHref) or /bookings */
  coverRequest?: boolean
}

async function postJson(url: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) throw new Error((data?.error as string) ?? 'Something went wrong. Please try again.')
  return data
}

/** Free booking — app parity: BookingSaving → confirmRestaurantBooking / confirmStoreBooking. */
export async function confirmBooking(b: DiningBooking | ServiceBooking) {
  const data =
    b.kind === 'restaurant'
      ? await postJson('/api/bookings/dining/confirm', diningConfirmBody(b))
      : await postJson('/api/bookings/store/confirm', storeConfirmBody(b))
  return { raw: data, booking: extractBooking(data) }
}

/**
 * Paid booking — app parity (b2ff80a): PaymentMethod → PaymentProcessing
 * (BOOKING, via MIPS). Starts the session and remembers it for the return
 * page; the backend creates the booking once the payment goes through.
 * Returns the gateway response for the caller to launch.
 */
export async function initiateBookingPayment(
  b: DiningBooking | ServiceBooking,
  amount: number,
  meta: Pick<StoredBookingPayment, 'storeHref' | 'storeName' | 'bookHref' | 'offerLabel'> = {},
) {
  const data = await postJson('/api/payments/booking/initiate', { ...bookingPaymentBody(b), amount })
  return remember(data, { kind: b.kind, ...meta })
}

/**
 * Pay a merchant's cover-charge request on an existing booking — app parity:
 * CoverRequestBox → PaymentProcessing with `cover_request_booking_id` (the
 * server reads the amount due from the booking).
 */
export async function initiateCoverRequestPayment(
  kind: 'restaurant' | 'store',
  merchantId: string,
  bookingId: string,
  meta: Pick<StoredBookingPayment, 'bookHref'> = {},
) {
  const data = await postJson('/api/payments/booking/initiate', {
    [kind === 'store' ? 'store_id' : 'restaurant_id']: merchantId,
    cover_request_booking_id: bookingId,
  })
  return remember(data, { kind, coverRequest: true, ...meta })
}

function remember(data: Record<string, unknown>, meta: Omit<StoredBookingPayment, 'sessionId' | 'merchantTrace'>) {
  const stored: StoredBookingPayment = { sessionId: resolveSessionId(data), merchantTrace: resolveMerchantTrace(data), ...meta }
  if (!stored.sessionId) throw new Error('Payment session id was not returned.')
  try { sessionStorage.setItem(SESSION_KEY_COVER_CHARGE, JSON.stringify(stored)) } catch { /* private mode — the return page falls back to /bookings */ }
  return { data, session: { sessionId: stored.sessionId, merchantTrace: stored.merchantTrace } }
}
