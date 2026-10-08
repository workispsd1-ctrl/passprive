import { haversineKm } from '@/lib/utils'

/**
 * One distance rule for every home screen (Home, Dining, Shopping, Wellness,
 * Tourist): show what is within NEARBY_KM of the visitor, widen to
 * MAX_NEARBY_KM when nothing is that close, and never go further.
 *
 * Without a known location there is nothing to measure from, so lists are
 * left as they are rather than emptied.
 */
export const NEARBY_KM = 3
export const MAX_NEARBY_KM = 5

type LatLng = { lat: number; lng: number }

/**
 * Keeps the items inside the radius, in their existing order. `kmOf` returns
 * an item's distance from the visitor (null when it has no coordinates —
 * those are dropped once a location is known).
 */
export function scopeToRadius<T>(
  items: T[],
  kmOf: (item: T) => number | null | undefined,
  hasLocation: boolean,
): T[] {
  if (!hasLocation) return items
  const within = (km: number) => items.filter((i) => {
    const d = kmOf(i)
    return d != null && Number.isFinite(d) && d <= km
  })
  const near = within(NEARBY_KM)
  return near.length ? near : within(MAX_NEARBY_KM)
}

/** Distance (km) from `coords` to an item's lat/lng, or null if either is missing. */
export function kmFrom(coords: LatLng | null | undefined, lat: number | null | undefined, lng: number | null | undefined): number | null {
  if (!coords || lat == null || lng == null) return null
  const la = Number(lat)
  const ln = Number(lng)
  return Number.isFinite(la) && Number.isFinite(ln) ? haversineKm(coords.lat, coords.lng, la, ln) : null
}

/** scopeToRadius for rows carrying `lat`/`lng` (stores), nearest first. */
export function scopeStoresToRadius<T extends { lat: number | null; lng: number | null }>(
  stores: T[],
  coords: LatLng | null | undefined,
): T[] {
  if (!coords) return stores
  return scopeToRadius(stores, (s) => kmFrom(coords, s.lat, s.lng), true)
    .map((s) => ({ s, d: kmFrom(coords, s.lat, s.lng) ?? Infinity }))
    .sort((a, b) => a.d - b.d)
    .map(({ s }) => s)
}
