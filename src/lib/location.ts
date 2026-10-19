import { cookies } from 'next/headers'
import {
  COORDS_COOKIE,
  LOCATION_COOKIE,
  parseCoords,
  parseSavedLocation,
  type Coords,
  type SavedLocation,
} from '@/lib/locationCookie'

/** The visitor's coordinates as last reported by the browser (null until they share/pick a location). */
export async function getUserCoords(): Promise<Coords | null> {
  return parseCoords((await cookies()).get(COORDS_COOKIE)?.value)
}

/** The location the header shows (label + coordinates), restored from cookies for the first render. */
export async function getHeaderLocation(): Promise<(SavedLocation & { coords: Coords | null }) | null> {
  const store = await cookies()
  const saved = parseSavedLocation(store.get(LOCATION_COOKIE)?.value)
  return saved ? { ...saved, coords: parseCoords(store.get(COORDS_COOKIE)?.value) } : null
}
