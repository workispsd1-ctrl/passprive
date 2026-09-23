import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Merchant tier rank — preferred → verified → everything else.
 * Ported from the PassPrivé app (`utils/merchantRank.js`).
 */
export function merchantRank(item: { merchant_type?: string | null }): number {
  const m = String(item?.merchant_type ?? "").toLowerCase()
  if (m === "preferred") return 0
  if (m === "verified") return 1
  return 2
}

/**
 * Stable re-sort by merchant tier. `Array.prototype.sort` is stable, so the
 * incoming order is preserved within each tier.
 */
export function sortByMerchant<T extends { merchant_type?: string | null }>(
  list: T[],
): T[] {
  return [...list].sort((a, b) => merchantRank(a) - merchantRank(b))
}

/** Great-circle distance in km. Ported from the app's `utils/distance.js`. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

/** e.g. `5.3km`, or null when the distance is unknown. */
export function formatDistanceKm(
  km: number | null | undefined,
  suffix = 'km',
): string | null {
  const n = typeof km === 'number' ? km : Number(km)
  return Number.isFinite(n) ? `${n.toFixed(1)}${suffix}` : null
}

/**
 * Location-scopes a store list: nearest first when the user's coordinates are
 * known (stores without coordinates go last), otherwise unchanged.
 */
export function sortByDistanceFrom<T extends { lat: number | null; lng: number | null }>(
  items: T[],
  coords: { lat: number; lng: number } | null,
): T[] {
  if (!coords) return items
  const d = (i: T) =>
    i.lat != null && i.lng != null
      ? haversineKm(coords.lat, coords.lng, i.lat, i.lng)
      : Number.POSITIVE_INFINITY
  return [...items].sort((a, b) => d(a) - d(b))
}
