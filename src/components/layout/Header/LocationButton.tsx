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
  const { location, detecting, unavailable, setLocationByCity, detectFromGPS } = useLocation()
  const [dialogOpen, setDialogOpen] = useState(false)

  const light = theme === 'light'
  // app parity: "Location unavailable" when GPS was denied or failed and nothing is saved
  const cityLabel = location.city || (detecting ? 'Detecting…' : unavailable ? 'Location unavailable' : 'Set location')
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
        className="flex shrink-0 items-center gap-[calc(var(--u)*11)] transition-opacity hover:opacity-80"
      >
        {/* sizes use the desktop header's --u (1920 → 1px) — see DesktopHeaderClient */}
        <MapPin
          className={`h-[calc(var(--u)*40)] w-[calc(var(--u)*40)] shrink-0 ${light ? 'text-white' : 'text-[#FF6A19]'}`}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        {/* tablets: the pin alone, so the search keeps its room — the name shows from lg */}
        <div className="hidden w-[calc(var(--u)*190)] flex-col items-start gap-[calc(var(--u)*3)] text-left font-(family-name:--font-dm-sans) lg:flex">
          <span className={`w-full truncate text-[length:calc(var(--u)*20)] leading-[calc(var(--u)*20)] font-bold ${light ? 'text-white' : 'text-[#0D141C]'}`}>
            {cityLabel}
          </span>
          {stateLabel && (
            <span className={`w-full truncate text-[length:calc(var(--u)*16)] leading-[calc(var(--u)*20)] font-medium ${light ? 'text-white/80' : 'text-[#606366]'}`}>
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
