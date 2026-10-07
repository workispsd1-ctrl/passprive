'use client'

import { resolveSessionId, resolveMerchantTrace, resolveGatewayUrl, submitGatewayForm } from '@/lib/utils/payment'
import { SESSION_KEY_COVER_CHARGE } from '@/lib/constants/sessionKeys'
import {
  bookingPaymentBody,
  diningConfirmBody,
  extractBooking,
  storeConfirmBody,
  type DiningBooking,
  type ServiceBooking,
} from './payload'

/** What the cover-charge return page needs to finish a booking after iVeri. */
export type StoredBookingPayment = {
  sessionId: string
  merchantTrace: string
  kind: 'restaurant' | 'store'
  /** where to send the user once the store booking is confirmed */
  storeHref?: string
  storeName?: string
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
 * Paid booking — app parity: PaymentMethod → CardPayment (BOOKING). The booking
 * itself is created by the backend's finalize-booking once iVeri succeeds.
 */
export async function startBookingPayment(
  b: DiningBooking | ServiceBooking,
  meta: Pick<StoredBookingPayment, 'storeHref' | 'storeName'> = {},
) {
  const data = await postJson('/api/payments/booking/initiate', bookingPaymentBody(b))

  const gatewayUrl = resolveGatewayUrl(data)
  if (!gatewayUrl) throw new Error('Payment gateway URL not returned. Please try again.')

  const stored: StoredBookingPayment = {
    sessionId: resolveSessionId(data),
    merchantTrace: resolveMerchantTrace(data),
    kind: b.kind,
    ...meta,
  }
  sessionStorage.setItem(SESSION_KEY_COVER_CHARGE, JSON.stringify(stored))

  const fields = (data?.form_fields ?? data?.fields ?? {}) as Record<string, string>
  if (Object.keys(fields).length > 0) submitGatewayForm(gatewayUrl, fields)
  else window.location.href = gatewayUrl
}
