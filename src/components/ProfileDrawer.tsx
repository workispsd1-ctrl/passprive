'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, BookText, ChevronRight, CircleHelp, Crown, FileText, Gift, Heart, LogOut, MessageCircle, Share2, Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProfileSummary, ProfileTier } from '@/lib/services/profileSummary'

// app parity: Profile.jsx TIER_VISUAL
const TIER: Record<ProfileTier, { bg: string; badge: string; text: string; muted: string }> = {
  black: { bg: '/membership/hero-black.webp', badge: '/membership/BlackBadge.webp', text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)' },
  plus: { bg: '/membership/hero-plus.webp', badge: '/membership/PlusBadge.webp', text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)' },
  free: { bg: '/membership/hero-free.webp', badge: '/membership/FreeBadge.webp', text: '#1A1A1A', muted: 'rgba(26,26,26,0.65)' },
}

// app parity: Profile.jsx menu groups
const GROUPS: { title: string; items: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[] }[] = [
  {
    title: 'My space',
    items: [
      { label: 'Your bookings', href: '/bookings', icon: BookText },
      { label: 'Favourites', href: '/saved', icon: Heart },
      { label: 'My wallet', href: '/wallet', icon: Wallet },
      { label: 'Membership', href: '/membership', icon: Crown },
      { label: 'Visit rewards', href: '/visit-rewards', icon: Gift },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Frequently asked questions', href: '/faq', icon: CircleHelp },
      { label: 'Chat with us', href: '/support', icon: MessageCircle },
    ],
  },
  {
    title: 'More',
    items: [
      { label: 'Terms of service', href: '/terms', icon: FileText },
      { label: 'Privacy policy', href: '/privacy', icon: FileText },
    ],
  },
]

interface Props {
  open: boolean
  onClose: () => void
  /** shown instantly while the full profile loads */
  user: { email?: string; name?: string | null; phone?: string | null }
}

/**
 * Profile slide-over — app parity: screens/Profile.jsx, at the app's phone
 * width: tier hero, reward cards, active bookings, menu groups, logout.
 * Data comes from /api/profile when the drawer opens.
 */
export function ProfileDrawer({ open, onClose, user }: Props) {
  const router = useRouter()
  const [data, setData] = useState<ProfileSummary | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!open) return
    let active = true
    fetch('/api/profile', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: ProfileSummary) => { if (active) { setData(d); setFailed(false) } })
      .catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [open])

  // lock page scroll + close on Escape
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const logout = useCallback(async () => {
    const res = await fetch('/api/auth/signout', { method: 'POST' })
    if (!res.ok) return
    onClose()
    window.dispatchEvent(new Event('pp:auth'))
    router.push('/')
    router.refresh()
  }, [onClose, router])

  const share = useCallback(async () => {
    const payload = { title: 'PassPrivé', text: 'Discover restaurants, stores and wellness in Mauritius with PassPrivé.', url: window.location.origin }
    try {
      if (navigator.share) await navigator.share(payload)
      else await navigator.clipboard.writeText(payload.url)
    } catch { /* dismissed */ }
  }, [])

  const name = data?.name ?? (user.name?.trim() || user.email?.split('@')[0] || 'PassPrivé member')
  const contact = data?.contact ?? user.phone ?? user.email ?? ''
  const tier = TIER[data?.tier ?? 'free']

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn('fixed inset-0 z-50 bg-black/40 transition-opacity duration-300', open ? 'opacity-100' : 'pointer-events-none opacity-0')}
      />
      <aside
        role='dialog'
        aria-modal='true'
        aria-label='Profile'
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col bg-white font-(family-name:--font-dm-sans) shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Top bar — app parity: back + title + chat */}
        <div className='flex items-center gap-3 border-b border-gray-100 px-4 py-3'>
          <button type='button' aria-label='Close profile' onClick={onClose} className='rounded-full p-2 hover:bg-gray-100'>
            <ArrowLeft className='h-5 w-5 text-[#161616]' />
          </button>
          <span className='flex-1 text-[17px] font-bold text-[#161616]'>Profile</span>
          <Link href='/support' onClick={onClose} aria-label='Chat with us' className='rounded-full bg-gray-100 p-2 hover:bg-gray-200'>
            <MessageCircle className='h-4.5 w-4.5 text-[#161616]' />
          </Link>
        </div>

        <div className='flex-1 overflow-y-auto px-4 pt-4 pb-8'>
          {/* Hero */}
          <section className='relative overflow-hidden rounded-3xl'>
            <Image src={tier.bg} alt='' fill className='object-cover' sizes='420px' />
            <div className='relative flex items-center gap-3 p-5'>
              <span className='flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/25 text-[22px] font-bold backdrop-blur' style={{ color: tier.text }}>
                {name[0]?.toUpperCase()}
              </span>
              <div className='min-w-0 flex-1'>
                <p className='line-clamp-2 text-[19px] leading-tight font-bold' style={{ color: tier.text }}>{name}</p>
                {contact && <p className='truncate text-[13px]' style={{ color: tier.muted }}>{contact}</p>}
              </div>
              <Link href='/membership' onClick={onClose} className='flex shrink-0 flex-col items-end gap-1'>
                <Image src={tier.badge} alt='Membership' width={308} height={132} className='h-8 w-auto' />
                {data?.validTill && <span className='text-[10px]' style={{ color: tier.muted }}>Valid till {data.validTill}</span>}
              </Link>
            </div>
          </section>

          {/* Reward cards */}
          <Link href='/prive-credits' onClick={onClose} className='relative mt-4 block aspect-[1290/596] overflow-hidden rounded-3xl'>
            <Image src='/profile/card-cashback.webp' alt='' fill className='object-cover' sizes='420px' />
            <div className='relative flex h-full flex-col justify-center p-5 text-white'>
              <span className='w-fit rounded-full bg-white/20 px-2.5 py-1 text-[9px] font-bold tracking-wider backdrop-blur'>TOTAL CASH BACK</span>
              {data ? (
                <p className='mt-2 text-[30px] leading-none font-extrabold'>Rs {data.credits.toLocaleString()}</p>
              ) : (
                <span className='mt-2 h-7 w-24 animate-pulse rounded-lg bg-white/25' />
              )}
              <p className='mt-1 text-[13px]'>
                <em className='font-(family-name:--font-libre-baskerville) font-bold'>Privé</em> Credits <span className='font-bold'>earned</span>
              </p>
              <p className='text-[10px] text-white/75'>(1 Privé Credit = 1 Rs)</p>
              <span className='mt-1.5 text-[12px] font-semibold'>Learn more →</span>
            </div>
          </Link>
          <div className='mt-3 grid grid-cols-2 gap-3'>
            <div className='relative aspect-[692/532] overflow-hidden rounded-3xl'>
              <Image src='/profile/card-savings.webp' alt='' fill className='object-cover' sizes='210px' />
              <div className='relative p-3.5'>
                <span className='rounded-full bg-black/10 px-2 py-0.5 text-[8.5px] font-bold tracking-wider text-[#1A1A1A]'>TOTAL SAVINGS</span>
                {/* The app shows a placeholder "Rs 0"; savings aren't tracked yet. */}
                <p className='mt-2 text-[15px] font-bold text-[#1A1A1A]'>Coming soon</p>
              </div>
            </div>
            <Link href='/visit-rewards' onClick={onClose} className='relative block aspect-[692/532] overflow-hidden rounded-3xl'>
              <Image src='/profile/card-stamps.webp' alt='' fill className='object-cover' sizes='210px' />
              <div className='relative p-3.5'>
                <span className='rounded-full bg-black/10 px-2 py-0.5 text-[8.5px] font-bold tracking-wider text-[#1A1A1A]'>STAMP REWARDS</span>
                {data ? (
                  <p className='mt-2 text-[24px] leading-none font-extrabold text-[#1A1A1A]'>{data.stamps}</p>
                ) : (
                  <span className='mt-2 block h-6 w-10 animate-pulse rounded-lg bg-black/10' />
                )}
                <p className='text-[11px] text-[#1A1A1A]/70'>collected</p>
                <span className='text-[11px] font-semibold text-[#1A1A1A]'>Learn more →</span>
              </div>
            </Link>
          </div>

          {/* Active bookings */}
          <section className='mt-6'>
            <div className='mb-2.5 flex items-center justify-between'>
              <h2 className='text-[16px] font-bold text-[#161616]'>Active bookings</h2>
              <Link href='/bookings' onClick={onClose} className='text-[12px] font-semibold text-brand hover:underline'>View all</Link>
            </div>
            {!data && !failed ? (
              <div className='flex gap-3 overflow-hidden'>
                {[0, 1].map(i => <span key={i} className='h-32 w-56 shrink-0 animate-pulse rounded-2xl bg-gray-200' />)}
              </div>
            ) : !data?.activeBookings.length ? (
              <p className='rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-center text-[12px] text-gray-500'>
                {failed ? 'Couldn’t load your bookings.' : 'No upcoming bookings'}
              </p>
            ) : (
              <div className='scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-1'>
                {data.activeBookings.map(b => (
                  <Link key={b.key} href={b.href} onClick={onClose} className='relative h-32 w-56 shrink-0 overflow-hidden rounded-2xl bg-gray-200'>
                    {b.image && <Image src={b.image} alt='' fill className='object-cover' sizes='224px' />}
                    <div className='absolute inset-0 bg-linear-to-b from-black/55 via-transparent to-black/60' />
                    <div className='absolute inset-x-0 bottom-0 p-3 text-white'>
                      <p className='text-[10.5px] font-medium text-white/85'>{b.overline}</p>
                      <p className='truncate text-[14px] font-bold'>{b.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Menu groups */}
          {GROUPS.map(g => (
            <section key={g.title} className='mt-6'>
              <h2 className='mb-2 px-1 text-[14px] font-bold text-[#161616]'>{g.title}</h2>
              <div className='divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white'>
                {g.items.map(({ label, href, icon: Icon }) => (
                  <Link key={href} href={href} onClick={onClose} className='flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50'>
                    <span className='flex h-8 w-8 items-center justify-center rounded-full bg-brand-tint'>
                      <Icon className='h-4 w-4 text-brand' />
                    </span>
                    <span className='flex-1 text-[14px] font-medium text-[#2C2D32]'>{label}</span>
                    <ChevronRight className='h-4 w-4 text-gray-400' />
                  </Link>
                ))}
              </div>
            </section>
          ))}
          <section className='mt-6'>
            <h2 className='mb-2 px-1 text-[14px] font-bold text-[#161616]'>Engage &amp; grow</h2>
            <button type='button' onClick={share} className='flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50'>
              <span className='flex h-8 w-8 items-center justify-center rounded-full bg-brand-tint'>
                <Share2 className='h-4 w-4 text-brand' />
              </span>
              <span className='flex-1 text-[14px] font-medium text-[#2C2D32]'>Share PassPrivé</span>
              <ChevronRight className='h-4 w-4 text-gray-400' />
            </button>
          </section>

          <button
            type='button'
            onClick={logout}
            className='mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3 text-[14px] font-semibold text-[#2C2D32] transition-colors hover:bg-gray-50'
          >
            <LogOut className='h-4 w-4' /> Logout
          </button>
        </div>
      </aside>
    </>
  )
}
