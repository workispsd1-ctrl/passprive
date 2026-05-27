'use client'

import { useEffect, useState, useCallback } from 'react'
import { MapPin } from 'lucide-react'
import { LocationPickerDialog } from './LocationPickerDialog'

interface Location {
  city: string
  state: string
  countryCode: string
}

const DEFAULT: Location = { city: 'Gurugram', state: 'Haryana', countryCode: 'in' }

async function reverseGeocode(lat: number, lon: number): Promise<Location> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
    { headers: { 'Accept-Language': 'en' } }
  )
  const data = await res.json()
  const addr = data.address ?? {}
  return {
    city: addr.city ?? addr.town ?? addr.village ?? addr.county ?? DEFAULT.city,
    state: addr.state ?? DEFAULT.state,
    countryCode: (data.address?.country_code ?? 'in').toLowerCase(),
  }
}

interface Props {
  variant?: 'desktop' | 'mobile'
}

export function LocationButton({ variant = 'desktop' }: Props) {
  const [location, setLocation] = useState<Location>(DEFAULT)
  const [dialogOpen, setDialogOpen] = useState(false)

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
          setLocation(loc)
        } catch {
          setLocation(DEFAULT)
        }
      },
      () => setLocation(DEFAULT)
    )
  }, [])

  useEffect(() => { detectLocation() }, [detectLocation])

  const handleSelect = (city: string, region: string) => {
    setLocation(prev => ({ ...prev, city, state: region }))
  }

  if (variant === 'mobile') {
    return (
      <>
        <button
          type="button"
          aria-label="Change location"
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1.5"
        >
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[13px] font-bold text-gray-900">{location.city}</span>
            <span className="text-[11px] text-gray-400">{location.state}</span>
          </div>
        </button>
        <LocationPickerDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          countryCode={location.countryCode}
          onSelect={handleSelect}
          onUseCurrentLocation={detectLocation}
        />
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        aria-label="Change location"
        onClick={() => setDialogOpen(true)}
        className="flex items-center gap-1 text-[13px] text-gray-700 hover:text-gray-900 transition-colors"
      >
        <MapPin className="w-3 h-3 text-gray-400 shrink-0" aria-hidden="true" />
        <span className="font-medium">{location.city}, {location.state}</span>
      </button>
      <LocationPickerDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        countryCode={location.countryCode}
        onSelect={handleSelect}
        onUseCurrentLocation={detectLocation}
      />
    </>
  )
}
