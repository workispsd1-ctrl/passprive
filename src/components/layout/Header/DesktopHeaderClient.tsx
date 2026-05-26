'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import { HeaderNav } from './HeaderNav'
import { HeaderActions } from './HeaderActions'
import { SearchBar } from '@/components/SearchBar'

interface Props {
  user: { email?: string } | null
}

export function DesktopHeaderClient({ user }: Props) {
  const [showSearch, setShowSearch] = useState(false)

  return (
    <div className="hidden md:flex mx-auto max-w-7xl px-6 h-16 items-center gap-6">
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
        {!showSearch && (
          <button
            type="button"
            aria-label="Change location"
            className="flex items-center gap-1 text-[13px] text-gray-700 hover:text-gray-900 transition-colors"
          >
            <MapPin className="w-3 h-3 text-gray-400 shrink-0" aria-hidden="true" />
            <span className="font-medium">Gurugram, Haryana</span>
          </button>
        )}
      </div>

      <HeaderNav />
      {showSearch && (
        <div className="flex w-72 shrink-0">
          <SearchBar variant="desktop-inline" onClose={() => setShowSearch(false)} />
        </div>
      )}

      <HeaderActions
        user={user}
        searchActive={showSearch}
        onSearchOpen={() => setShowSearch(true)}
      />
    </div>
  )
}
