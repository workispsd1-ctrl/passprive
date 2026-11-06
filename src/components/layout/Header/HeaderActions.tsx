'use client'

import Link from 'next/link'
import { Heart, User } from 'lucide-react'
import LoginDialog from '@/components/LoginDialog'

interface Props {
  user: { email?: string; name?: string | null; phone?: string | null } | null
  /** desktop header: Figma 1920 sizes in the header's --u unit, person icon instead of initial */
  scaled?: boolean
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

// 48 × 48 circle with a 30 × 30 icon box, in the desktop header's --u unit
const scaledCircleClass =
  'flex h-[calc(var(--u)*48)] w-[calc(var(--u)*48)] shrink-0 items-center justify-center rounded-[calc(var(--u)*75)] border-[0.75px] border-transparent text-[#FF6A19] transition-colors hover:brightness-95'

export function HeaderActions({ user, scaled = false }: Props) {
  const circle = scaled ? scaledCircleClass : actionCircleClass

  return (
    <div className={scaled ? 'flex shrink-0 items-center gap-[calc(var(--u)*24)]' : 'flex items-center gap-2 shrink-0 min-[120rem]:gap-6'}>
      <Link
        href="/saved"
        aria-label="Favourites"
        className={circle}
        style={actionCircleStyle}
      >
        <Heart
          className={scaled ? 'h-[calc(var(--u)*28)] w-[calc(var(--u)*28)]' : 'h-4.5 w-4.5 2xl:h-[18.75px] 2xl:w-[18.75px]'}
          strokeWidth={scaled ? 1.5 : 2}
        />
      </Link>

      {user ? (
        <Link
          href="/profile"
          aria-label="Profile"
          className={`${circle} text-[13px] font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light/40 2xl:text-[14px]`}
          style={actionCircleStyle}
        >
          {scaled
            ? <User className="h-[calc(var(--u)*28)] w-[calc(var(--u)*28)]" strokeWidth={1.5} />
            : getInitial(user.name, user.email)}
        </Link>
      ) : (
        <LoginDialog
          triggerClassName={scaled
            ? 'h-[calc(var(--u)*48)] rounded-full border border-brand-light/30 bg-brand-tint px-[calc(var(--u)*20)] text-[length:calc(var(--u)*16)] font-semibold text-brand-light hover:bg-brand-tint-strong'
            : 'h-10 rounded-full border border-brand-light/30 bg-brand-tint px-4 text-[13px] font-semibold text-brand-light hover:bg-brand-tint-strong 2xl:h-12 2xl:text-[14px]'}
        />
      )}
    </div>
  )
}
