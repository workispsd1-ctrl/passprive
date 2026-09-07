'use client'

import Link from 'next/link'
import Image from 'next/image'
import { HeaderActions } from './HeaderActions'
import { HeaderHeroNav } from './HeaderHeroNav'
import { SearchBar } from '@/components/SearchBar'
import { LocationButton } from './LocationButton'
import type { WebsiteBanner } from '@/lib/types/websiteBanners'

interface Props {
  user: { email?: string; name?: string | null; phone?: string | null } | null
  banners: WebsiteBanner[]
}

// The Figma spec is drawn for a 16" MacBook (~1728pt wide). The full-size values
// only kick in at 2xl (>=1536px); smaller laptops get a scaled-down bar.
export function DesktopHeaderClient({ user, banners }: Props) {
  return (
    <div className="hidden md:block">
      <div className="flex h-18 items-center gap-3 border-b-2 border-[rgba(206,68,14,0.14)] px-6 2xl:h-24 2xl:gap-4 2xl:px-12">
        <Link
          href="/"
          aria-label="PassPrive home"
          className="flex shrink-0 items-center"
        >
          <Image
            src="/logo.png"
            alt="PassPrive"
            width={218}
            height={52}
            priority
            className="h-9 w-auto object-contain 2xl:h-13"
          />
        </Link>

        <span
          className="h-8 w-px shrink-0 bg-[#B53B0B] 2xl:h-11"
          aria-hidden="true"
        />

        <LocationButton variant="desktop" theme="light" />

        <div className="mx-auto w-full max-w-160 flex-1 2xl:max-w-196">
          <SearchBar variant="hero" />
        </div>

        <div className="flex shrink-0 items-center gap-2 2xl:gap-3">
          {/* TODO(design): wire real Privé credits balance + coin artwork */}
          <div
            className="flex h-10 w-26 items-center gap-2 rounded-full px-2 2xl:h-12 2xl:w-31"
            title="Privé credits"
            style={{
              border: '0.75px solid transparent',
              backgroundImage:
                'linear-gradient(rgba(255,106,25,0.04), rgba(255,106,25,0.04)), linear-gradient(151.63deg, #FF6A19 -48.58%, #F7F0EC 82.47%)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              WebkitBackgroundClip: 'padding-box, border-box',
            }}
          >
            <span className="h-5 w-5 shrink-0 rounded-full bg-linear-to-br from-[#F3B93F] to-[#D5891E] 2xl:h-6 2xl:w-6" />
            <span className="leading-none">
              <span className="block text-[12px] font-extrabold text-white 2xl:text-[13px]">
                39
              </span>
              <span className="block text-[8px] font-medium text-white/80 2xl:text-[9px]">
                Prive credits
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

          <HeaderActions user={user} theme="light" />
        </div>
      </div>

      <HeaderHeroNav banners={banners} pad="px-6 2xl:px-12" />
    </div>
  )
}
