'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { HeaderNav } from './HeaderNav'
import { HeaderActions } from './HeaderActions'
import { SearchBar } from '@/components/SearchBar'
import { LocationButton } from './LocationButton'

interface Props {
  user: { email?: string; name?: string | null; phone?: string | null } | null
}

export function DesktopHeaderClient({ user }: Props) {
  const [showSearch, setShowSearch] = useState(false)

  return (
    <div className='hidden md:flex mx-auto max-w-7xl px-6 h-18 items-center gap-5'>
      <Link
        href='/'
        aria-label='PassPrive home'
        className='flex flex-col items-start shrink-0'
      >
        <Image
          src='/passpriveLogo.png'
          alt='PassPrive'
          width={150}
          height={44}
          className='h-9 w-auto object-contain'
        />
        <span className='text-[9px] text-brand font-semibold tracking-wide mt-0.5'>
          Your Pass to the Island&apos;s Best.
        </span>
      </Link>

      <div className='h-9 w-px bg-gray-200 shrink-0' />

      {!showSearch && <LocationButton variant='desktop' />}

      <HeaderNav />

      {showSearch && (
        <div className='flex w-72 shrink-0'>
          <SearchBar
            variant='desktop-inline'
            onClose={() => setShowSearch(false)}
          />
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
