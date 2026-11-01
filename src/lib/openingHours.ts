/**
 * Opening-hours logic shared by every merchant detail page — app parity:
 * RestaurantDetails / ServiceStoreDetails `getOpenStatus`. Windows can run
 * past midnight (open 18:00, close 02:00). "Now" is Mauritius wall-clock time,
 * so the server render and the browser agree whatever their own time zone.
 */

export type HoursRow = {
  day_of_week: number
  open_time: string | null
  close_time: string | null
  is_closed: boolean
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
/** Monday-first, the way the week is listed */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

function toMinutes(t: string | null | undefined): number | null {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return Number.isFinite(h) ? h * 60 + (m || 0) : null
}

/** 570 → "9:30 AM" */
export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`
}

export function windowFor(hours: HoursRow[], day: number): { start: number; end: number } | null {
  const row = hours.find(h => h.day_of_week === day)
  if (!row || row.is_closed) return null
  const start = toMinutes(row.open_time)
  const end = toMinutes(row.close_time)
  return start == null || end == null ? null : { start, end }
}

/** Day of week (0 = Sunday) and minutes past midnight in Mauritius. */
export function mauritiusNow(at = new Date()): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Indian/Mauritius',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
  return { day: day < 0 ? at.getDay() : day, minutes: Number(get('hour')) * 60 + Number(get('minute')) }
}

export type OpenStatus = { isOpen: boolean; /** "Closes 10 PM" / "Opens Tue at 9 AM" */ detail: string }

export function getOpenStatus(hours: HoursRow[], at = new Date()): OpenStatus | null {
  if (!hours.length) return null
  const { day, minutes } = mauritiusNow(at)

  const today = windowFor(hours, day)
  if (today) {
    const wraps = today.end <= today.start
    if ((!wraps && minutes >= today.start && minutes < today.end) || (wraps && minutes >= today.start)) {
      return { isOpen: true, detail: `Closes ${formatMinutes(today.end)}` }
    }
  }
  const yesterday = windowFor(hours, (day + 6) % 7)
  if (yesterday && yesterday.end <= yesterday.start && minutes < yesterday.end) {
    return { isOpen: true, detail: `Closes ${formatMinutes(yesterday.end)}` }
  }

  for (let offset = 0; offset < 7; offset++) {
    const d = (day + offset) % 7
    const w = windowFor(hours, d)
    if (!w || (offset === 0 && minutes >= w.start)) continue
    const when = offset === 0 ? 'today' : offset === 1 ? 'tomorrow' : DAY_NAMES[d].slice(0, 3)
    return { isOpen: false, detail: `Opens ${when} at ${formatMinutes(w.start)}` }
  }
  return { isOpen: false, detail: 'Closed this week' }
}
