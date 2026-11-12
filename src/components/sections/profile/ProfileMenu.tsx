'use client'

import { Fragment, useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronRight, CircleHelp, FileText, Heart, Info, LogOut, MessageCircle, PenLine, Receipt, Share2,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useHuntProgress } from '@/lib/treasureHunt'

type Item =
  | { label: string; icon: LucideIcon; href: string }
  | { label: string; icon: LucideIcon; action: 'logout' | 'share' }

// app parity: screens/Profile.jsx menu groups. "Notification preference" is
// push-only and "Appearance" is hidden in the app (DARK_THEME_ENABLED off).
const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'My space',
    items: [
      { label: 'Your reviews', icon: PenLine, href: '/reviews' },
      { label: 'Favourites', icon: Heart, href: '/saved' },
      { label: 'Your receipts', icon: Receipt, href: '/receipts' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Frequently asked questions', icon: CircleHelp, href: '/faq' },
      { label: 'Chat with us', icon: MessageCircle, href: '/support' },
      { label: 'Share feedback', icon: Info, href: '/feedback' },
    ],
  },
  {
    title: 'Engage & grow',
    items: [
      { label: 'Share the app', icon: Share2, action: 'share' },
    ],
  },
  {
    title: 'More',
    items: [
      { label: 'About us', icon: Info, href: '/about' },
      { label: 'Terms of service', icon: FileText, href: '/terms' },
      { label: 'Privacy policy', icon: FileText, href: '/privacy' },
      { label: 'Log out', icon: LogOut, action: 'logout' },
    ],
  },
]

// row: 16 padding, 12 gap, 24 icon #938F96, Inter 600 16/24
const ROW = 'flex h-56 w-full items-center gap-12 px-16 text-left'

/** My space / Support / Engage & grow / More — 356 wide, groups 32 apart, white cards with radius 24. */
export function ProfileMenu({ className }: { className?: string }) {
  const router = useRouter()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const hunt = useHuntProgress()

  const logout = useCallback(async () => {
    const res = await fetch('/api/auth/signout', { method: 'POST' })
    if (!res.ok) return
    window.dispatchEvent(new Event('pp:auth'))
    router.push('/')
    router.refresh()
  }, [router])

  // app parity: handleShareApp — Share.share({ message: 'Check out PassPrivé!' })
  const share = useCallback(async () => {
    const url = window.location.origin
    if (navigator.share) {
      await navigator.share({ text: 'Check out PassPrivé!', url }).catch(() => {})
      return
    }
    await navigator.clipboard?.writeText(`Check out PassPrivé! ${url}`).catch(() => {})
  }, [])

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
                    <button
                      type='button'
                      onClick={item.action === 'logout' ? () => setConfirmLogout(true) : share}
                      className={cn(ROW, 'transition-colors hover:bg-[#FAFAFA]')}
                    >
                      {content}
                    </button>
                  ) : (
                    <Link href={item.href} className={cn(ROW, 'transition-colors hover:bg-[#FAFAFA]')}>{content}</Link>
                  )}
                </Fragment>
              )
            })}
            {/* app parity: Profile "Lemon hunt" row while a hunt is on */}
            {group.title === 'Engage & grow' && hunt?.total ? (
              <>
                <div className='mx-16 h-px bg-[#F2F4F4]' />
                <div className={ROW}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src='/assets/refer/lemon.png' alt='' className='size-24 shrink-0 object-contain' />
                  <span className='min-w-0 flex-1 truncate text-[calc(16*var(--u))] leading-24 font-semibold tracking-[calc(0.15*var(--u))] text-[#1A1A1A]'>Lemon hunt</span>
                  <span className='shrink-0 text-[calc(14*var(--u))] font-medium text-[#938F96]'>
                    {Math.min(hunt.found, hunt.total)}/{hunt.total} collected
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </section>
      ))}

      {/* app parity: LogoutConfirmSheet.jsx */}
      <Dialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <DialogContent showCloseButton={false} className='block max-w-sm rounded-3xl bg-white p-6 text-center sm:max-w-sm'>
          <DialogTitle className='text-[20px] font-bold text-[#1A1A1A]'>Breaking up already? 💔</DialogTitle>
          <DialogDescription className='mt-2 text-[14px] leading-5 text-[#605D64]'>
            Mauritius is way less fun without you. Are you sure you want to log out and leave the island adventure on read?
          </DialogDescription>
          <div className='mt-6 flex gap-3'>
            <button type='button' onClick={() => setConfirmLogout(false)} className='h-12 flex-1 rounded-full border border-[#E6E0E9] text-[15px] font-semibold text-[#1A1A1A] hover:bg-[#FAFAFA]'>
              Nevermind
            </button>
            <button type='button' onClick={logout} className='h-12 flex-1 rounded-full bg-brand text-[15px] font-semibold text-white hover:bg-brand-dark'>
              Log Out Anyway
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  )
}
