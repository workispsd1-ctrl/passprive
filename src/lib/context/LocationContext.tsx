'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

interface LocationState {
  city: string
  state: string
  countryCode: string
  lat: number | null
  lng: number | null
}

interface LocationContextValue {
  location: LocationState
  setLocationByCity: (city: string, region: string, countryCode?: string) => Promise<void>
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
  setLocationByCity: async () => {},
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

async function forwardGeocode(city: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch { /* silent */ }
  return null
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationState>(DEFAULT)

  const detectFromGPS = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const info = await reverseGeocode(lat, lng)
          setLocation({ ...info, lat, lng })
        } catch {
          setLocation(prev => ({ ...prev, lat, lng }))
        }
      },
      () => {}
    )
  }, [])

  const setLocationByCity = useCallback(async (city: string, region: string, countryCode = 'mu') => {
    // Optimistically update city name immediately
    setLocation(prev => ({ ...prev, city, state: region, countryCode, lat: null, lng: null }))
    // Geocode in background to get coordinates
    const coords = await forwardGeocode(city)
    if (coords) {
      setLocation(prev => ({ ...prev, lat: coords.lat, lng: coords.lng }))
    }
  }, [])

  useEffect(() => { detectFromGPS() }, [detectFromGPS])

  return (
    <LocationContext.Provider value={{ location, setLocationByCity, detectFromGPS }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  return useContext(LocationContext)
}
