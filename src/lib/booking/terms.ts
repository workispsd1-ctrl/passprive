/**
 * What a booking asks for up front — app parity (b2ff80a): restaurantBookingApi.js
 * useBookingTerms. A merchant that is only discoverable, or takes requests rather
 * than instant bookings, confirms them itself, so nothing is paid now; otherwise
 * the platform booking fee, or the restaurant's cover charge when that's higher.
 */
export type BookingTermsRow = {
  service_level?: string | null
  booking_service_type?: string | null
  cover_charge_enabled?: boolean | null
  cover_charge_amount?: number | string | null
}

export function isRequestBooking(row: BookingTermsRow) {
  return (
    String(row.service_level ?? '').toLowerCase() === 'discoverable' ||
    String(row.booking_service_type ?? '').toLowerCase() === 'request'
  )
}

export function bookingUpfront(row: BookingTermsRow & { is_request?: boolean }, fee: number) {
  if (row.is_request ?? isRequestBooking(row)) return 0
  const cover = row.cover_charge_enabled === true ? Number(row.cover_charge_amount) || 0 : 0
  return Math.max(fee, cover)
}
