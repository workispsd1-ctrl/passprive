import { createClient } from '@/lib/supabase/server'
import { HeaderNav } from './HeaderNav'
import { HeaderActions } from './HeaderActions'
import { SearchBar } from '@/components/SearchBar'
import { DesktopHeaderClient } from './DesktopHeaderClient'
import { LocationButton } from './LocationButton'

export async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">

      {/* Desktop layout — client component owns search state */}
      <DesktopHeaderClient user={user} />

      {/* Mobile layout */}
      <div className="md:hidden">
        {/* Row 1: Location + User */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <LocationButton variant="mobile" />
          <HeaderActions user={user} />
        </div>

        {/* Row 2: Search bar */}
        <div className="px-4 pb-2">
          <SearchBar variant="mobile" />
        </div>

        {/* Row 3: Tab nav */}
        <HeaderNav />
      </div>

    </header>
  )
}
