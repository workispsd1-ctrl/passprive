'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { HeaderActions } from './HeaderActions'
import { HeaderHeroNav } from './HeaderHeroNav'
import { SearchBar } from '@/components/SearchBar'
import { LocationButton } from './LocationButton'
import { fetchCashbackBalance } from '@/lib/services/cashbackBalance'
import { cn } from '@/lib/utils'
import type { WebsiteBanner } from '@/lib/types/websiteBanners'

interface Props {
  user: { email?: string; name?: string | null; phone?: string | null } | null
  banners: WebsiteBanner[]
  wellnessBanners: WebsiteBanner[]
  touristBanners: WebsiteBanner[]
  /** 'black' | 'premium' | 'none' — app parity: PackageBadge.jsx */
  membershipTier: string
  /** account/static pages: no category nav / hero banners */
  minimal?: boolean
}

const MEMBERSHIP_BADGE: Record<string, string> = {
  black: '/assets/membership/BlackBadge.webp',
  premium: '/assets/membership/PlusBadge.webp',
}

// Figma spec is drawn at 1920px wide. Every size below is `calc(var(--u)*N)`
// where N is the Figma px value and --u = header width / 1920, so the bar is
// pixel-exact at 1920 and scales proportionally on every other width.
// --u never drops below 0.5px (≈960px wide); under that the search pill
// absorbs the difference so nothing overflows on tablets.
//
// Home gets the orange "light" theme; every other page the white one.
export function DesktopHeaderClient({ user, banners, wellnessBanners, touristBanners, membershipTier, minimal = false }: Props) {
  const isHome = usePathname() === '/'
  const badgeSrc = MEMBERSHIP_BADGE[membershipTier] ?? '/assets/membership/FreeBadge.webp'

  // Privé credits = cashback balance, fetched the same way as the app.
  const [credits, setCredits] = useState<number | null>(null)
  useEffect(() => {
    fetchCashbackBalance().then(setCredits)
  }, [])

  return (
    <div className="hidden bg-white @container md:block [--u:max(100cqw/1920,0.5px)]">
      <div
        className={cn(
          'flex h-[calc(var(--u)*96)] items-center justify-between gap-[calc(var(--u)*64)] px-[calc(var(--u)*48)]',
          isHome
            ? 'bg-brand border-b-2 border-[rgba(206,68,14,0.14)]'
            : 'border-b border-[#EAEAEA]',
        )}
      >
        {/* Logo · divider · location — 521.39 wide, gap 30 */}
        <div className="flex shrink-0 items-center gap-[calc(var(--u)*30)]">
          <Link href="/" aria-label="PassPrive home" className="flex shrink-0 items-center">
            <Image
              src={isHome ? '/assets/brand/passprive-logo-white.png' : '/assets/brand/passprive-logo-orange.png'}
              alt="PassPrive"
              width={885}
              height={208}
              priority
              className="h-[calc(var(--u)*52)] w-auto object-contain"
            />
          </Link>

          <span
            className={cn('h-[calc(var(--u)*44)] w-px shrink-0', isHome ? 'bg-[#B53B0B]' : 'bg-[#E4E4E4]')}
            aria-hidden="true"
          />
          <LocationButton variant="desktop" theme={isHome ? 'light' : 'default'} />
        </div>

        {/* Search — 784 × 64 */}
        <div className="min-w-0 max-w-[calc(var(--u)*784)] flex-1">
          <SearchBar variant={isHome ? 'hero' : 'desktop-full'} scaled />
        </div>

        {/* Credits · badge · favourites · profile — gap 8, then 24 */}
        <div className="flex shrink-0 items-center gap-[calc(var(--u)*8)]">
          {/* Privé credits — 127 × 55: 55px wallet coin over a 120 × 48 pill */}
          <Link
            href="/prive-credits"
            aria-label="Privé credits"
            title="Privé credits"
            className="relative flex h-[calc(var(--u)*55)] min-w-[calc(var(--u)*127)] items-center pl-[calc(var(--u)*55)] pr-[calc(var(--u)*12)]"
          >
            <span
              aria-hidden="true"
              className="absolute top-[calc(var(--u)*3.93)] right-0 left-[calc(var(--u)*7)] h-[calc(var(--u)*48)] rounded-[calc(var(--u)*75)] border-[0.75px] border-transparent"
              style={{
                // opaque pre-composite of rgba(255,106,25,0.04) on white, so the
                // gradient border layer doesn't bleed through the fill
                backgroundImage:
                  'linear-gradient(#FFF9F6, #FFF9F6), linear-gradient(151.63deg, #FF6A19 -48.58%, #F7F0EC 82.47%)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
              }}
            />
            <Image
              src="/assets/membership/Wallet.webp"
              alt=""
              width={129}
              height={129}
              className="absolute top-0 left-0 h-[calc(var(--u)*55)] w-[calc(var(--u)*55)]"
            />
            <span className="relative flex min-w-[calc(var(--u)*60)] flex-col">
              <span className="-my-[calc(var(--u)*4)] font-(family-name:--font-inter) text-[length:calc(var(--u)*28)] leading-[calc(var(--u)*34)] font-bold tracking-[calc(var(--u)*-0.888479)] text-[#606366]">
                {credits == null ? '—' : Math.round(credits).toLocaleString()}
              </span>
              <span className="font-(family-name:--font-dm-sans) text-[length:calc(var(--u)*10.2376)] leading-[calc(var(--u)*8)] font-normal whitespace-nowrap text-[#FF6A19]">
                Priv&eacute; credits
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-[calc(var(--u)*24)]">
            {/* Membership badge (Free/Plus/Black) — 112 × 48. Signed-in users only. */}
            {user && (
              <Link href="/membership" aria-label="Membership" className="shrink-0">
                <Image
                  src={badgeSrc}
                  alt="Privé membership"
                  width={308}
                  height={132}
                  className="h-[calc(var(--u)*48)] w-auto"
                />
              </Link>
            )}

            <HeaderActions user={user} scaled />
          </div>
        </div>
      </div>

      {!minimal && (
        <HeaderHeroNav banners={banners} wellnessBanners={wellnessBanners} touristBanners={touristBanners} pad="px-4 md:px-12" />
      )}
    </div>
  )
}
