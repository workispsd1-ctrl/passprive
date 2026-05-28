import Image from 'next/image'
import Link from 'next/link'
import { HeaderActions } from '@/components/layout/Header/HeaderActions'
import { PageTitleProvider } from '@/components/layout/MinimalHeader/PageTitleContext'
import { MinimalHeaderTitle } from '@/components/layout/MinimalHeader/MinimalHeaderTitle'
import { getCurrentUser } from '@/lib/services/user'

export default async function MinimalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  return (
    <PageTitleProvider>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 h-16 gap-2 max-w-7xl mx-auto">
          <Link href="/" aria-label="PassPrive home">
            <Image
              src="/passpriveLogo.png"
              alt="PassPrive"
              width={120}
              height={40}
              className="h-11 w-auto object-contain"
            />
          </Link>
          <MinimalHeaderTitle />
          <div className="flex justify-end">
            <HeaderActions user={user} />
          </div>
        </div>
      </header>
      <div className="flex-1">
        {children}
      </div>
    </PageTitleProvider>
  )
}
