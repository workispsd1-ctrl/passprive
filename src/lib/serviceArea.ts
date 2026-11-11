/**
 * PassPrivé only operates in Mauritius — app parity: utils/serviceArea.js.
 * A bounding box around the island; unknown coordinates count as inside, so
 * nobody is blocked before their location is known.
 */
const MAURITIUS = { minLat: -20.62, maxLat: -19.85, minLng: 57.2, maxLng: 57.9 }

export function isInServiceArea(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return true
  return lat >= MAURITIUS.minLat && lat <= MAURITIUS.maxLat && lng >= MAURITIUS.minLng && lng <= MAURITIUS.maxLng
}
