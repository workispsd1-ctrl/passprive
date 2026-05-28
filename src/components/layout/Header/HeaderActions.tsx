'use client'

import { useState } from 'react'
import LoginDialog from '@/components/LoginDialog'
import { ProfileDrawer } from '@/components/ProfileDrawer'

interface Props {
  user: { email?: string; name?: string | null; phone?: string | null } | null
  onSearchOpen?: () => void
  searchActive?: boolean
}

function getInitial(name?: string | null, email?: string) {
  if (name?.trim()) return name.trim()[0].toUpperCase()
  if (email) return email[0].toUpperCase()
  return 'U'
}

export function HeaderActions({ user, onSearchOpen, searchActive }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-1 shrink-0">
        {!searchActive && (
          <button
            type="button"
            aria-label="Search"
            onClick={onSearchOpen}
            className="hidden md:flex p-2 rounded-full hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <defs>
                <linearGradient id="search-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              <circle cx="11" cy="11" r="8" stroke="url(#search-grad)" />
              <path d="m21 21-4.35-4.35" stroke="url(#search-grad)" />
            </svg>
          </button>
        )}

        {user ? (
          <button
            type="button"
            aria-label="Open profile"
            onClick={() => setDrawerOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-brand text-white text-[11px] font-bold tracking-wide hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            {getInitial(user.name, user.email)}
          </button>
        ) : (
          <LoginDialog />
        )}
      </div>

      {user && (
        <ProfileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={user}
        />
      )}
    </>
  )
}
