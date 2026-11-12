'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from '@/lib/context/LocationContext'
import {
  GUEST_LOCATIONS_KEY,
  GUEST_LOCATIONS_MAX,
  LOCATION_LABELS,
  locationIdentity,
  resolveLabel,
  type NewSavedLocation,
  type PlaceResult,
  type SavedLocationRow,
} from '@/lib/savedLocations'
import { cn, haversineKm } from '@/lib/utils'
import { ActionPill, PageBar, PinBadge, PinGlyph, PrimaryButton, SearchField } from './shared'
import { CrosshairIcon, SearchResults, usePlaceSearch } from './search'
import { DEFAULT_CENTER, PinpointMap } from './PinpointMap'
import { getCoords, reversePlace } from './geo'

const PAGE = 'flex flex-col gap-40 px-172 pt-48 pb-72 max-lg:gap-20 max-lg:px-16 max-lg:pt-16 max-lg:pb-112'

/**
 * "Add address" — app parity: AddAddressPinpoint → LabelAddress. Drag the map
 * (or search / use GPS) to put the pin on the place, confirm, then label it.
 */
export function AddAddress({ guest, onBack, onDone }: { guest: boolean; onBack: () => void; onDone: () => void }) {
  const { location } = useLocation()
  const [step, setStep] = useState<'pin' | 'label'>('pin')
  const [center, setCenter] = useState(() =>
    location.lat != null && location.lng != null ? { lat: location.lat, lng: location.lng } : DEFAULT_CENTER,
  )
  const [place, setPlace] = useState<PlaceResult | null>(null)
  const [resolving, setResolving] = useState(true)
  const [error, setError] = useState('')
  const search = usePlaceSearch(location)
  const seq = useRef(0)

  const resolve = useCallback(async (lat: number, lng: number) => {
    const n = ++seq.current
    setResolving(true)
    const p = await reversePlace(lat, lng)
    if (n !== seq.current) return
    setResolving(false)
    setPlace(p ? { ...p, latitude: lat, longitude: lng } : null)
  }, [])

  const goTo = useCallback((lat: number, lng: number) => {
    setCenter({ lat, lng })
    void resolve(lat, lng)
  }, [resolve])

  const locate = useCallback(async (initial: boolean) => {
    setError('')
    try {
      const { lat, lng } = await getCoords()
      goTo(lat, lng)
    } catch (e) {
      if (initial) void resolve(center.lat, center.lng)
      else setError((e as GeolocationPositionError)?.code === 1 ? 'Allow location access, or move the pin instead.' : "Couldn't get your location. Move the pin instead.")
    }
  }, [center.lat, center.lng, goTo, resolve])

  // app parity: start on the device's position, else the site's location / Mauritius
  useEffect(() => {
    const hasSite = location.lat != null && location.lng != null
    const t = setTimeout(() => void (hasSite ? resolve(center.lat, center.lng) : locate(true)), 0)
    return () => clearTimeout(t)
    // once, on open — later moves come from the map, the search and the GPS button
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function pickSearch(p: PlaceResult) {
    search.setQuery('')
    if (p.latitude != null && p.longitude != null) { goTo(p.latitude, p.longitude); return }
    setResolving(true)
    const res = await fetch(`/api/places?mode=geocode&${p.place_id ? `place_id=${encodeURIComponent(p.place_id)}` : `q=${encodeURIComponent(p.address || p.title)}`}`).catch(() => null)
    const data = (await res?.json().catch(() => null)) as { place: PlaceResult | null } | null
    if (data?.place?.latitude != null && data.place.longitude != null) {
      setCenter({ lat: data.place.latitude, lng: data.place.longitude })
      setPlace({ ...data.place, title: p.title })
      setResolving(false)
    } else {
      setResolving(false)
      setError("Couldn't find that place. Try moving the pin.")
    }
  }

  const kmTo = (la: number | null, ln: number | null) =>
    location.lat != null && location.lng != null && la != null && ln != null ? haversineKm(location.lat, location.lng, la, ln) : null

  if (step === 'label' && place) {
    return <LabelStep place={place} guest={guest} km={kmTo(place.latitude, place.longitude)} onChange={() => setStep('pin')} onDone={onDone} />
  }

  // Figma "Address search": the search grows to the full width with results under it
  if (search.query.trim()) {
    return (
      <div className={PAGE}>
        <PageBar title='Add address' onBack={() => search.setQuery('')} />
        <div>
          <SearchField value={search.query} onChange={search.setQuery} placeholder='Search for area, street name…' loading={search.loading} autoFocus className='w-full' />
          <SearchResults search={search} kmTo={kmTo} onPick={pickSearch} className='mt-48 max-lg:mt-20' />
        </div>
      </div>
    )
  }

  return (
    <div className={PAGE}>
      <PageBar title='Add address' onBack={onBack} />
      {/* Figma "Location confirmation": 428 panel · 32 gap · map to the edge, 848 tall */}
      <div className='flex h-848 gap-32 max-lg:h-auto max-lg:flex-col max-lg:gap-16'>
        <div className='flex w-428 shrink-0 flex-col max-lg:contents'>
          <SearchField value={search.query} onChange={search.setQuery} placeholder='Search for area, street name…' small />
          <ActionPill icon={<CrosshairIcon />} onClick={() => void locate(false)} className='mt-24 h-52 w-full rounded-[calc(26*var(--u))] max-lg:mt-0'>
            Use current location
          </ActionPill>
          {error && <p role='alert' className='mt-12 text-[calc(14*var(--u))] leading-20 font-medium text-[#D92D20] max-lg:order-3 max-lg:mt-0 max-lg:text-[14px]'>{error}</p>}

          {/* Figma "Selected location": 428 × 284 card, r20, pin + 24/32 name, 16/24 address, CTA at 204 */}
          <div className='mt-32 flex min-h-284 flex-col rounded-[calc(20*var(--u))] border border-[#E6E0E9] bg-white p-24 max-lg:order-5 max-lg:mt-0 max-lg:min-h-0 max-lg:p-16'>
            <div className='flex items-start gap-21'>
              <PinGlyph className='mt-6 h-[calc(17.14*var(--u))] w-[calc(15.09*var(--u))] shrink-0' />
              <p className='min-w-0 flex-1 truncate text-[calc(24*var(--u))] leading-32 font-bold text-[#1D1B20] max-lg:text-[20px] max-lg:leading-28'>
                {resolving && !place ? 'Locating…' : place?.title || 'Move the pin'}
              </p>
            </div>
            <p className='mt-24 line-clamp-3 text-[calc(16*var(--u))] leading-24 text-[#605D64] max-lg:mt-8 max-lg:text-[14px] max-lg:leading-20'>
              {place?.address || (resolving ? 'Finding the address under the pin…' : 'Move the map to put the pin on your address.')}
            </p>
            <PrimaryButton onClick={() => setStep('label')} disabled={!place || resolving} className='mt-auto max-lg:mt-16'>
              Confirm &amp; proceed
            </PrimaryButton>
          </div>
        </div>

        <div className='min-w-0 flex-1 max-lg:order-4 max-lg:h-[360px] max-lg:flex-none'>
          <PinpointMap center={center} onMove={(lat, lng) => void resolve(lat, lng)} />
        </div>
      </div>
    </div>
  )
}

/**
 * Figma "Home address" / "Other address" — app parity: LabelAddress.jsx. The
 * chosen place on the left (Change → back to the pin), the label, an Others
 * name, building/floor and landmark on the right.
 */
function LabelStep({ place, guest, km, onChange, onDone }: { place: PlaceResult; guest: boolean; km: number | null; onChange: () => void; onDone: () => void }) {
  const { setLocationByPlace } = useLocation()
  const [labelType, setLabelType] = useState<string>('home')
  const [customLabel, setCustomLabel] = useState('')
  const [building, setBuilding] = useState('')
  const [landmark, setLandmark] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (saving) return
    setSaving(true)
    setError('')
    const row: NewSavedLocation = {
      label: resolveLabel(labelType, customLabel),
      label_type: labelType,
      building_floor: building.trim() || null,
      landmark: landmark.trim() || null,
      // app parity: the building/floor leads the saved address
      address_text: [building.trim(), place.address].filter(Boolean).join(', '),
      city: place.city || null,
      area: place.area || null,
      pincode: place.pincode || null,
      latitude: place.latitude,
      longitude: place.longitude,
      place_id: place.place_id,
    }
    if (guest) {
      let rows: SavedLocationRow[] = []
      try { rows = JSON.parse(localStorage.getItem(GUEST_LOCATIONS_KEY) ?? '[]') } catch { /* empty */ }
      const next = [
        { ...row, id: `guest-location-${Date.now()}`, is_default: true, is_recent: true },
        ...(Array.isArray(rows) ? rows : []).filter(r => locationIdentity(r) !== locationIdentity(row)).map(r => ({ ...r, is_default: false })),
      ]
      try { localStorage.setItem(GUEST_LOCATIONS_KEY, JSON.stringify(next.slice(0, GUEST_LOCATIONS_MAX))) } catch { /* storage unavailable */ }
    } else {
      const res = await fetch('/api/locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row) }).catch(() => null)
      if (!res?.ok) {
        setSaving(false)
        setError('Could not save this address. Please try again.')
        return
      }
    }
    const display = place.area || place.city || place.title
    setLocationByPlace({ city: display, state: place.city && place.city !== display ? place.city : '', lat: place.latitude, lng: place.longitude })
    onDone()
  }

  const input = 'h-56 w-full rounded-[calc(28*var(--u))] border border-[#E6E0E9] bg-white px-24 text-[calc(16*var(--u))] leading-24 font-medium text-[#1D1B20] outline-none placeholder:text-[#605D64] focus:border-[#FF4800] max-lg:h-52 max-lg:px-20 max-lg:text-[15px]'

  return (
    <div className={PAGE}>
      <PageBar title='Add address' onBack={onChange} />
      <div className='flex items-start gap-32 max-lg:flex-col max-lg:gap-16'>
        {/* Figma "Selected address": 548 card, badge at 28, 20/28 name + 16/24 address from 100, Change at 164 */}
        <div className='flex w-548 shrink-0 gap-20 rounded-[calc(20*var(--u))] border border-[#E6E0E9] bg-white px-28 pt-28 pb-40 max-lg:w-full max-lg:gap-14 max-lg:p-16'>
          <PinBadge km={km} />
          <div className='min-w-0 flex-1'>
            <p className='truncate text-[calc(20*var(--u))] leading-28 font-bold text-[#1D1B20] max-lg:text-[17px] max-lg:leading-24'>{place.title}</p>
            <p className='mt-12 line-clamp-2 min-h-48 text-[calc(16*var(--u))] leading-24 text-[#605D64] max-lg:mt-4 max-lg:min-h-0 max-lg:text-[14px] max-lg:leading-20'>{place.address}</p>
            <button type='button' onClick={onChange} className='mt-48 text-[calc(16*var(--u))] leading-24 font-bold text-[#FF4800] hover:underline max-lg:mt-12 max-lg:text-[15px]'>
              Change
            </button>
          </div>
        </div>

        {/* Figma "Location label and details": 996 card, 28/32 padding */}
        <div className='min-w-0 flex-1 rounded-[calc(20*var(--u))] border border-[#E6E0E9] bg-white px-32 pt-28 pb-32 max-lg:w-full max-lg:p-16'>
          <h2 className='text-[calc(24*var(--u))] leading-32 font-bold text-[#1D1B20] max-lg:text-[18px] max-lg:leading-26'>Label your location</h2>
          <div className='mt-28 flex flex-wrap gap-x-16 gap-y-10 max-lg:mt-16 max-lg:gap-x-8 max-lg:gap-y-8'>
            {LOCATION_LABELS.map(l => (
              <button
                key={l.key}
                type='button'
                aria-pressed={labelType === l.key}
                onClick={() => setLabelType(l.key)}
                className={cn(
                  'flex h-48 min-w-132 items-center justify-center rounded-[calc(24*var(--u))] px-24 py-12 text-[calc(16*var(--u))] leading-24 font-bold transition-colors max-lg:h-40 max-lg:min-w-0 max-lg:px-18 max-lg:text-[14px]',
                  labelType === l.key ? 'bg-[#FF4800] text-white' : 'border-[1.5px] border-[#E6E0E9] bg-white text-[#605D64] hover:border-[#FF4800]/50',
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          {labelType === 'others' && (
            <input value={customLabel} onChange={e => setCustomLabel(e.target.value)} placeholder='Save address as? (Eg. Gym, Mom’s house)' aria-label='Address name' className={cn(input, 'mt-28 max-lg:mt-16')} />
          )}
          <div className={cn('grid grid-cols-2 gap-24 max-lg:grid-cols-1 max-lg:gap-12', labelType === 'others' ? 'mt-24 max-lg:mt-12' : 'mt-28 max-lg:mt-16')}>
            <input value={building} onChange={e => setBuilding(e.target.value)} placeholder='Building / Floor (optional)' aria-label='Building / Floor' className={input} />
            <input value={landmark} onChange={e => setLandmark(e.target.value)} placeholder='Landmark (optional)' aria-label='Landmark' className={input} />
          </div>
          {error && <p role='alert' className='mt-16 text-[calc(14*var(--u))] leading-20 font-medium text-[#D92D20] max-lg:text-[14px]'>{error}</p>}
          <PrimaryButton onClick={save} disabled={saving} className='mt-64 max-lg:mt-24'>
            {saving ? 'Saving…' : 'Save address'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
