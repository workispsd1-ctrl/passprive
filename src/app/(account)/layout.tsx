import { Header } from '@/components/layout'
import { PageTitleProvider } from '@/components/layout/MinimalHeader/PageTitleContext'
import { PageTitleBar } from '@/components/layout/MinimalHeader/PageTitleBar'
import { PlatformFlagsProvider } from '@/lib/context/PlatformFlagsContext'
import { getPlatformFlags } from '@/lib/services/platformFlags'

/** Account pages (bookings, wallet, membership, …): the site header + an app-style title row. */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const flags = await getPlatformFlags()
  return (
    <PlatformFlagsProvider flags={flags}>
    <PageTitleProvider>
      <Header minimal />
      <PageTitleBar />
      <div className="flex-1">
        {children}
      </div>
    </PageTitleProvider>
    </PlatformFlagsProvider>
  )
}
