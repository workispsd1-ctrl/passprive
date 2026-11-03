import { haversineKm } from '@/lib/utils'

/** Mall rules — app parity: utils/mallInfo.js + screens/MallDetails.jsx. */
export type MallDayHours = { open?: string | null; close?: string | null; closed?: boolean | null }
export type MallHours = Record<string, MallDayHours>

export type Mall = {
  id: string
  name: string
  slug: string | null
  description: string | null
  cover_image: string | null
  logo_url: string | null
  location_name: string | null
  city: string | null
  lat: number | null
  lng: number | null
  google_place_id: string | null
  phone: string | null
  parking_available: boolean | null
  amenities: string[] | null
  opening_hours: MallHours | null
  sort_order: number | null
  distance?: number | null
}

export const MALL_AMENITY_LABELS: Record<string, string> = {
  parking: 'Free Parking',
  wheelchair: 'Wheelchair',
  ev_charging: 'EV Charging',
  wifi: 'Free WiFi',
  restrooms: 'Restrooms',
  baby_care: 'Baby Care',
  prayer_room: 'Prayer Room',
  atm: 'ATM',
  food_court: 'Food Court',
  kids_play: 'Kids Play Area',
  cinema: 'Cinema',
  valet: 'Valet Parking',
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MAURITIUS_OFFSET_MIN = 4 * 60
const MALL_RADIUS_KM = 0.15

export function mallAmenityKeys(mall: Pick<Mall, 'amenities' | 'parking_available'>) {
  const keys = Array.isArray(mall.amenities) ? mall.amenities : mall.parking_available ? ['parking'] : []
  return keys.filter(key => MALL_AMENITY_LABELS[key])
}

function toMinutes(value: unknown) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value ?? ''))
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

function formatTime(value: unknown) {
  const mins = toMinutes(value)
  if (mins == null) return ''
  const h = Math.floor(mins / 60) % 24
  return `${h % 12 || 12}:${String(mins % 60).padStart(2, '0')}${h < 12 ? 'AM' : 'PM'}`
}

function dayHours(hours: MallHours, dayIndex: number) {
  const day = hours[DAYS[(dayIndex + 7) % 7]]
  if (!day || day.closed) return null
  const openMin = toMinutes(day.open)
  const closeMin = toMinutes(day.close)
  return openMin == null || closeMin == null ? null : { ...day, openMin, closeMin }
}

export function mallOpenStatus(hours: MallHours | null | undefined, now = new Date()) {
  if (!hours || typeof hours !== 'object' || !Object.keys(hours).length) return null
  const local = new Date(now.getTime() + MAURITIUS_OFFSET_MIN * 60000)
  const today = local.getUTCDay()
  const mins = local.getUTCHours() * 60 + local.getUTCMinutes()

  const yesterday = dayHours(hours, today - 1)
  if (yesterday && yesterday.closeMin <= yesterday.openMin && mins < yesterday.closeMin) {
    return { open: true, label: `till ${formatTime(yesterday.close)}` }
  }

  const todays = dayHours(hours, today)
  if (todays) {
    const overnight = todays.closeMin <= todays.openMin
    if (mins >= todays.openMin && (overnight || mins < todays.closeMin)) {
      return { open: true, label: `till ${formatTime(todays.close)}` }
    }
    if (mins < todays.openMin) return { open: false, label: `Opens ${formatTime(todays.open)}` }
  }

  for (let i = 1; i <= 7; i += 1) {
    const next = dayHours(hours, today + i)
    if (next) {
      const when = i === 1 ? 'tomorrow' : DAYS[(today + i) % 7].slice(0, 3)
      return { open: false, label: `Opens ${when} ${formatTime(next.open)}` }
    }
  }
  return null
}

export function weeklyHours(hours: MallHours | null | undefined) {
  if (!hours || typeof hours !== 'object') return []
  return [...DAYS.slice(1), DAYS[0]].map(day => {
    const h = hours[day]
    const text = !h || h.closed ? 'Closed' : h.open && h.close ? `${formatTime(h.open)} – ${formatTime(h.close)}` : '—'
    return { day, text }
  })
}

export function floorLabel(floor: unknown) {
  const value = String(floor ?? '').trim()
  if (!value) return null
  if (/^(g|0|ground)$/i.test(value)) return 'G'
  const n = Number(value)
  if (!Number.isFinite(n)) return value
  const suffix = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'
  return `${n}${suffix}`
}

export function mallKeyword(mall: Pick<Mall, 'name'>) {
  return String(mall.name ?? '').replace(/\s+by\s+ascencia$/i, '').trim().toLowerCase()
}

/** In the mall by its address, or within 150 m of it. */
export function isInMall(
  row: { address: (string | null | undefined)[]; lat: number | null | undefined; lng: number | null | undefined },
  mall: Pick<Mall, 'name' | 'lat' | 'lng'>,
) {
  const keyword = mallKeyword(mall)
  const text = row.address.filter(Boolean).join(' ').toLowerCase()
  if (keyword && text.includes(keyword)) return true
  if (mall.lat == null || mall.lng == null || row.lat == null || row.lng == null) return false
  return haversineKm(Number(mall.lat), Number(mall.lng), Number(row.lat), Number(row.lng)) <= MALL_RADIUS_KM
}

/** Nearest first when distances are known, then the curated order. */
export function sortMalls<T extends Pick<Mall, 'sort_order' | 'name'> & { distance?: number | null }>(malls: T[]): T[] {
  return [...malls].sort((a, b) => {
    if (a.distance != null && b.distance != null) return a.distance - b.distance
    if (a.distance != null || b.distance != null) return a.distance != null ? -1 : 1
    return (a.sort_order ?? 9999) - (b.sort_order ?? 9999) || a.name.localeCompare(b.name)
  })
}
