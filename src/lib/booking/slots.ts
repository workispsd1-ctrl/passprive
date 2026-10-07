/**
 * Booking date/slot helpers — app parity: utils/bookingSlots.js (used by both
 * BookTableModal.jsx and ServiceBookSlotScreen.jsx).
 */

export const LUNCH_END_MINUTES = 17 * 60
export const BOOKING_LEAD_MINUTES = 30
const MAURITIUS_UTC_OFFSET_MINUTES = 4 * 60

export type Meal = 'Lunch' | 'Dinner'

export type BookingDate = {
  /** YYYY-MM-DD */
  id: string
  /** e.g. "28" */
  day: string
  /** e.g. "Sep" */
  month: string
  /** e.g. "Mon" */
  weekday: string
  /** "Today", "Tomorrow" or "28 Sep" */
  topLabel: string
  weekdayIndex: number
}

export type Slot = {
  /** "7:30 PM" */
  label: string
  /** "19:30" */
  time24: string
  /** minutes from the day's midnight; > 1440 when the window runs past midnight */
  absoluteMinutes: number
  meal: Meal
}

export type HoursRow = {
  day_of_week: number
  open_time: string | null
  close_time: string | null
  is_closed: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')

export function formatLocalDateId(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** app parity: `getMerchantNow` — "now" in the merchant's (Mauritius) timezone. */
export function getMerchantNow(from = new Date()) {
  const shifted = new Date(from.getTime() + MAURITIUS_UTC_OFFSET_MINUTES * 60000)
  return {
    dateId: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`,
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  }
}

/** app parity: `buildContinuousDates` */
export function buildDates(count: number): BookingDate[] {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const month = d.toLocaleString('en-US', { month: 'short' })
    return {
      id: formatLocalDateId(d),
      day: String(d.getDate()),
      month,
      weekday: d.toLocaleString('en-US', { weekday: 'short' }),
      topLabel: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${d.getDate()} ${month}`,
      weekdayIndex: d.getDay(),
    }
  })
}

export function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (!value) return null
  const raw = value.trim()
  const m24 = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (m24) return Number(m24[1]) * 60 + Number(m24[2])
  const m12 = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!m12) return null
  let h = Number(m12[1]) % 12
  if (m12[3].toUpperCase() === 'PM') h += 12
  return h * 60 + Number(m12[2])
}

export function formatMinutes12(total: number): string {
  const n = ((total % 1440) + 1440) % 1440
  const h = Math.floor(n / 60)
  return `${h % 12 || 12}:${pad(n % 60)} ${h >= 12 ? 'PM' : 'AM'}`
}

export function formatMinutes24(total: number): string {
  const n = ((total % 1440) + 1440) % 1440
  return `${pad(Math.floor(n / 60))}:${pad(n % 60)}`
}

/**
 * app parity: `buildHalfHourSlots` + `filterPastSlots` — half-hour slots across
 * the day's opening window (wrapping past midnight), dropping today's slots
 * that start within the booking lead time.
 */
export function buildSlots(hours: HoursRow[], date: BookingDate): Slot[] {
  const row = hours.find(h => h.day_of_week === date.weekdayIndex)
  if (!row || row.is_closed) return []
  const start = parseTimeToMinutes(row.open_time)
  let end = parseTimeToMinutes(row.close_time)
  if (start == null || end == null) return []
  if (end <= start) end += 1440

  const now = getMerchantNow()
  const cutoff = date.id === now.dateId ? now.minutes + BOOKING_LEAD_MINUTES : -Infinity

  const slots: Slot[] = []
  for (let m = start; m < end; m += 30) {
    if (m <= cutoff) continue
    const normalized = m % 1440
    slots.push({
      label: formatMinutes12(m),
      time24: formatMinutes24(m),
      absoluteMinutes: m,
      meal: normalized < LUNCH_END_MINUTES ? 'Lunch' : 'Dinner',
    })
  }
  return slots
}

/** app parity: `getDefaultMealByCurrentTime` */
export function defaultMeal(): Meal {
  return new Date().getHours() >= 17 ? 'Dinner' : 'Lunch'
}

/** "Today", "Tomorrow" or the weekday — app parity: ReviewStoreBooking `dayLabel`. */
export function dayLabel(dateId: string): string {
  const [y, m, d] = dateId.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

export function longDate(dateId: string): string {
  const [y, m, d] = dateId.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}
