import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { HeaderNav } from './HeaderNav'
import { HeaderActions } from './HeaderActions'

export async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">

      {/* Desktop layout */}
      <div className="hidden md:flex mx-auto max-w-7xl px-6 h-16 items-center justify-between gap-8">
        <div className="flex items-center gap-5 shrink-0">
          <Link href="/" aria-label="PassPrive home" className="flex items-center">
            <Image
              src="/passpriveLogo.png"
              alt="PassPrive"
              width={180}
              height={58}
              className="h-12 w-auto object-contain"
            />
          </Link>
          <button
            type="button"
            aria-label="Change location"
            className="flex items-center gap-1 text-[13px] text-gray-700 hover:text-gray-900 transition-colors"
          >
            <MapPin className="w-3 h-3 text-gray-400 shrink-0" aria-hidden="true" />
            <span className="font-medium">Gurugram, Haryana</span>
          </button>
        </div>
        <HeaderNav />
        <HeaderActions user={user} />
      </div>

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
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 h-9">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
            <span className="text-[12px] text-gray-400">Search for events, movies and restaurants</span>
          </div>
        </div>

        {/* Row 3: Tab nav */}
        <HeaderNav />
      </div>

    </header>
  )
}
