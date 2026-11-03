'use client'

import { useEffect, useState } from 'react'
import { Briefcase, Hotel, Home, Loader2, LocateFixed, MapPin, Plus, Search, Trash2 } from 'lucide-react'
import { useLocation } from '@/lib/context/LocationContext'
import {
  GUEST_LOCATIONS_KEY,
  GUEST_LOCATIONS_MAX,
  LOCATION_LABELS,
  dedupeLocations,
  locationIdentity,
  resolveLabel,
  type NewSavedLocation,
  type SavedLocationRow,
} from '@/lib/savedLocations'
import { cn } from '@/lib/utils'

type Draft = Pick<NewSavedLocation, 'address_text' | 'city' | 'area' | 'pincode' | 'latitude' | 'longitude' | 'place_id'>

function readGuest(): SavedLocationRow[] {
  try {
    const rows = JSON.parse(localStorage.getItem(GUEST_LOCATIONS_KEY) ?? '[]')
    return Array.isArray(rows) ? rows : []
  } catch { return [] }
}
function writeGuest(rows: SavedLocationRow[]) {
  try { localStorage.setItem(GUEST_LOCATIONS_KEY, JSON.stringify(rows.slice(0, GUEST_LOCATIONS_MAX))) } catch { /* storage unavailable */ }
}

type NominatimAddress = { suburb?: string; village?: string; town?: string; city?: string; county?: string; postcode?: string; state?: string }
type NominatimPlace = { place_id?: number; display_name?: string; lat?: string; lon?: string; address?: NominatimAddress }

function toDraft(place: NominatimPlace): Draft {
  const a = place.address ?? {}
  return {
    address_text: place.display_name ?? '',
    city: a.city ?? a.town ?? a.village ?? a.county ?? null,
    area: a.suburb ?? a.village ?? a.town ?? null,
    pincode: a.postcode ?? null,
    latitude: place.lat != null ? Number(place.lat) : null,
    longitude: place.lon != null ? Number(place.lon) : null,
    place_id: place.place_id != null ? `osm:${place.place_id}` : null,
  }
}

const LABEL_ICON: Record<string, typeof Home> = { home: Home, office: Briefcase, hotel: Hotel }

/**
 * Saved addresses in the location dialog: pick one, delete one, or add a new
 * one by search or GPS and label it — app parity: SavedLocations.jsx →
 * AddAddressPinpoint → LabelAddress. Signed-in members' addresses are stored
 * on their account, guests' in this browser.
 */
export function SavedLocationsPanel({ onDone }: { onDone: () => void }) {
  const { setLocationByPlace } = useLocation()
  const [rows, setRows] = useState<SavedLocationRow[]>([])
  const [guest, setGuest] = useState(false)
  const [step, setStep] = useState<'list' | 'find' | 'label'>('list')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimPlace[]>([])
  const [finding, setFinding] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [labelType, setLabelType] = useState('home')
  const [customLabel, setCustomLabel] = useState('')
  const [building, setBuilding] = useState('')
  const [landmark, setLandmark] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetch('/api/locations')
      .then(res => res.json())
      .then((data: { locations: SavedLocationRow[] | null }) => {
        if (!active) return
        if (data.locations) setRows(dedupeLocations(data.locations))
        else { setGuest(true); setRows(dedupeLocations(readGuest())) }
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  function apply(row: Pick<SavedLocationRow, 'label' | 'address_text' | 'city' | 'area' | 'latitude' | 'longitude'>) {
    setLocationByPlace({
      city: row.area || row.city || row.label || row.address_text,
      state: row.city ?? '',
      lat: row.latitude,
      lng: row.longitude,
    })
    onDone()
  }

  async function search() {
    const q = query.trim()
    if (!q || finding) return
    setFinding(true)
    setError('')
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=mu&format=json&addressdetails=1&limit=6`, { headers: { 'Accept-Language': 'en' } })
      const places = (await res.json()) as NominatimPlace[]
      setResults(places)
      if (!places.length) setError('No places found. Try another name.')
    } catch {
      setError('Could not search right now. Please try again.')
    } finally {
      setFinding(false)
    }
  }

  function useGps() {
    if (!navigator.geolocation) { setError('Location is not available in this browser.'); return }
    setFinding(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`, { headers: { 'Accept-Language': 'en' } })
          const place = (await res.json()) as NominatimPlace
          setDraft({ ...toDraft(place), latitude, longitude })
          setStep('label')
        } catch {
          setError('Could not find your address. Please search for it instead.')
        } finally {
          setFinding(false)
        }
      },
      () => { setFinding(false); setError('Allow location access, or search for your address instead.') },
    )
  }

  async function save() {
    if (!draft || saving) return
    setSaving(true)
    setError('')
    const row: NewSavedLocation = {
      ...draft,
      label: resolveLabel(labelType, customLabel),
      label_type: labelType,
      building_floor: building.trim() || null,
      landmark: landmark.trim() || null,
    }
    if (guest) {
      const next = [{ ...row, id: `guest-location-${Date.now()}`, is_default: true }, ...readGuest().filter(r => locationIdentity(r) !== locationIdentity(row)).map(r => ({ ...r, is_default: false }))]
      writeGuest(next)
      setSaving(false)
      apply(row)
      return
    }
    const res = await fetch('/api/locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row) }).catch(() => null)
    setSaving(false)
    if (!res?.ok) { setError('Could not save this address. Please try again.'); return }
    apply(row)
  }

  async function remove(id: string) {
    setRows(list => list.filter(r => r.id !== id))
    if (guest) { writeGuest(readGuest().filter(r => r.id !== id)); return }
    await fetch(`/api/locations?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
  }

  if (step === 'label' && draft) {
    return (
      <div className='space-y-3'>
        <h3 className='text-sm font-semibold text-gray-900'>Label this address</h3>
        <p className='flex items-start gap-2 text-sm text-gray-600'><MapPin className='mt-0.5 size-4 shrink-0 text-brand' /> {draft.address_text}</p>
        <div className='flex flex-wrap gap-2'>
          {LOCATION_LABELS.map(l => (
            <button key={l.key} type='button' onClick={() => setLabelType(l.key)} className={cn('rounded-full border px-4 py-2 text-sm font-medium', labelType === l.key ? 'border-brand bg-brand text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50')}>
              {l.label}
            </button>
          ))}
        </div>
        {labelType === 'others' && <input value={customLabel} onChange={e => setCustomLabel(e.target.value)} placeholder='Name this address' className='h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-brand' />}
        <input value={building} onChange={e => setBuilding(e.target.value)} placeholder='Building / floor (optional)' className='h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-brand' />
        <input value={landmark} onChange={e => setLandmark(e.target.value)} placeholder='Landmark (optional)' className='h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-brand' />
        {error && <p role='alert' className='text-sm font-medium text-red-600'>{error}</p>}
        <div className='flex gap-2'>
          <button type='button' onClick={() => setStep('find')} className='h-11 flex-1 rounded-full border border-gray-300 text-sm font-semibold text-gray-900 hover:bg-gray-50'>Back</button>
          <button type='button' disabled={saving} onClick={save} className='h-11 flex-1 rounded-full bg-brand text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60'>{saving ? 'Saving…' : 'Save address'}</button>
        </div>
      </div>
    )
  }

  if (step === 'find') {
    return (
      <div className='space-y-3'>
        <h3 className='text-sm font-semibold text-gray-900'>Add address</h3>
        <form onSubmit={e => { e.preventDefault(); void search() }} className='relative'>
          <Search className='pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400' />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder='Search for your address' aria-label='Search for your address' className='h-11 w-full rounded-xl border border-gray-200 pr-20 pl-10 text-sm outline-none focus:border-brand' />
          <button type='submit' className='absolute top-1/2 right-1.5 h-8 -translate-y-1/2 rounded-lg bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-dark'>Search</button>
        </form>
        <button type='button' onClick={useGps} className='flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark'>
          {finding ? <Loader2 className='size-4 animate-spin' /> : <LocateFixed className='size-4' />} Use my current location
        </button>
        {error && <p role='alert' className='text-sm font-medium text-red-600'>{error}</p>}
        {results.map(place => (
          <button key={place.place_id} type='button' onClick={() => { setDraft(toDraft(place)); setError(''); setStep('label') }} className='flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left text-sm text-gray-700 hover:bg-brand-tint'>
            <MapPin className='mt-0.5 size-4 shrink-0 text-brand' /> {place.display_name}
          </button>
        ))}
        <button type='button' onClick={() => { setStep('list'); setError('') }} className='text-sm font-medium text-gray-500 hover:text-gray-800'>Back to saved addresses</button>
      </div>
    )
  }

  return (
    <div>
      <div className='mb-2 flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-gray-900'>Saved addresses</h3>
        <button type='button' onClick={() => setStep('find')} className='flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark'>
          <Plus className='size-4' /> Add address
        </button>
      </div>
      {rows.length === 0 && <p className='text-[13px] text-gray-400'>Save your home, office or hotel to switch quickly.</p>}
      {rows.map(row => {
        const Icon = LABEL_ICON[row.label_type ?? ''] ?? MapPin
        return (
          <div key={row.id} className='flex items-center gap-1 rounded-xl hover:bg-brand-tint'>
            <button type='button' onClick={() => apply(row)} className='flex min-w-0 flex-1 items-center gap-2.5 px-2 py-2 text-left'>
              <Icon className='size-4 shrink-0 text-brand' />
              <span className='min-w-0'>
                <span className='block text-sm font-medium text-gray-800'>{row.label || 'Saved address'}</span>
                <span className='block truncate text-xs text-gray-400'>{row.address_text}</span>
              </span>
            </button>
            <button type='button' aria-label={`Delete ${row.label || 'address'}`} onClick={() => remove(row.id)} className='mr-1 rounded-full p-2 text-gray-400 hover:bg-white hover:text-red-600'>
              <Trash2 className='size-4' />
            </button>
          </div>
        )
      })}
    </div>
  )
}
