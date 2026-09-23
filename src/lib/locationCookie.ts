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
