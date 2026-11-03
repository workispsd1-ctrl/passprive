'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

/** Listing screens that carry the bar — app parity: Home, category homes, InstantBook, DealsCashback. */
const SHOWN_ON: Record<string, string> = {
  '/': 'dining',
  '/dining': 'dining',
  '/stores': 'shopping',
  '/wellness': 'wellness',
  '/tourist': 'dining',
  '/instant-book': 'dining',
  '/deals': 'dining',
}

function DealsIcon() {
  return (
    <svg width='26' height='15' viewBox='0 0 25.6003 15.0002' fill='none' aria-hidden='true'>
      <path
        fill='#1E0B04'
        d='M9.8 6a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15.8 10.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM23.35 0H2.25A2.25 2.25 0 0 0 0 2.25v3c0 .41.34.75.75.75h.75a1.5 1.5 0 0 1 0 3H.75a.75.75 0 0 0-.75.75v3C0 13.99 1 15 2.25 15h21.1c1.24 0 2.25-1.01 2.25-2.25v-3a.75.75 0 0 0-.75-.75h-.75a1.5 1.5 0 0 1 0-3h.75c.41 0 .75-.34.75-.75v-3C25.6 1 24.59 0 23.35 0ZM7.55 5.25a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0Zm1.78 6.59a.75.75 0 0 1-.12-1.06l6-7.5a.75.75 0 1 1 1.17.94l-6 7.5a.75.75 0 0 1-1.05.12ZM15.8 12a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Z'
      />
    </svg>
  )
}

const ACTIVE = 'border-white bg-[linear-gradient(167.85deg,#FFD900_17.9%,#FFAA00_69.9%,#FFF1D5_100%)] shadow-[0_4px_4px_rgba(0,0,0,0.25)]'

/**
 * Floating "Deals Mode / Use Cashback" switch with a home button — app
 * parity: components/Home/HomeFloatingNav.jsx. Opens /deals in that mode for
 * the category being browsed; on /deals it switches the mode in place.
 */
export function FloatingModeNav() {
  const pathname = usePathname()
  const params = useSearchParams()
  const fallbackCategory = SHOWN_ON[pathname]
  if (!fallbackCategory) return null

  const onDeals = pathname === '/deals'
  const mode = onDeals ? (params.get('mode') === 'cashback' ? 'cashback' : 'deals') : null
  const category = (onDeals && params.get('category')) || fallbackCategory
  const href = (m: string) => `/deals?mode=${m}&category=${category}`

  return (
    <nav
      aria-label='Deals and cashback'
      className='fixed right-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-40 flex items-center gap-2 font-(family-name:--font-dm-sans)'
    >
      <Link
        href='/'
        aria-label='Home'
        className='flex size-14 items-center justify-center rounded-full border-[1.5px] border-[#B3A660] bg-[linear-gradient(100deg,#1D1E20_7%,#404049_85%)] shadow-[0_4px_7px_rgba(0,0,0,0.45)] transition-transform hover:scale-105'
      >
        <Image src='/assets/nav/HomeNavIcon.webp' alt='' width={29} height={27} />
      </Link>
      <div className='flex h-15.75 items-center gap-1 rounded-full border border-white bg-white px-0.75 shadow-[0_4px_7px_rgba(0,0,0,0.35)]'>
        <Link
          href={href('deals')}
          aria-current={mode === 'deals' ? 'page' : undefined}
          className={cn(
            'relative flex h-13.75 items-center rounded-full border border-transparent pr-2.5 pl-11.5 text-[14px] font-bold whitespace-nowrap text-[#1E0B04] transition-colors',
            mode === 'deals' ? ACTIVE : 'hover:bg-[#FFF6D6]',
          )}
        >
          <span className='absolute left-3.25'><DealsIcon /></span>
          Deals Mode
        </Link>
        <Link
          href={href('cashback')}
          aria-current={mode === 'cashback' ? 'page' : undefined}
          className={cn(
            'flex h-13.75 items-center rounded-full border border-transparent px-3 text-[14px] font-bold whitespace-nowrap text-[#1E0B04] transition-colors',
            mode === 'cashback' ? ACTIVE : 'hover:bg-[#FFF6D6]',
          )}
        >
          Use Cashback
        </Link>
      </div>
    </nav>
  )
}
