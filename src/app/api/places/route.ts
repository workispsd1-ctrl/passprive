import { NextResponse } from 'next/server'
import { haversineKm } from '@/lib/utils'
import type { PlaceResult } from '@/lib/savedLocations'

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const API = 'https://maps.googleapis.com/maps/api'

type Component = { long_name: string; types: string[] }
type GeocodeResult = {
  formatted_address?: string
  place_id?: string
  types?: string[]
  address_components?: Component[]
  geometry?: { location?: { lat: number; lng: number } }
}
type PlaceRow = {
  place_id?: string
  name?: string
  vicinity?: string
  formatted_address?: string
  geometry?: { location?: { lat: number; lng: number } }
}

async function google<T>(path: string, params: Record<string, string>): Promise<T | null> {
  if (!KEY) return null
  const qs = new URLSearchParams({ ...params, key: KEY })
  const res = await fetch(`${API}/${path}?${qs}`, { cache: 'no-store' }).catch(() => null)
  return res?.ok ? ((await res.json()) as T) : null
}

const num = (v: string | null) => (v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null)
const pick = (components: Component[], ...types: string[]) =>
  components.find(c => types.every(t => c.types.includes(t)))?.long_name ?? ''
const PLUS_CODE = /^[A-Z0-9]{4,6}\+[A-Z0-9]{2,4},?\s*/
const stripPlusCode = (v = '') => v.replace(PLUS_CODE, '').trim()

/** A geocoder hit → title/address/city/area — app parity: AddAddressPinpoint reverseGeocode + SavedLocations geocodePlace. */
function describe(result: GeocodeResult, lat: number | null, lng: number | null): PlaceResult {
  const c = result.address_components ?? []
  const address = stripPlusCode(result.formatted_address) || result.formatted_address || ''
  let title =
    pick(c, 'point_of_interest') || pick(c, 'establishment') || pick(c, 'premise') || pick(c, 'route') ||
    pick(c, 'sublocality') || pick(c, 'neighborhood') || pick(c, 'locality') || address.split(',')[0]
  if (!title || PLUS_CODE.test(title)) title = pick(c, 'locality') || pick(c, 'administrative_area_level_2') || 'Selected location'
  return {
    id: result.place_id ?? `${lat},${lng}`,
    title,
    address,
    city: pick(c, 'locality') || pick(c, 'postal_town') || pick(c, 'administrative_area_level_2'),
    area: pick(c, 'sublocality') || pick(c, 'neighborhood'),
    pincode: pick(c, 'postal_code'),
    place_id: result.place_id ?? null,
    latitude: result.geometry?.location?.lat ?? lat,
    longitude: result.geometry?.location?.lng ?? lng,
  }
}

const fromPlace = (p: PlaceRow, i: number, prefix: string): PlaceResult => ({
  id: p.place_id ?? `${prefix}-${i}`,
  title: p.name ?? 'Suggested place',
  address: p.formatted_address ?? p.vicinity ?? '',
  city: '',
  area: '',
  pincode: '',
  place_id: p.place_id ?? null,
  latitude: p.geometry?.location?.lat ?? null,
  longitude: p.geometry?.location?.lng ?? null,
})

/**
 * Google Places/Geocoding for the location pages, server-side because the REST
 * endpoints don't allow browser calls — app parity: SavedLocations.jsx /
 * AddAddressPinpoint.jsx. `mode`:
 * - `search&q=` autocomplete, falling back to text search
 * - `nearby&lat=&lng=` the 5 closest places within 1.5 km
 * - `reverse&lat=&lng=` the place under the map pin
 * - `geocode&place_id=|q=` coordinates for a search suggestion
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const mode = url.searchParams.get('mode')
  const q = (url.searchParams.get('q') ?? '').trim()
  const lat = num(url.searchParams.get('lat'))
  const lng = num(url.searchParams.get('lng'))
  const near = lat != null && lng != null ? `${lat},${lng}` : null

  if (mode === 'search') {
    if (q.length < 2) return NextResponse.json({ places: [] })
    const auto = await google<{ predictions?: { place_id?: string; description?: string; structured_formatting?: { main_text?: string; secondary_text?: string } }[] }>(
      'place/autocomplete/json',
      { input: q, components: 'country:mu', ...(near ? { location: near, radius: '50000' } : {}) },
    )
    let places: PlaceResult[] = (auto?.predictions ?? []).map((p, i) => ({
      id: p.place_id ?? `auto-${i}`,
      title: p.structured_formatting?.main_text ?? p.description ?? 'Suggested place',
      address: p.structured_formatting?.secondary_text ?? p.description ?? '',
      city: '',
      area: '',
      pincode: '',
      place_id: p.place_id ?? null,
      latitude: null,
      longitude: null,
    }))
    if (!places.length) {
      const text = await google<{ results?: PlaceRow[] }>('place/textsearch/json', { query: q })
      places = (text?.results ?? []).map((p, i) => fromPlace(p, i, 'text'))
    }
    return NextResponse.json({ places: places.slice(0, 10) })
  }

  if (mode === 'nearby') {
    if (lat == null || lng == null) return NextResponse.json({ places: [] })
    const data = await google<{ results?: PlaceRow[] }>('place/nearbysearch/json', { location: `${lat},${lng}`, radius: '1500' })
    const places = (data?.results ?? [])
      .map((p, i) => fromPlace(p, i, 'nearby'))
      .filter(p => p.title && p.address)
      .map(p => ({ ...p, distance_km: p.latitude != null && p.longitude != null ? haversineKm(lat, lng, p.latitude, p.longitude) : null }))
      .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity))
      .slice(0, 5)
    return NextResponse.json({ places })
  }

  if (mode === 'reverse') {
    if (lat == null || lng == null) return NextResponse.json({ place: null })
    const data = await google<{ results?: GeocodeResult[] }>('geocode/json', {
      latlng: `${lat},${lng}`,
      result_type: 'street_address|route|premise|point_of_interest|neighborhood|sublocality|locality',
    })
    const results = data?.results ?? []
    const best = results.find(r => !(r.types ?? []).includes('plus_code')) ?? results[0]
    return NextResponse.json({ place: best ? { ...describe(best, lat, lng), latitude: lat, longitude: lng } : null })
  }

  if (mode === 'geocode') {
    const placeId = url.searchParams.get('place_id')
    if (!placeId && !q) return NextResponse.json({ place: null })
    const data = await google<{ results?: GeocodeResult[] }>('geocode/json', placeId ? { place_id: placeId } : { address: q })
    const best = data?.results?.[0]
    return NextResponse.json({ place: best ? describe(best, null, null) : null })
  }

  return NextResponse.json({ error: 'Unknown mode' }, { status: 400 })
}
