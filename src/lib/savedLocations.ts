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
}

export type NewSavedLocation = Omit<SavedLocationRow, 'id' | 'is_default'>

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
