'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { LocationPickerDialog } from './LocationPickerDialog'
import { useLocation } from '@/lib/context/LocationContext'

interface Props {
  variant?: 'desktop' | 'mobile'
  /** 'light' = rendered on a dark/orange background (white text) */
  theme?: 'default' | 'light'
}

export function LocationButton({ variant = 'desktop', theme = 'default' }: Props) {
  const { location, setLocationByCity, detectFromGPS } = useLocation()
  const [dialogOpen, setDialogOpen] = useState(false)

  const light = theme === 'light'
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
          <MapPin
            className={`w-3.5 h-3.5 shrink-0 ${light ? 'text-white' : 'text-gray-400'}`}
            aria-hidden="true"
          />
          <div className="flex flex-col items-start leading-tight">
            <span className={`text-[13px] font-bold ${light ? 'text-white' : 'text-gray-900'}`}>{cityLabel}</span>
            {stateLabel && <span className={`text-[11px] ${light ? 'text-white/80' : 'text-gray-400'}`}>{stateLabel}</span>}
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
        className={`flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80 2xl:gap-2.75`}
      >
        <MapPin
          className={`h-5 w-5 shrink-0 2xl:h-6 2xl:w-6 ${light ? 'text-white' : 'text-[#FF6A19]'}`}
          aria-hidden="true"
        />
        <div className="flex flex-col items-start gap-0.75 leading-tight">
          <span className={`text-[14px] font-bold 2xl:text-[16px] ${light ? 'text-white' : 'text-[#0D141C]'}`}>
            {cityLabel}
          </span>
          {stateLabel && (
            <span className={`text-[12px] 2xl:text-[13px] ${light ? 'text-white/80' : 'text-gray-400'}`}>
              {stateLabel}
            </span>
          )}
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
