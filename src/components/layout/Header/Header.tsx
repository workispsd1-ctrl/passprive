import { HeaderNav } from './HeaderNav'
import { HeaderActions } from './HeaderActions'
import { SearchBar } from '@/components/SearchBar'
import { DesktopHeaderClient } from './DesktopHeaderClient'
import { LocationButton } from './LocationButton'
import { getCurrentUser } from '@/lib/services/user'

export async function Header() {
  const user = await getCurrentUser()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">

      <DesktopHeaderClient user={user} />

      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <LocationButton variant="mobile" />
          <HeaderActions user={user} />
        </div>

        <div className="px-4 pb-2">
          <SearchBar variant="mobile" />
        </div>

        <HeaderNav />
      </div>

    </header>
  )
}
