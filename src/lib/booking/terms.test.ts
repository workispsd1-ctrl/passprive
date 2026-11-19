import { describe, expect, it } from 'vitest'
import { bookingUpfront, isRequestBooking } from './terms'

describe('booking terms (app b2ff80a useBookingTerms)', () => {
  it('a discoverable or request-only merchant takes requests', () => {
    expect(isRequestBooking({ service_level: 'Discoverable' })).toBe(true)
    expect(isRequestBooking({ booking_service_type: 'request' })).toBe(true)
    expect(isRequestBooking({ service_level: 'full', booking_service_type: 'instant' })).toBe(false)
  })
  it('a request pays nothing now; otherwise the fee or the higher cover charge', () => {
    expect(bookingUpfront({ booking_service_type: 'request', cover_charge_enabled: true, cover_charge_amount: 500 }, 20)).toBe(0)
    expect(bookingUpfront({ cover_charge_enabled: true, cover_charge_amount: 500 }, 20)).toBe(500)
    expect(bookingUpfront({ cover_charge_enabled: false, cover_charge_amount: 500 }, 20)).toBe(20)
    expect(bookingUpfront({ is_request: false }, 20)).toBe(20)
  })
})
