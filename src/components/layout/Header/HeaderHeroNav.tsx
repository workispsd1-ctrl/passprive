'use client'

import { usePathname } from 'next/navigation'
import { HeaderNav } from './HeaderNav'
import { HomeHero } from '@/components/sections/home/HomeHero'
import { WellnessHero } from '@/components/sections/wellness/WellnessHero'
import type { WebsiteBanner } from '@/lib/types/websiteBanners'

interface Props {
  banners: WebsiteBanner[]
  wellnessBanners: WebsiteBanner[]
  /** horizontal padding for the nav row, e.g. "px-12" (desktop) / "px-4" (mobile) */
  pad: string
}

/** The category home screens — the only ones that carry the category-nav pill. */
const NAV_ROUTES = new Set(['/', '/dining', '/stores', '/wellness', '/tourist'])

/**
 * The hero banner + category-nav pill.
 *
 * Home overlaps the pill over the hero's bottom edge. Wellness shows
 * its own full-bleed hero with the pill sitting cleanly below it (no
 * overlap). The other category homes render the pill below the top bar;
 * detail and every other screen opens on the top bar alone.
 */
export function HeaderHeroNav({ banners, wellnessBanners, pad }: Props) {
  const pathname = usePathname()
  if (!NAV_ROUTES.has(pathname)) return null
  const isHome = pathname === '/'
  const isWellness = pathname === '/wellness'

  if (isHome) {
    return (
      <div className="relative">
        <HomeHero banners={banners} />
        <div className={`relative z-20 pt-4 md:-mb-9.5 ${pad}`}>
          <HeaderNav />
        </div>
      </div>
    )
  }

  if (isWellness) {
    return (
      <div>
        <WellnessHero banners={wellnessBanners} />
        <div className={`pt-4 ${pad}`}>
          <HeaderNav />
        </div>
      </div>
    )
  }

  return (
    <div className={`relative z-20 pt-1 md:-mb-9.5 md:pt-4 ${pad}`}>
      <HeaderNav />
    </div>
  )
}
