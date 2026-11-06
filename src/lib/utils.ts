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

/** e.g. `5.3km` (`350m` under 1 km), or null when the distance is unknown. */
export function formatDistanceKm(
  km: number | null | undefined,
  suffix = 'km',
): string | null {
  // null/undefined/'' mean "distance unknown" — Number(null) is 0, which would print "0.0km"
  if (km == null || (km as unknown) === '') return null
  const n = typeof km === 'number' ? km : Number(km)
  if (!Number.isFinite(n)) return null
  // under 1 km read in metres ("350m") — "0.0km" tells the visitor nothing
  if (suffix === 'km' && n < 1) return `${Math.max(10, Math.round((n * 1000) / 10) * 10)}m`
  return `${n.toFixed(1)}${suffix}`
}

const normLoc = (v: string | null | undefined) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ')

/**
 * Location-scopes a list — app parity: `matchesUserLocation` /
 * `hasResolvedUserLocation` (utils/locationScope.js). An item with a distance
 * is kept within `radiusKm`; an item without coordinates (most stores have
 * none) is kept when its city is the user's, or when any part of the user's
 * location (`parts`: city, region…) matches its area, address, city or name.
 * Returns the list unchanged when the user's location hasn't resolved at all.
 */
export function scopeByLocation<
  T extends { lat?: number | null; lng?: number | null; city?: string | null; location_name?: string | null; area?: string | null; address_line1?: string | null; name?: string | null },
>(items: T[], coords: { lat: number; lng: number } | null, city: string, radiusKm: number, parts: (string | null | undefined)[] = [city]): T[] {
  const userCity = normLoc(city)
  const userParts = parts.map(normLoc).filter(Boolean)
  if (!coords && !userCity && !userParts.length) return items

  return items.filter((i) => {
    if (coords && i.lat != null && i.lng != null) {
      return haversineKm(coords.lat, coords.lng, Number(i.lat), Number(i.lng)) <= radiusKm
    }
    if (userCity && normLoc(i.city) === userCity) return true
    // app parity: hasMatchingLocationTerm
    const fields = [i.area, i.location_name, i.address_line1, i.city, i.name].map(normLoc).filter(Boolean)
    return userParts.some(part => fields.some(f => f === part || f.includes(part) || part.includes(f)))
  })
}

/** app parity: StoreVibesSection.jsx isVideoUrl */
export function isVideoUrl(url: string) {
  return /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(url.split('?')[0])
}
