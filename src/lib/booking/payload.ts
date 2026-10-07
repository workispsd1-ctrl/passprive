/**
 * Booking request bodies — app parity:
 * - utils/restaurantBookingApi.js `buildBookingRequest` (free dining confirm)
 * - utils/storeBookingApi.js `buildStoreBookingRequest` (free service confirm)
 * - CardPaymentScreen.jsx BOOKING context (paid cover charge via iVeri)
 */

export type BookingOption = {
  type: string
  label: string
  id?: string
  offerId?: string
  offer_id?: string
  title?: string
  benefitLabel?: string | null
  upgradePlan?: string | null
  coverChargeRequired: boolean
  coverChargeAmount: number | null
}

export type SelectedService = { id: string; title: string; quantity: number; price: number }

export type DiningBooking = {
  kind: 'restaurant'
  restaurantId: string
  guests: number
  dateId: string
  time24: string
  meal: string | null
  option: BookingOption
  notes: string
}

export type ServiceBooking = {
  kind: 'store'
  storeId: string
  guests: number
  dateId: string
  time24: string
  services: SelectedService[]
  option: BookingOption
  notes: string
}

const NO_PAYMENT = { amount: 0, status: 'not_required', method: null, reference: null, verified: false }

/** Body for POST /api/restaurant-bookings/confirm (no cover charge). */
export function diningConfirmBody(b: DiningBooking) {
  return {
    restaurant: { id: b.restaurantId },
    guests: b.guests,
    selectedDate: b.dateId,
    selectedTime: b.time24,
    meal: b.meal,
    option: b.option,
    notes: b.notes,
    payment: NO_PAYMENT,
  }
}

/** Body for POST /api/store-service-booking/confirm (no cover charge). */
export function storeConfirmBody(b: ServiceBooking) {
  return {
    store: { id: b.storeId },
    guests: b.guests,
    selectedDate: b.dateId,
    selectedTime: b.time24,
    selectedServices: b.services,
    notes: b.notes,
    option: b.option,
    payment: NO_PAYMENT,
  }
}

/**
 * app parity: `sanitizeBookingOptionForCoverChargePayment` — a discount option
 * paid as a cover charge is recorded as a regular reservation.
 */
function coverChargeOption(option: BookingOption): BookingOption {
  if (!option.type.toLowerCase().startsWith('discount')) return option
  const amount = option.coverChargeAmount ?? 0
  return {
    type: 'Regular table reservation',
    label: amount > 0 ? `MUR ${amount} cover charge required` : 'No cover charge required',
    coverChargeRequired: option.coverChargeRequired || amount > 0,
    coverChargeAmount: amount > 0 ? amount : null,
  }
}

/** iVeri `initiate` fields for a BOOKING that still needs its cover charge paid. */
export function bookingPaymentBody(b: DiningBooking | ServiceBooking) {
  const common = {
    guests: b.guests,
    selectedDate: b.dateId,
    selectedDateId: b.dateId,
    selectedTime: b.time24,
    selectedTime24: b.time24,
    notes: b.notes,
  }
  if (b.kind === 'restaurant') {
    return {
      restaurant_id: b.restaurantId,
      booking_payload: {
        ...common,
        restaurant: { id: b.restaurantId },
        meal: b.meal,
        option: coverChargeOption(b.option),
      },
    }
  }
  return {
    store_id: b.storeId,
    booking_payload: {
      ...common,
      store: { id: b.storeId },
      serviceBooking: true,
      selectedServices: b.services,
      meal: null,
      option: b.option,
    },
  }
}

/** The booking row out of a confirm/finalize response — app parity: `bookingConfirmation?.booking`. */
export function extractBooking(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const inner = (d.bookingConfirmation ?? d.booking_confirmation ?? d) as Record<string, unknown>
  const row = (inner.booking ?? inner.order ?? inner.data ?? null) as Record<string, unknown> | null
  return row && typeof row === 'object' ? row : null
}
