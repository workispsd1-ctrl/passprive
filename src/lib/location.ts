import { cookies } from 'next/headers'
import { COORDS_COOKIE, parseCoords, type Coords } from '@/lib/locationCookie'

/** The visitor's coordinates as last reported by the browser (null until they share/pick a location). */
export async function getUserCoords(): Promise<Coords | null> {
  return parseCoords((await cookies()).get(COORDS_COOKIE)?.value)
}
