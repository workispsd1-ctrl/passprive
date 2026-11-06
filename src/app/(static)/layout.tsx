import { Header } from '@/components/layout'
import { LocationProvider } from '@/lib/context/LocationContext'
import { getHeaderLocation } from '@/lib/location'

/** FAQs, terms, privacy, support: the site header; each page has its own app-style title row. */
export default async function SimpleLayout({ children }: { children: React.ReactNode }) {
  // same saved location as the browsing pages, so the header shows the picked city
  const headerLocation = await getHeaderLocation()
  return (
    <LocationProvider initial={headerLocation}>
      <Header minimal />
      <div className="flex-1">
        {children}
      </div>
    </LocationProvider>
  )
}
