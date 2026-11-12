'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { useLocation } from '@/lib/context/LocationContext'
import { CITY_DATA } from '@/components/layout/Header/cityData'
import {
  GUEST_LOCATIONS_KEY,
  GUEST_LOCATIONS_MAX,
  POPULAR_AREAS,
  TOURIST_HOTSPOTS,
  dedupeLocations,
  locationIdentity,
  sameSpot,
  splitLocations,
  type NewSavedLocation,
  type PlaceResult,
  type SavedLocationRow,
} from '@/lib/savedLocations'
import { cn, haversineKm } from '@/lib/utils'
import { ActionPill, AddressSection, Divider, ListCard, PageBar, SearchField, SectionTitle, type AddressItem } from './shared'
import { CrosshairIcon, SearchResults, usePlaceSearch } from './search'
import { AddAddress } from './AddAddress'
import { getCoords, reversePlace } from './geo'

function readGuest(): SavedLocationRow[] {
  try {
    const rows = JSON.parse(localStorage.getItem(GUEST_LOCATIONS_KEY) ?? '[]')
    return Array.isArray(rows) ? rows : []
  } catch { return [] }
}
function writeGuest(rows: SavedLocationRow[]) {
  try { localStorage.setItem(GUEST_LOCATIONS_KEY, JSON.stringify(rows.slice(0, GUEST_LOCATIONS_MAX))) } catch { /* storage unavailable */ }
}

const titleOf = (row: Pick<SavedLocationRow, 'label' | 'area' | 'city' | 'address_text'>) =>
  row.label || row.area || row.city || row.address_text.split(',')[0] || 'Saved location'

/**
 * "Select your location" — app parity: SavedLocations.jsx (search, current
 * location, saved / recent / nearby) plus the Figma directory of popular
 * areas, tourist hotspots and every city. "Add new address" opens the
 * pin-and-label flow. Picking anything sets the site's location and returns to
 * the page the visitor came from.
 */
export function LocationFlow() {
  const router = useRouter()
  const { location, setLocationByCity, setLocationByPlace } = useLocation()
  const [adding, setAdding] = useState(false)
  const [rows, setRows] = useState<SavedLocationRow[]>([])
  const [guest, setGuest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAllSaved, setShowAllSaved] = useState(false)
  const [nearby, setNearby] = useState<PlaceResult[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const search = usePlaceSearch(location)

  useEffect(() => {
    let active = true
    fetch('/api/locations')
      .then(res => res.json())
      .then((data: { locations: SavedLocationRow[] | null }) => {
        if (!active) return
        if (data.locations) setRows(data.locations)
        else { setGuest(true); setRows(readGuest()) }
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  // Nearby places around the current location — app parity: fetchNearbyPlaceSuggestions
  const { lat, lng } = location
  useEffect(() => {
    if (lat == null || lng == null) return
    let active = true
    fetch(`/api/places?mode=nearby&lat=${lat}&lng=${lng}`)
      .then(res => res.json())
      .then((data: { places: PlaceResult[] }) => active && setNearby(data.places ?? []))
      .catch(() => {})
    return () => { active = false }
  }, [lat, lng])

  const leave = useCallback(() => {
    if (window.history.length > 1) router.back()
    else router.push('/')
  }, [router])

  /** Sets the site's location and saves it as the default, recent address — app parity: persistSelectedLocation. */
  const choose = useCallback(async (row: NewSavedLocation) => {
    const display = row.area || row.city || row.label || row.address_text.split(',')[0]
    setLocationByPlace({ city: display, state: row.city && row.city !== display ? row.city : '', lat: row.latitude, lng: row.longitude })
    if (guest) {
      const next = [
        { ...row, id: `guest-location-${Date.now()}`, is_default: true, is_recent: true },
        ...readGuest().filter(r => locationIdentity(r) !== locationIdentity(row)).map(r => ({ ...r, is_default: false })),
      ]
      writeGuest(next)
    } else {
      // keepalive: the save finishes even as the page navigates away
      fetch('/api/locations', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row) }).catch(() => {})
    }
    leave()
  }, [guest, leave, setLocationByPlace])

  const fromPlace = useCallback(async (place: PlaceResult) => {
    setBusy(true)
    setError('')
    let p = place
    if (p.latitude == null || p.longitude == null || !p.city) {
      const q = [place.title, place.address].filter(Boolean).join(', ')
      const res = await fetch(`/api/places?mode=geocode&${place.place_id ? `place_id=${encodeURIComponent(place.place_id)}` : `q=${encodeURIComponent(q)}`}`).catch(() => null)
      const data = (await res?.json().catch(() => null)) as { place: PlaceResult | null } | null
      if (data?.place) p = { ...data.place, title: place.title }
    }
    await choose({
      label: p.title,
      label_type: null,
      building_floor: null,
      landmark: null,
      address_text: p.address || [place.title, place.address].filter(Boolean).join(', '),
      city: p.city || null,
      area: p.area || null,
      pincode: p.pincode || null,
      latitude: p.latitude,
      longitude: p.longitude,
      place_id: p.place_id,
    })
  }, [choose])

  async function useCurrent() {
    setBusy(true)
    setError('')
    try {
      const { lat, lng } = await getCoords()
      const place = await reversePlace(lat, lng)
      if (!place) throw new Error('geocode')
      await choose({
        label: place.area || place.title || place.city,
        label_type: null,
        building_floor: null,
        landmark: null,
        address_text: place.address,
        city: place.city || null,
        area: place.area || place.title || null,
        pincode: place.pincode || null,
        latitude: lat,
        longitude: lng,
        place_id: place.place_id,
      })
    } catch (e) {
      setBusy(false)
      setError((e as GeolocationPositionError)?.code === 1 ? 'Allow location access, or search for your area instead.' : "Couldn't find your area. Please search for it instead.")
    }
  }

  async function remove(id: string) {
    setRows(list => list.filter(r => r.id !== id))
    if (guest) { writeGuest(readGuest().filter(r => r.id !== id)); return }
    await fetch(`/api/locations?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
  }

  const kmTo = useCallback(
    (la: number | null, ln: number | null) => (lat != null && lng != null && la != null && ln != null ? haversineKm(lat, lng, la, ln) : null),
    [lat, lng],
  )
  const isCurrent = useCallback((r: { latitude: number | null; longitude: number | null }) => sameSpot(location, r), [location])

  const { saved, recent } = useMemo(() => splitLocations(rows, isCurrent), [rows, isCurrent])
  const toItem = (r: SavedLocationRow): AddressItem => ({ key: r.id, title: titleOf(r), address: r.address_text, km: kmTo(r.latitude, r.longitude), selected: isCurrent(r) })
  const savedItems = (showAllSaved ? saved : saved.slice(0, 2)).map(toItem)
  const recentItems = recent.map(toItem)
  // app parity: Google's nearby places, else your own addresses by distance
  const nearbyItems: AddressItem[] = (nearby.length
    ? nearby.map(p => ({ key: p.id, title: p.title, address: p.address, km: p.distance_km }))
    : lat != null
      ? dedupeLocations(rows)
          .filter(r => r.latitude != null && r.longitude != null)
          .map(toItem)
          .sort((a, b) => (a.km ?? 0) - (b.km ?? 0))
          .slice(0, 5)
      : [])

  const pickRow = (id: string) => {
    const row = rows.find(r => r.id === id)
    if (!row) return
    setBusy(true)
    void choose({
      label: titleOf(row),
      label_type: row.label_type,
      building_floor: row.building_floor,
      landmark: row.landmark,
      address_text: row.address_text,
      city: row.city,
      area: row.area,
      pincode: row.pincode,
      latitude: row.latitude,
      longitude: row.longitude,
      place_id: row.place_id,
    })
  }
  const pickNearby = (id: string) => {
    const place = nearby.find(p => p.id === id)
    if (place) void fromPlace(place)
    else pickRow(id)
  }
  const pickCity = (name: string, region: string) => {
    void setLocationByCity(name, region, 'mu')
    leave()
  }

  if (adding) return <AddAddress guest={guest} onBack={() => setAdding(false)} onDone={leave} />

  const searching = search.query.trim().length > 0
  const allCities = CITY_DATA.mu.allCities

  return (
    <div className='flex flex-col gap-40 px-172 pt-48 pb-72 max-lg:gap-20 max-lg:px-16 max-lg:pt-16 max-lg:pb-112'>
      <PageBar title='Select your location' onBack={() => (searching ? search.setQuery('') : leave())} />

      <div>
        {/* Figma: search 1000 · gap 16 · two 272 pills */}
        <div className='flex gap-16 max-lg:flex-wrap max-lg:gap-12'>
          <SearchField
            value={search.query}
            onChange={search.setQuery}
            placeholder='Search for area, street name…'
            loading={search.loading}
            className={cn(searching ? 'w-full' : 'w-1000', 'max-lg:w-full')}
          />
          {!searching && (
            <>
              <ActionPill icon={<CrosshairIcon />} onClick={useCurrent} disabled={busy} className='w-272 max-lg:w-auto max-lg:flex-1'>
                Use current location
              </ActionPill>
              <ActionPill icon={<Plus className='size-16 text-[#FF4800]' strokeWidth={2.5} />} onClick={() => setAdding(true)} className='w-272 max-lg:w-auto max-lg:flex-1'>
                Add new address
              </ActionPill>
            </>
          )}
        </div>

        {error && <p role='alert' className='mt-16 text-[calc(14*var(--u))] leading-20 font-medium text-[#D92D20] max-lg:text-[14px]'>{error}</p>}

        {searching ? (
          <SearchResults search={search} kmTo={kmTo} onPick={fromPlace} className='mt-48 max-lg:mt-20' />
        ) : (
          <>
            {/* Figma: saved / recent / nearby, 3 × 509.33 with 24 gaps, 56 under the search */}
            {(loading || savedItems.length > 0 || recentItems.length > 0 || nearbyItems.length > 0) && (
              <div className='mt-56 grid grid-cols-3 items-start gap-24 max-lg:mt-24 max-lg:grid-cols-1 max-lg:gap-28'>
                {loading ? (
                  <LoadingCard />
                ) : (
                  <>
                    <AddressSection
                      title='Saved addresses'
                      items={savedItems}
                      onSelect={pickRow}
                      onRemove={remove}
                      footer={!showAllSaved && saved.length > 2 && (
                        <>
                          <Divider />
                          <button type='button' onClick={() => setShowAllSaved(true)} className='w-full pt-16 pb-12 text-center text-[calc(14*var(--u))] leading-20 font-bold text-[#FF4800] hover:underline max-lg:text-[14px]'>
                            View all
                          </button>
                        </>
                      )}
                    />
                    <AddressSection title='Recent locations' items={recentItems} onSelect={pickRow} />
                    <AddressSection title='Nearby locations' items={nearbyItems} onSelect={pickNearby} />
                  </>
                )}
              </div>
            )}

            {/* Figma: popular areas / tourist hotspots / all locations, 72 below */}
            <div className='mt-72 grid grid-cols-3 items-start gap-24 max-lg:mt-28 max-lg:grid-cols-1 max-lg:gap-28'>
              <ChipSection title='Popular areas' items={POPULAR_AREAS.map(a => ({ key: a.name, label: a.name, onPick: () => pickCity(a.name, a.region) }))} />
              <ChipSection
                title='Tourist hotspots'
                items={TOURIST_HOTSPOTS.map(t => ({
                  key: t.name,
                  label: t.name,
                  onPick: () => { setLocationByPlace({ city: t.name, state: t.region, lat: t.lat, lng: t.lng }); leave() },
                }))}
              />
              <section className='flex min-w-0 flex-col gap-16'>
                <SectionTitle>All locations</SectionTitle>
                <ListCard className='max-h-264 overflow-y-auto overscroll-contain'>
                  {allCities.map((c, i) => (
                    <div key={c.name}>
                      {i > 0 && <Divider />}
                      <button
                        type='button'
                        onClick={() => pickCity(c.name, c.region)}
                        className={cn('w-full px-24 pb-16 text-left text-[calc(16*var(--u))] leading-24 font-semibold text-[#1D1B20] hover:text-[#FF4800] max-lg:px-16', i === 0 ? 'pt-16' : 'pt-8')}
                      >
                        {c.name}
                      </button>
                    </div>
                  ))}
                </ListCard>
              </section>
            </div>
          </>
        )}
      </div>

      {busy && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-white/60'>
          <Loader2 className='size-40 animate-spin text-[#FF4800] max-lg:size-32' />
        </div>
      )}
    </div>
  )
}

/** Figma chips: 2 columns of 246.67 × 48 pills, gap 16, 20 under the title. */
function ChipSection({ title, items }: { title: string; items: { key: string; label: string; onPick: () => void }[] }) {
  return (
    <section className='flex min-w-0 flex-col gap-20 max-lg:gap-16'>
      <SectionTitle>{title}</SectionTitle>
      <div className='grid grid-cols-2 gap-16 max-lg:gap-12'>
        {items.map(item => (
          <button
            key={item.key}
            type='button'
            onClick={item.onPick}
            title={item.label}
            className='h-48 truncate rounded-[calc(24*var(--u))] border border-[#E6E0E9] bg-white px-12 text-center text-[calc(14*var(--u))] leading-20 font-semibold text-[#1D1B20] transition-colors hover:border-[#FF4800] hover:text-[#FF4800] max-lg:h-44'
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  )
}

function LoadingCard() {
  return (
    <div className='flex flex-col gap-16'>
      <div className='h-28 w-200 animate-pulse rounded-[calc(8*var(--u))] bg-[#F1EEF3]' />
      <ListCard>
        {[0, 1].map(i => (
          <div key={i} className='flex gap-16 px-24 py-20'>
            <div className='size-52 animate-pulse rounded-[calc(12*var(--u))] bg-[#F1EEF3]' />
            <div className='flex flex-1 flex-col gap-8'>
              <div className='h-20 w-3/5 animate-pulse rounded-[calc(6*var(--u))] bg-[#F1EEF3]' />
              <div className='h-16 w-full animate-pulse rounded-[calc(6*var(--u))] bg-[#F1EEF3]' />
            </div>
          </div>
        ))}
      </ListCard>
    </div>
  )
}
