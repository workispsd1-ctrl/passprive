import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { HeaderNav } from './HeaderNav'
import { HeaderActions } from './HeaderActions'
import { SearchBar } from '@/components/SearchBar'
import { DesktopHeaderClient } from './DesktopHeaderClient'

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
          <button
            type="button"
            aria-label="Change location"
            className="flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[13px] font-bold text-gray-900">Gurugram</span>
              <span className="text-[11px] text-gray-400">Haryana</span>
            </div>
          </button>
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
