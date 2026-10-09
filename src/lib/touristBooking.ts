// Date + package helpers for the tourist "check availability" flow — ported
// from the app's utils/touristBooking.js; keep the two in step.

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const DEFAULT_ADVANCE_DAYS = 30
export const MAX_GUESTS = 15

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function parseDateKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

export const shortDateLabel = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]}`

/** Bookable window: today .. today + advance_booking_days (inclusive). */
export function bookingWindow(advanceDays: number | null | undefined, today = new Date()) {
  const n = Number(advanceDays)
  const days = Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_ADVANCE_DAYS
  const min = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return { min, max: addDays(min, days) }
}

/** Date chips: Today, Tomorrow, Day After, then "16 Oct". */
export function quickDates(window: { min: Date; max: Date }, count = 7) {
  const out: { key: string; top: string; sub: string }[] = []
  for (let i = 0; i < count; i++) {
    const d = addDays(window.min, i)
    if (d > window.max) break
    const top = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : i === 2 ? 'Day After' : `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
    out.push({ key: dateKey(d), top, sub: WEEKDAYS_SHORT[d.getDay()] })
  }
  return out
}

// ---- Packages --------------------------------------------------------------

export const SESSION_LABELS: Record<string, string> = {
  morning: 'Morning tour',
  afternoon: 'Afternoon tour',
  evening: 'Evening tour',
  full_day: 'Full day',
}
const SESSION_ORDER = ['morning', 'afternoon', 'evening', 'full_day']

export function durationLabel(minutes: number | null): string | null {
  const m = Number(minutes)
  if (!Number.isFinite(m) || m <= 0) return null
  const h = Math.floor(m / 60)
  const rest = m % 60
  if (!h) return `${rest} mins`
  const hours = `${h} hour${h === 1 ? '' : 's'}`
  return rest ? `${hours} ${rest} mins` : hours
}

export type TourPackage = {
  key: string
  title: string
  price: number
  childPrice: number | null
  childSpecialOffer: string | null
  session: string | null
  durationMinutes: number | null
  description: string | null
  includes: string | null
  sortOrder: number
}

/** Tabs for the sessions packages actually use; one "All tours" tab otherwise. */
export function sessionTabs(packages: TourPackage[]) {
  const used = new Set(packages.map(p => p.session).filter(Boolean))
  const tabs = SESSION_ORDER.filter(s => used.has(s)).map(s => ({ key: s, label: SESSION_LABELS[s] }))
  if (!tabs.length || packages.some(p => !p.session)) tabs.push({ key: 'all', label: tabs.length ? 'Other' : 'All tours' })
  return tabs
}

export function packagesForTab(packages: TourPackage[], tabKey: string | undefined) {
  if (tabKey === 'all') return packages.filter(p => !p.session || !SESSION_LABELS[p.session])
  return packages.filter(p => p.session === tabKey)
}

export const bookingTotal = (pricePerGuest: number, guests: number) =>
  Math.max(0, Number(pricePerGuest) || 0) * Math.max(1, Math.floor(Number(guests) || 1))

const ACTIVITY_LABELS: Record<string, string> = {
  zipline: 'Zipline',
  quad_biking_single: 'Quad Biking (Single)',
  quad_biking_double: 'Quad Biking (Double)',
  horseback_riding: 'Horseback Riding',
  guided_hiking: 'Guided Hiking',
  safari: 'Safari',
  karting: 'Karting',
  nepalese_bridge: 'Nepalese Bridge',
  aviary: 'Aviary',
  petting_feeding: 'Petting & Feeding',
}

const activityLabel = (type: unknown) =>
  ACTIVITY_LABELS[String(type)] ?? String(type || 'Activity').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const num = (v: unknown): number | null =>
  v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v)

const text = (v: unknown) => String(v ?? '').trim() || null

/** A `tourist_place_activities` row (detail columns may be absent) → package. */
export function toTourPackage(act: Record<string, unknown>): TourPackage {
  const session = String(act.session ?? '')
  return {
    key: String(act.id),
    title: text(act.title) ?? activityLabel(act.activity_type),
    price: num(act.price_adult) ?? 0,
    childPrice: num(act.price_child),
    childSpecialOffer: text(act.child_special_offer),
    session: SESSION_LABELS[session] ? session : null,
    durationMinutes: num(act.duration_minutes),
    description: text(act.description),
    includes: text(act.includes),
    sortOrder: num(act.sort_order) ?? 100,
  }
}

/** Activities as packages; the place itself as one "Entry ticket" when it has none but charges entry. */
export function buildTourPackages(
  activities: Record<string, unknown>[],
  place: { description?: string | null; price_child?: number | null },
  entryPrice: number,
): TourPackage[] {
  const list = activities.map(toTourPackage).sort((a, b) => a.sortOrder - b.sortOrder)
  if (list.length) return list
  if (!(entryPrice > 0)) return []
  return [{
    key: 'entry',
    title: 'Entry ticket',
    price: entryPrice,
    childPrice: num(place.price_child),
    childSpecialOffer: null,
    session: null,
    durationMinutes: null,
    description: text(place.description),
    includes: null,
    sortOrder: 0,
  }]
}

/** Options on the summary: local-price discount, child offer, standard. */
export function bookingOptions(pkg: TourPackage | null, pricing: { price: number; was: number | null }) {
  if (!pkg) return []
  const opts: { key: string; label: string; sub: string }[] = []
  const { price, was } = pricing
  if (pkg.key === 'entry' && was && was > 0 && price > 0 && price < was) {
    const pct = Math.round(((was - price) / was) * 100)
    opts.push({ key: 'local-price', label: `Flat ${pct}% Off`, sub: 'PassPrivé local price on entry' })
  }
  if (pkg.childSpecialOffer) opts.push({ key: 'child-offer', label: pkg.childSpecialOffer, sub: 'On child tickets' })
  opts.push({ key: 'standard', label: 'Standard booking', sub: `Pay Rs ${Math.round(pkg.price).toLocaleString('en-US')} per guest` })
  return opts
}

export const PAYMENT_LABELS: Record<string, string> = {
  ips: 'IPS',
  card: 'Credit/Debit Card',
  mopay: 'Mopay',
  mopay_place: 'Mopay (Pay on arrival)',
}

export const paymentOptions = (place: { payment_option?: string[] | string | null }) =>
  (Array.isArray(place.payment_option) ? place.payment_option : [place.payment_option]).filter(
    (v): v is string => typeof v === 'string' && !!v,
  )
