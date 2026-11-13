'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HeaderActions } from './HeaderActions'
import { HeaderHeroNav } from './HeaderHeroNav'
import { LocationButton } from './LocationButton'
import { SearchBar } from '@/components/SearchBar'
import { fetchCashbackBalance } from '@/lib/services/cashbackBalance'
import { cn } from '@/lib/utils'
import type { WebsiteBanner } from '@/lib/types/websiteBanners'

interface Props {
  user: { email?: string; name?: string | null; phone?: string | null } | null
  banners: WebsiteBanner[]
  wellnessBanners: WebsiteBanner[]
  minimal?: boolean
}

/**
 * Phone header — the website's top bar (DesktopHeaderClient) condensed for a
 * narrow screen, not the app's home screen: logo + Privé credits + favourites
 * + profile on the first row, location and search on the second, then the same
 * website hero banner and category pills the desktop shows.
 * Orange on home, white everywhere else — same as desktop.
 */
export function MobileHeaderClient({ user, banners, wellnessBanners, minimal = false }: Props) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  // the dedicated search page has its own search box
  const showSearch = pathname !== '/search'

  const [credits, setCredits] = useState<number | null>(null)
  useEffect(() => {
    fetchCashbackBalance().then(setCredits)
  }, [])

  return (
    <div className='bg-white'>
      <div
        className={cn(
          'px-4 pt-3',
          showSearch ? 'pb-3' : 'pb-2',
          isHome ? 'bg-brand border-b-2 border-[rgba(206,68,14,0.14)]' : 'border-b border-[#EAEAEA]',
        )}
      >
        <div className='flex h-10 items-center justify-between gap-3'>
          <Link href='/' aria-label='PassPrive home' className='flex shrink-0 items-center'>
            <Image
              src={isHome ? '/assets/brand/passprive-logo-white.png' : '/assets/brand/passprive-logo-orange.png'}
              alt='PassPrive'
              width={885}
              height={208}
              priority
              className='h-7 w-auto object-contain'
            />
          </Link>

          <div className='flex min-w-0 items-center gap-2'>
            {/* Privé credits — same pill as desktop, sized for a phone */}
            <Link
              href={credits != null && credits > 0 ? '/wallet' : '/prive-credits'}
              aria-label='Privé credits'
              className='relative flex h-10 shrink-0 items-center pr-2.5 pl-9'
            >
              <span
                aria-hidden='true'
                className='absolute inset-y-1 right-0 left-1.5 rounded-full border-[0.75px] border-transparent'
                style={{
                  backgroundImage:
                    'linear-gradient(#FFF9F6, #FFF9F6), linear-gradient(151.63deg, #FF6A19 -48.58%, #F7F0EC 82.47%)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                }}
              />
              <Image
                src='/assets/membership/Wallet.webp'
                alt=''
                width={129}
                height={129}
                className='absolute top-1/2 left-0 size-9 -translate-y-1/2'
              />
              <span className='relative flex flex-col leading-none'>
                <span className='font-(family-name:--font-inter) text-[15px] font-bold tracking-tight text-[#606366]'>
                  {credits == null ? '—' : Math.round(credits).toLocaleString()}
                </span>
                <span className='font-(family-name:--font-dm-sans) text-[8px] whitespace-nowrap text-[#FF6A19]'>
                  Priv&eacute; credits
                </span>
              </span>
            </Link>
            <HeaderActions user={user} />
          </div>
        </div>

        <div className='mt-3 flex items-center gap-3'>
          <div className='max-w-[40%] min-w-0 shrink-0 [&_a]:min-w-0 [&_span]:truncate [&_div]:min-w-0'>
            <LocationButton variant='mobile' theme={isHome ? 'light' : 'default'} />
          </div>
          {showSearch && (
            <div className='min-w-0 flex-1'>
              <SearchBar variant={isHome ? 'hero' : 'desktop-full'} />
            </div>
          )}
        </div>
      </div>

      {!minimal && <HeaderHeroNav banners={banners} wellnessBanners={wellnessBanners} pad='px-4' />}
    </div>
  )
}
