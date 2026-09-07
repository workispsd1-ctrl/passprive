'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import LoginDialog from '@/components/LoginDialog'
import { ProfileDrawer } from '@/components/ProfileDrawer'

interface Props {
  user: { email?: string; name?: string | null; phone?: string | null } | null
  /** 'light' = rendered on a dark/orange background (white icons) */
  theme?: 'default' | 'light'
}

function getInitial(name?: string | null, email?: string) {
  if (name?.trim()) return name.trim()[0].toUpperCase()
  if (email) return email[0].toUpperCase()
  return 'U'
}

// 48px circle: faint orange fill + 0.75px orange→cream gradient border
const ghostCircle: React.CSSProperties = {
  border: '0.75px solid transparent',
  backgroundImage:
    'linear-gradient(rgba(255,106,25,0.04), rgba(255,106,25,0.04)), linear-gradient(151.63deg, #FF6A19 -48.58%, #F7F0EC 82.47%)',
  backgroundOrigin: 'border-box',
  backgroundClip: 'padding-box, border-box',
  WebkitBackgroundClip: 'padding-box, border-box',
}

export function HeaderActions({ user, theme = 'default' }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const light = theme === 'light'

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        {/* TODO(design): point at the real wishlist route once it exists */}
        <Link
          href="#"
          aria-label="Wishlist"
          className={
            light
              ? 'flex h-10 w-10 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90 2xl:h-12 2xl:w-12'
              : 'flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50'
          }
          style={light ? ghostCircle : undefined}
        >
          <Heart className={light ? 'h-5.5 w-5.5 2xl:h-7.5 2xl:w-7.5' : 'h-4.5 w-4.5'} />
        </Link>

        {user ? (
          <button
            type="button"
            aria-label="Open profile"
            onClick={() => setDrawerOpen(true)}
            className={
              light
                ? 'flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-bold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 2xl:h-12 2xl:w-12 2xl:text-[14px]'
                : 'flex h-9 w-9 items-center justify-center rounded-full bg-brand text-[12px] font-bold tracking-wide text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'
            }
            style={light ? ghostCircle : undefined}
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
