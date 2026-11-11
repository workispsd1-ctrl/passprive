'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isInServiceArea } from '@/lib/serviceArea'
import { COORDS_COOKIE, LOCATION_COOKIE, encodeSavedLocation, type Coords, type SavedLocation } from '@/lib/locationCookie'

interface LocationState {
  city: string
  state: string
  countryCode: string
  lat: number | null
  lng: number | null
}

/** The header's location as saved in cookies — what the server rendered with. */
export type InitialLocation = SavedLocation & { coords: Coords | null }

interface LocationContextValue {
  location: LocationState
  /** true while the first GPS lookup is still running and nothing is saved yet */
  detecting: boolean
  /** GPS was denied, timed out or failed and nothing is saved — app parity: "Location unavailable" */
  unavailable: boolean
  /** the location is known and outside Mauritius — app parity: ServiceAreaGate */
  outsideServiceArea: boolean
  setLocationByCity: (city: string, region: string, countryCode?: string) => Promise<void>
  /** a saved address — its coordinates are already known */
  setLocationByPlace: (place: { city: string; state: string; lat: number | null; lng: number | null }) => void
  detectFromGPS: () => void
}

const DEFAULT: LocationState = {
  city: '',
  state: '',
  countryCode: 'mu',
  lat: null,
  lng: null,
}

const LocationContext = createContext<LocationContextValue>({
  location: DEFAULT,
  detecting: false,
  unavailable: false,
  outsideServiceArea: false,
  setLocationByCity: async () => {},
  setLocationByPlace: () => {},
  detectFromGPS: () => {},
})

async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; state: string; countryCode: string }> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'Accept-Language': 'en' } }
  )
  const data = await res.json()
  const addr = data.address ?? {}
  return {
    city: addr.city ?? addr.town ?? addr.village ?? addr.county ?? DEFAULT.city,
    state: addr.state ?? DEFAULT.state,
    countryCode: (data.address?.country_code ?? 'mu').toLowerCase(),
  }
}

/** A city from the picker → its coordinates, looked up in Mauritius only ("Ebene" alone resolves to Germany). */
async function forwardGeocode(city: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&countrycodes=mu&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch { /* silent */ }
  return null
}

/**
 * One GPS fix — app parity: App.tsx tries high accuracy for 8s, then a coarse
 * (cached up to 10 min) fix for 4s, so the header never waits forever.
 */
function getPosition(): Promise<GeolocationCoordinates> {
  const once = (opts: PositionOptions) =>
    new Promise<GeolocationCoordinates>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(p => resolve(p.coords), reject, opts))
  return once({ enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }).catch((err: GeolocationPositionError) =>
    // a denied permission won't change on a second try
    err?.code === 1 ? Promise.reject(err) : once({ enableHighAccuracy: false, timeout: 4000, maximumAge: 600_000 }))
}

const COOKIE_OPTS = `path=/; max-age=${30 * 86400}; samesite=lax`
const hasCookie = (name: string, value: string) => document.cookie.split('; ').includes(`${name}=${value}`)

/**
 * The header's location is the one location for the whole site: it is saved
 * in cookies, restored from them on the next load (`initial`), and every
 * server-rendered list measures distance from it.
 */
export function LocationProvider({ children, initial }: { children: React.ReactNode; initial?: InitialLocation | null }) {
  const [location, setLocation] = useState<LocationState>(() =>
    initial
      ? {
          city: initial.city,
          state: initial.state,
          countryCode: initial.countryCode,
          lat: initial.coords?.lat ?? null,
          lng: initial.coords?.lng ?? null,
        }
      : DEFAULT,
  )
  // true = picked by hand in the header dialog; GPS must not replace it on load
  const [manual, setManual] = useState(initial?.manual ?? false)
  const [detecting, setDetecting] = useState(!initial)
  const [failed, setFailed] = useState(false)
  const router = useRouter()

  const detectFromGPS = useCallback(() => {
    if (!navigator.geolocation) {
      Promise.resolve().then(() => { setDetecting(false); setFailed(true) })
      return
    }
    // deferred like above: this also runs from the mount effect
    Promise.resolve().then(() => { setFailed(false); setDetecting(true) })
    getPosition().then(
      async ({ latitude: lat, longitude: lng }) => {
        setManual(false)
        try {
          const info = await reverseGeocode(lat, lng)
          setLocation({ ...info, lat, lng })
        } catch {
          setLocation(prev => ({ ...prev, lat, lng }))
        }
        setDetecting(false)
      },
      () => { setDetecting(false); setFailed(true) },
    )
  }, [])

  const setLocationByCity = useCallback(async (city: string, region: string, countryCode = 'mu') => {
    // Optimistically update city name immediately
    setManual(true)
    setDetecting(false)
    setFailed(false)
    setLocation(prev => ({ ...prev, city, state: region, countryCode, lat: null, lng: null }))
    // Geocode in background to get coordinates
    const coords = await forwardGeocode(city)
    if (coords) {
      setLocation(prev => ({ ...prev, lat: coords.lat, lng: coords.lng }))
    } else if (document.cookie.includes(`${COORDS_COOKIE}=`)) {
      // No coordinates for this place: drop the old ones so lists don't keep
      // measuring from the previous location while the header shows this one.
      document.cookie = `${COORDS_COOKIE}=; path=/; max-age=0; samesite=lax`
      router.refresh()
    }
  }, [router])

  const setLocationByPlace = useCallback((place: { city: string; state: string; lat: number | null; lng: number | null }) => {
    setManual(true)
    setDetecting(false)
    setFailed(false)
    setLocation({ city: place.city, state: place.state, countryCode: 'mu', lat: place.lat, lng: place.lng })
  }, [])

  // A hand-picked location stays until the visitor changes it; otherwise
  // follow the device.
  const startedManual = initial?.manual ?? false
  useEffect(() => {
    if (!startedManual) detectFromGPS()
  }, [startedManual, detectFromGPS])

  // Mirror the header's location into cookies so server-rendered feeds are
  // scoped to it (distance sort / nearby radius) and it survives a reload,
  // then re-render once when the coordinates first arrive or change.
  const { lat, lng, city, state, countryCode } = location
  useEffect(() => {
    if (!city) return
    const value = encodeSavedLocation({ city, state, countryCode, manual })
    if (!hasCookie(LOCATION_COOKIE, value)) document.cookie = `${LOCATION_COOKIE}=${value}; ${COOKIE_OPTS}`
  }, [city, state, countryCode, manual])

  useEffect(() => {
    if (lat == null || lng == null) return
    const value = `${lat.toFixed(3)},${lng.toFixed(3)}`
    if (hasCookie(COORDS_COOKIE, value)) return
    document.cookie = `${COORDS_COOKIE}=${value}; ${COOKIE_OPTS}`
    router.refresh()
  }, [lat, lng, router])

  // only a failure with nothing to fall back on is "unavailable"
  const unavailable = failed && !city
  const outsideServiceArea = !isInServiceArea(lat, lng)

  return (
    <LocationContext.Provider value={{ location, detecting, unavailable, outsideServiceArea, setLocationByCity, setLocationByPlace, detectFromGPS }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  return useContext(LocationContext)
}
