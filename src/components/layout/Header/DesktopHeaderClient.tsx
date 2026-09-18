'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { HeaderActions, actionCircleClass, actionCircleStyle } from './HeaderActions'
import { HeaderHeroNav } from './HeaderHeroNav'
import { SearchBar } from '@/components/SearchBar'
import { LocationButton } from './LocationButton'
import { fetchCashbackBalance } from '@/lib/services/cashbackBalance'
import { cn } from '@/lib/utils'
import type { WebsiteBanner } from '@/lib/types/websiteBanners'

interface Props {
  user: { email?: string; name?: string | null; phone?: string | null } | null
  banners: WebsiteBanner[]
}

// The Figma spec is drawn for a 16" MacBook (~1728pt wide). The full-size values
// only kick in at 2xl (>=1536px); smaller laptops get a scaled-down bar.
//
// Home gets the orange "light" theme (full inline search bar, coin ticket art).
// Every other page gets the white "default" theme (small logo, colored logo,
// peach-tinted action circles, search collapses to an icon toggle) — see the
// dining-page Figma.
export function DesktopHeaderClient({ user, banners }: Props) {
  const isHome = usePathname() === '/'

  // Privé credits = cashback balance, fetched the same way as the app.
  const [credits, setCredits] = useState<number | null>(null)
  useEffect(() => {
    fetchCashbackBalance().then(setCredits)
  }, [])

  const [showSearch, setShowSearch] = useState(false)

  return (
    <div className={cn('hidden md:block', isHome ? 'bg-[#FF4800]' : 'bg-white')}>
      <div
        className={cn(
          'flex h-18 items-center gap-3 px-6 2xl:h-24 2xl:gap-[14.51px] 2xl:px-12',
          isHome
            ? 'border-b-2 border-[rgba(206,68,14,0.14)]'
            : 'border-b border-gray-100',
        )}
      >
        <Link
          href="/"
          aria-label="PassPrive home"
          className="flex shrink-0 items-center"
        >
          <Image
            src={isHome ? '/logo.webp' : '/logo-orange.png'}
            alt="PassPrive"
            width={218}
            height={52}
            priority
            className="h-9 w-auto object-contain 2xl:h-13"
          />
        </Link>

        <span
          className={cn(
            'h-8 w-px shrink-0 2xl:h-11',
            isHome ? 'bg-[#B53B0B]' : 'bg-gray-200',
          )}
          aria-hidden="true"
        />

        <LocationButton variant="desktop" theme={isHome ? 'light' : 'default'} />

        {isHome ? (
          <div className="mx-auto w-full max-w-160 flex-1 2xl:max-w-196">
            <SearchBar variant="hero" />
          </div>
        ) : showSearch ? (
          <div className="flex w-72 shrink-0 2xl:w-88">
            <SearchBar
              variant="desktop-inline"
              onClose={() => setShowSearch(false)}
            />
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex shrink-0 items-center gap-2">
          {/* TODO(design): wire real Privé credits balance. Coin = app asset. */}
          <div
            className="relative flex h-10 min-w-21.5 items-center rounded-[75px] border-[0.75px] border-transparent pl-12 pr-5 2xl:h-12 2xl:min-w-30 2xl:pl-16"
            style={{
              // The fill layer must be opaque (pre-composited rgba(255,106,25,0.04)
              // over white) — a translucent fill lets the border-gradient layer
              // behind it bleed through the whole interior instead of just the
              // border ring, since padding-box sits inside border-box.
              backgroundImage:
                'linear-gradient(#FFF9F6, #FFF9F6), linear-gradient(151.63deg, #FF6A19 -48.58%, #F7F0EC 82.47%)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
            }}
            title="Privé credits"
          >
            <Image
              src="/membership/Wallet.webp"
              alt=""
              width={129}
              height={129}
              className="absolute -left-3 top-1/2 h-10 w-10 -translate-y-1/2 2xl:h-12 2xl:w-12"
            />
            <span className="leading-tight">
              <span className="block font-(family-name:--font-inter) text-[28px] leading-none font-bold tracking-[-0.89px] text-[#606366]">
                {credits == null ? '—' : Math.round(credits).toLocaleString()}
              </span>
              <span className="block font-(family-name:--font-dm-sans) text-[10.24px] leading-[8px] font-normal tracking-normal text-[#FF6A19]">
                Priv&eacute; credits
              </span>
            </span>
          </div>

          {/* App membership badge (assets/FreeBadge.webp), 308×132 */}
          <Image
            src="/membership/FreeBadge.webp"
            alt="Privé Free"
            width={308}
            height={132}
            className="h-10 w-auto 2xl:h-12"
          />

          {!isHome && !showSearch && (
            <button
              type="button"
              aria-label="Search"
              onClick={() => setShowSearch(true)}
              className={actionCircleClass}
              style={actionCircleStyle}
            >
              <Search className="h-4.5 w-4.5 2xl:h-[18.75px] 2xl:w-[18.75px]" />
            </button>
          )}

          <HeaderActions user={user} />
        </div>
      </div>

      <HeaderHeroNav banners={banners} pad="px-6 2xl:px-12" />
    </div>
  )
}
