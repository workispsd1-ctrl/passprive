'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import LoginDialog from '@/components/LoginDialog'
import { ProfileDrawer } from '@/components/ProfileDrawer'

interface Props {
  user: { email?: string; name?: string | null; phone?: string | null } | null
}

function getInitial(name?: string | null, email?: string) {
  if (name?.trim()) return name.trim()[0].toUpperCase()
  if (email) return email[0].toUpperCase()
  return 'U'
}

// 48×48 (2xl) circle, 0.75px gradient border — same fill/border trick as the
// Privé credits pill. Uniform across the home (orange) and default (white)
// headers, matching the Figma spec.
export const actionCircleClass =
  'flex h-10 w-10 items-center justify-center rounded-[75px] border-[0.75px] border-transparent text-brand-light transition-colors hover:brightness-95 2xl:h-12 2xl:w-12'
export const actionCircleStyle = {
  backgroundImage:
    'linear-gradient(#FFF9F6, #FFF9F6), linear-gradient(151.63deg, #FF6A19 -48.58%, #F7F0EC 82.47%)',
  backgroundOrigin: 'border-box',
  backgroundClip: 'padding-box, border-box',
} as const

export function HeaderActions({ user }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/saved"
          aria-label="Favourites"
          className={actionCircleClass}
          style={actionCircleStyle}
        >
          <Heart className="h-4.5 w-4.5 2xl:h-[18.75px] 2xl:w-[18.75px]" />
        </Link>

        {user ? (
          <button
            type="button"
            aria-label="Open profile"
            onClick={() => setDrawerOpen(true)}
            className={`${actionCircleClass} text-[13px] font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light/40 2xl:text-[14px]`}
            style={actionCircleStyle}
          >
            {getInitial(user.name, user.email)}
          </button>
        ) : (
          <LoginDialog triggerClassName="h-10 rounded-full border border-brand-light/30 bg-brand-tint px-4 text-[13px] font-semibold text-brand-light hover:bg-brand-tint-strong 2xl:h-12 2xl:text-[14px]" />
        )}
      </div>

      {user && <ProfileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} />}
    </>
  )
}
