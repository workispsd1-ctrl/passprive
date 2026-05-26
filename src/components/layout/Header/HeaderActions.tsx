'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Menu } from '@base-ui/react/menu'
import LoginDialog from '@/components/LoginDialog'

interface Props {
  user: { email?: string } | null
  onSearchOpen?: () => void
  searchActive?: boolean
}

function getInitials(email?: string) {
  if (!email) return '?'
  const name = email.split('@')[0]
  const parts = name.split(/[._-]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function HeaderActions({ user, onSearchOpen, searchActive }: Props) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await fetch('/api/auth/signout', { method: 'POST' })
    router.refresh()
    setSigningOut(false)
  }

  return (
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
        <Menu.Root>
          <Menu.Trigger
            aria-label="Account menu"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-brand text-white text-[11px] font-bold tracking-wide hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            {getInitials(user.email)}
          </Menu.Trigger>

          <Menu.Portal>
            <Menu.Positioner side="bottom" align="end" sideOffset={8}>
              <Menu.Popup className="min-w-50 rounded-xl bg-white shadow-lg ring-1 ring-black/5 py-1.5 outline-none origin-top data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Signed in as</p>
                  <p className="text-[13px] text-gray-800 font-semibold truncate mt-0.5">{user.email}</p>
                </div>

                <Menu.Item
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-red-600 font-medium hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 outline-none focus:bg-red-50"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  {signingOut ? 'Signing out…' : 'Log out'}
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      ) : (
        <LoginDialog />
      )}
    </div>
  )
}
