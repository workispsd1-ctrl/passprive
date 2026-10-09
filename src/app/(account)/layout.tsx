import { Header } from '@/components/layout'
import { PageTitleProvider } from '@/components/layout/MinimalHeader/PageTitleContext'
import { PageTitleBar } from '@/components/layout/MinimalHeader/PageTitleBar'

/** Account pages (bookings, wallet, membership, …): the site header + an app-style title row. */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageTitleProvider>
      <Header minimal />
      <PageTitleBar />
      <div className="flex-1">
        {children}
      </div>
    </PageTitleProvider>
  )
}
