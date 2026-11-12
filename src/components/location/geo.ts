import type { PlaceResult } from '@/lib/savedLocations'

/** One GPS fix: precise for 8s, then a coarse cached one — as the header does. */
export function getCoords(): Promise<{ lat: number; lng: number }> {
  const once = (opts: PositionOptions) =>
    new Promise<GeolocationCoordinates>((resolve, reject) => navigator.geolocation.getCurrentPosition(p => resolve(p.coords), reject, opts))
  if (!navigator.geolocation) return Promise.reject(new Error('unsupported'))
  return once({ enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 })
    .catch((err: GeolocationPositionError) => (err?.code === 1 ? Promise.reject(err) : once({ enableHighAccuracy: false, timeout: 5000, maximumAge: 300_000 })))
    .then(c => ({ lat: c.latitude, lng: c.longitude }))
}

export async function reversePlace(lat: number, lng: number): Promise<PlaceResult | null> {
  const res = await fetch(`/api/places?mode=reverse&lat=${lat}&lng=${lng}`).catch(() => null)
  const data = (await res?.json().catch(() => null)) as { place: PlaceResult | null } | null
  return data?.place ?? null
}
