/** Booking status rules — app parity: utils/bookingStatus.js + BookingProposalBanner.jsx. */
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase()

const PAID_PAYMENT_STATUSES = ['paid', 'verified', 'completed', 'success', 'successful']
export const CONFIRMED_BOOKING_STATUSES = ['confirmed', 'booked', 'accepted', 'payment_successfull']
export const ACTIVE_BOOKING_STATUSES = ['pending', 'requested', ...CONFIRMED_BOOKING_STATUSES]
const REJECTED_BOOKING_STATUSES = ['rejected', 'declined', 'cancelled', 'canceled']

export type BookingStatusRow = {
  status?: string | null
  payment_required?: boolean | null
  payment_status?: string | null
  payment_amount?: number | string | null
  cover_charge_amount?: number | string | null
}

export type ProposalRow = {
  status?: string | null
  proposed_date?: string | null
  proposed_time?: string | null
  proposed_at?: string | null
}

export const isBookingConfirmed = (row: BookingStatusRow) => CONFIRMED_BOOKING_STATUSES.includes(norm(row.status))
export const isBookingRejected = (row: BookingStatusRow) => REJECTED_BOOKING_STATUSES.includes(norm(row.status))

const paidAmount = (row: BookingStatusRow) => Number(row.payment_amount || 0) || Number(row.cover_charge_amount || 0)

export const isBookingPaid = (row: BookingStatusRow) =>
  paidAmount(row) > 0 && PAID_PAYMENT_STATUSES.includes(norm(row.payment_status))

/** Blocks a new booking at the same restaurant — app parity: useExistingBookingGuard. */
export function isBlockingBooking(row: BookingStatusRow) {
  if (isBookingConfirmed(row) || isBookingPaid(row)) return true
  const status = norm(row.status)
  if (status !== 'pending' && status !== 'requested') return false
  return row.payment_required !== true
}

/** A new time the restaurant proposed, still pending and not yet passed. */
export function hasLiveProposal(row: ProposalRow, now = Date.now()) {
  if (!row.proposed_at || !row.proposed_date || !row.proposed_time) return false
  if (norm(row.status) !== 'pending') return false
  const startsAt = Date.parse(`${row.proposed_date}T${String(row.proposed_time).slice(0, 5)}:00+04:00`)
  return Number.isFinite(startsAt) && startsAt > now
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function proposalLabel(row: ProposalRow) {
  const date = new Date(`${row.proposed_date}T00:00:00Z`)
  const [h, m] = String(row.proposed_time).slice(0, 5).split(':').map(Number)
  const day = Number.isNaN(date.getTime())
    ? row.proposed_date
    : `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
  return `${day}, ${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

/** app parity: CoverRequestBox hasOpenCoverRequest — a cover charge requested and not past its due time. */
export function hasOpenCoverRequest(b: { cover_request_status?: string | null; cover_request_due_at?: string | null }, now = Date.now()) {
  if (b.cover_request_status !== 'requested') return false
  const due = Date.parse(b.cover_request_due_at ?? '')
  return !Number.isFinite(due) || due > now
}
