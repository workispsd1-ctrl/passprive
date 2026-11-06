'use client'

import { Fragment, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bookmark, ChevronRight, CircleAlert, CircleHelp, CreditCard, LogOut, MessageSquareText, MessageSquareWarning, Palette, Settings, SquarePen,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/** `href: null` — in the design, but the site has no page for it yet. */
type Item = { label: string; icon: LucideIcon; href: string | null } | { label: string; icon: LucideIcon; action: 'logout' }

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Manage',
    items: [
      { label: 'Your reviews', icon: SquarePen, href: '/reviews' },
      { label: 'Wishlist', icon: Bookmark, href: '/saved' },
      { label: 'Payment settings', icon: CreditCard, href: null },
      { label: 'Appearance', icon: Palette, href: null },
    ],
  },
  {
    title: 'More',
    items: [
      { label: 'Account settings', icon: Settings, href: null },
      { label: 'About us', icon: CircleAlert, href: null },
      { label: 'Logout', icon: LogOut, action: 'logout' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Frequently asked questions', icon: CircleHelp, href: '/faq' },
      { label: 'Chat with us', icon: MessageSquareText, href: '/support' },
      { label: 'Share feedback', icon: MessageSquareWarning, href: '/feedback' },
    ],
  },
]

// row: 16 padding, 12 gap, 24 icon #938F96, Inter 600 16/24
const ROW = 'flex h-56 w-full items-center gap-12 px-16 text-left'

/** Manage / More / Support — 356 wide, groups 32 apart, white cards with radius 24. */
export function ProfileMenu({ className }: { className?: string }) {
  const router = useRouter()

  const logout = useCallback(async () => {
    const res = await fetch('/api/auth/signout', { method: 'POST' })
    if (!res.ok) return
    window.dispatchEvent(new Event('pp:auth'))
    router.push('/')
    router.refresh()
  }, [router])

  return (
    <nav aria-label='Account' className={cn('flex flex-col gap-32 font-(family-name:--font-inter)', className)}>
      {GROUPS.map(group => (
        <section key={group.title} className='flex flex-col gap-16'>
          <h2 className='px-4 text-[calc(16*var(--u))] leading-24 font-semibold tracking-[0.0015em] text-[#1A1A1A]'>{group.title}</h2>
          <div className='overflow-hidden rounded-[calc(24*var(--u))] border border-[#F2F4F4] bg-white shadow-[0_calc(1*var(--u))_calc(2*var(--u))_rgba(0,0,0,0.05)]'>
            {group.items.map((item, i) => {
              const content = (
                <>
                  <item.icon className='size-24 shrink-0 text-[#938F96]' strokeWidth={1.75} />
                  <span className='min-w-0 flex-1 truncate text-[calc(16*var(--u))] leading-24 font-semibold tracking-[calc(0.15*var(--u))] text-[#1A1A1A]'>
                    {item.label}
                  </span>
                  <ChevronRight className='-mr-8 size-24 shrink-0 text-[#333]' strokeWidth={2} />
                </>
              )
              return (
                <Fragment key={item.label}>
                  {i > 0 && <div className='mx-16 h-px bg-[#F2F4F4]' />}
                  {'action' in item ? (
                    <button type='button' onClick={logout} className={cn(ROW, 'transition-colors hover:bg-[#FAFAFA]')}>{content}</button>
                  ) : item.href ? (
                    <Link href={item.href} className={cn(ROW, 'transition-colors hover:bg-[#FAFAFA]')}>{content}</Link>
                  ) : (
                    <div className={ROW}>{content}</div>
                  )}
                </Fragment>
              )
            })}
          </div>
        </section>
      ))}
    </nav>
  )
}
