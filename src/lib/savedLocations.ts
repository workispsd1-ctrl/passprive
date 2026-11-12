/** Saved addresses — app parity: SavedLocations.jsx + LabelAddress.jsx. */
export type SavedLocationRow = {
  id: string
  label: string | null
  label_type: string | null
  building_floor: string | null
  landmark: string | null
  address_text: string
  city: string | null
  area: string | null
  pincode: string | null
  latitude: number | null
  longitude: number | null
  place_id: string | null
  is_default?: boolean | null
  is_recent?: boolean | null
}

export type NewSavedLocation = Omit<SavedLocationRow, 'id' | 'is_default' | 'is_recent'>

/** A Google place from `/api/places` — search suggestion, nearby place or the place under the map pin. */
export type PlaceResult = {
  id: string
  title: string
  address: string
  city: string
  area: string
  pincode: string
  place_id: string | null
  latitude: number | null
  longitude: number | null
  distance_km?: number | null
}

export const LOCATION_LABELS = [
  { key: 'home', label: 'Home' },
  { key: 'office', label: 'Office' },
  { key: 'hotel', label: 'Stay/Hotel' },
  { key: 'others', label: 'Others' },
] as const

export const GUEST_LOCATIONS_KEY = 'pp_guest_saved_locations'
export const GUEST_LOCATIONS_MAX = 20

const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')

export function locationIdentity(row: Pick<SavedLocationRow, 'address_text' | 'place_id'>) {
  return normalize(row.place_id) || normalize(row.address_text)
}

/** The newest copy of each address; the list comes newest first. */
export function dedupeLocations<T extends Pick<SavedLocationRow, 'address_text' | 'place_id'>>(rows: T[]): T[] {
  const seen = new Set<string>()
  return rows.filter(row => {
    const key = locationIdentity(row)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function resolveLabel(type: string, custom: string) {
  const chosen = LOCATION_LABELS.find(l => l.key === type) ?? LOCATION_LABELS[0]
  return type === 'others' ? custom.trim() || 'Others' : chosen.label
}

/** Two points are the same spot — the header's coordinates are rounded to 3 decimals in the cookie. */
export function sameSpot(
  a: { lat: number | null; lng: number | null },
  b: { latitude: number | null; longitude: number | null },
) {
  if (a.lat == null || a.lng == null || b.latitude == null || b.longitude == null) return false
  return Math.abs(a.lat - b.latitude) < 0.0006 && Math.abs(a.lng - b.longitude) < 0.0006
}

/**
 * Saved vs recent, app parity: SavedLocations.jsx loadLocations — recent are
 * the last 5 picked (minus the current one), saved are the rest plus the
 * default. Rows come newest first.
 */
export function splitLocations<T extends SavedLocationRow>(rows: T[], isCurrent: (row: T) => boolean) {
  const unique = dedupeLocations(rows)
  return {
    saved: unique.filter(r => !r.is_recent || r.is_default),
    recent: unique.filter(r => r.is_recent).slice(0, 5).filter(r => !isCurrent(r)),
  }
}

/** Figma "Popular areas" — picked like a city from the list. */
export const POPULAR_AREAS = [
  { name: 'Grand Baie', region: 'Rivière du Rempart' },
  { name: 'Flic en Flac', region: 'Black River' },
  { name: 'Le Morne', region: 'Black River' },
  { name: 'Belle Mare', region: 'Flacq' },
  { name: 'Tamarin', region: 'Black River' },
  { name: 'Port Louis', region: 'Port Louis' },
] as const

/** Figma "Tourist hotspots" — fixed spots, so their coordinates are known. */
export const TOURIST_HOTSPOTS = [
  { name: 'SSR Botanical Garden', region: 'Pamplemousses', lat: -20.1044, lng: 57.5803 },
  { name: 'Le Morne Brabant', region: 'Black River', lat: -20.4511, lng: 57.3142 },
  { name: 'Chamarel Seven Coloured Earth', region: 'Black River', lat: -20.4400, lng: 57.3731 },
  { name: 'Île aux Cerfs', region: 'Flacq', lat: -20.2722, lng: 57.8031 },
  { name: 'Blue Bay Marine Park', region: 'Grand Port', lat: -20.4447, lng: 57.7108 },
  { name: 'Black River Gorges', region: 'Black River', lat: -20.4170, lng: 57.4330 },
] as const
