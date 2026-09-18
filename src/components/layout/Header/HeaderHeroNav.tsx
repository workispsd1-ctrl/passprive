'use client'

import { usePathname } from 'next/navigation'
import { HeaderNav } from './HeaderNav'
import { HomeHero } from '@/components/sections/home/HomeHero'
import type { WebsiteBanner } from '@/lib/types/websiteBanners'

interface Props {
  banners: WebsiteBanner[]
  /** horizontal padding for the nav row, e.g. "px-12" (desktop) / "px-4" (mobile) */
  pad: string
}

/**
 * The hero banner + category-nav pill.
 *
 * On the home page the banner fills the whole hero section and the pill floats
 * over its lower edge (no bare orange strip below it). On every other route
 * there is no hero, so the pill just sits under the top bar and overlaps the
 * page content below.
 */
export function HeaderHeroNav({ banners, pad }: Props) {
  const isHome = usePathname() === '/'

  if (isHome) {
    // Pill floats over the banner's lower edge — most of it sits on the banner,
    // a fixed 38px pokes into the white content below (see PILL_OVERHANG in
    // (main)/layout.tsx).
    return (
      <div className="relative">
        <HomeHero banners={banners} />
        <div
          className={`absolute inset-x-0 bottom-0 z-20 translate-y-9.5 ${pad}`}
        >
          <HeaderNav card />
        </div>
      </div>
    )
  }

  return (
    <div className={`relative z-20 -mb-9.5 pt-4 ${pad}`}>
      <HeaderNav />
    </div>
  )
}
