/** Cookie holding the user's "lat,lng" (written by LocationContext, read on the server). */
export const COORDS_COOKIE = 'pp_coords'

export type Coords = { lat: number; lng: number }

export function parseCoords(raw: string | undefined | null): Coords | null {
  if (!raw) return null
  const [a, b] = decodeURIComponent(raw).split(',').map(Number)
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180
    ? { lat: a, lng: b }
    : null
}

/**
 * Cookie holding the header's location label, so the server can render the
 * same place the header shows and a hand-picked city survives a reload.
 */
export const LOCATION_COOKIE = 'pp_loc'

export type SavedLocation = {
  city: string
  state: string
  countryCode: string
  /** true = picked in the header's location dialog (not overridden by GPS on load) */
  manual: boolean
}

export function encodeSavedLocation(loc: SavedLocation): string {
  return encodeURIComponent(JSON.stringify([loc.city, loc.state, loc.countryCode, loc.manual ? 1 : 0]))
}

export function parseSavedLocation(raw: string | undefined | null): SavedLocation | null {
  if (!raw) return null
  try {
    const v: unknown = JSON.parse(decodeURIComponent(raw))
    if (!Array.isArray(v) || typeof v[0] !== 'string' || !v[0]) return null
    return {
      city: v[0].slice(0, 80),
      state: typeof v[1] === 'string' ? v[1].slice(0, 80) : '',
      countryCode: typeof v[2] === 'string' && /^[a-z]{2}$/.test(v[2]) ? v[2] : 'mu',
      manual: v[3] === 1,
    }
  } catch {
    return null
  }
}
