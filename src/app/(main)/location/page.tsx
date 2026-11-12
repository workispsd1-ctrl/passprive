import type { Metadata } from 'next'
import { LOC_PAGE } from '@/components/location/unit'
import { LocationFlow } from '@/components/location/LocationFlow'

export const metadata: Metadata = {
  title: 'Select your location',
  robots: { index: false },
}

/** Select your location / Add address — app parity: SavedLocations → AddAddressPinpoint → LabelAddress. */
export default function LocationPage() {
  return (
    <main className={LOC_PAGE}>
      <LocationFlow />
    </main>
  )
}
