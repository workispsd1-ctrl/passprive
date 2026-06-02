'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { LocationPickerDialog } from './LocationPickerDialog'
import { useLocation } from '@/lib/context/LocationContext'

interface Props {
  variant?: 'desktop' | 'mobile'
}

export function LocationButton({ variant = 'desktop' }: Props) {
  const { location, setLocationByCity, detectFromGPS } = useLocation()
  const [dialogOpen, setDialogOpen] = useState(false)

  const cityLabel = location.city || 'Detecting…'
  const stateLabel = location.state || ''

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
            <span className="text-[13px] font-bold text-gray-900">{cityLabel}</span>
            {stateLabel && <span className="text-[11px] text-gray-400">{stateLabel}</span>}
          </div>
        </button>
        <LocationPickerDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          countryCode="mu"
          onSelect={(city, region) => { setLocationByCity(city, region, 'mu'); setDialogOpen(false) }}
          onUseCurrentLocation={() => { detectFromGPS(); setDialogOpen(false) }}
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
        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity shrink-0"
      >
        <MapPin className="w-3.5 h-3.5 text-brand shrink-0" aria-hidden="true" />
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[13px] font-bold text-gray-900">{cityLabel}{location.city ? ',' : ''}</span>
          {stateLabel && <span className="text-[11px] text-gray-400">{stateLabel}</span>}
        </div>
      </button>
      <LocationPickerDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        countryCode="mu"
        onSelect={(city, region) => { setLocationByCity(city, region, 'mu'); setDialogOpen(false) }}
        onUseCurrentLocation={() => { detectFromGPS(); setDialogOpen(false) }}
      />
    </>
  )
}
