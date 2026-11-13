import { Header } from '@/components/layout'
import { PageTitleProvider } from '@/components/layout/MinimalHeader/PageTitleContext'
import { PageTitleBar } from '@/components/layout/MinimalHeader/PageTitleBar'
import { PlatformFlagsProvider } from '@/lib/context/PlatformFlagsContext'
import { getPlatformFlags } from '@/lib/services/platformFlags'
import { LocationProvider } from '@/lib/context/LocationContext'
import { getHeaderLocation } from '@/lib/location'
import { AuthPromptProvider } from '@/lib/context/AuthPromptContext'
import { HeaderGate } from '@/components/layout/HeaderGate'

/** Account pages (bookings, wallet, membership, …): the site header + an app-style title row. */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [flags, headerLocation] = await Promise.all([getPlatformFlags(), getHeaderLocation()])
  return (
    <PlatformFlagsProvider flags={flags}>
    <LocationProvider initial={headerLocation}>
    <AuthPromptProvider>
    <PageTitleProvider>
      <HeaderGate>
        <Header minimal />
      </HeaderGate>
      <PageTitleBar />
      <div className="flex-1">
        {children}
      </div>
    </PageTitleProvider>
    </AuthPromptProvider>
    </LocationProvider>
    </PlatformFlagsProvider>
  )
}
