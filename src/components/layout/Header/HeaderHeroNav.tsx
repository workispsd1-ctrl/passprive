'use client'

import { usePathname } from 'next/navigation'
import { HeaderNav } from './HeaderNav'
import { HomeHero } from '@/components/sections/home/HomeHero'
import { WellnessHero } from '@/components/sections/wellness/WellnessHero'
import { TouristHero } from '@/components/sections/tourist/home/TouristHero'
import type { WebsiteBanner } from '@/lib/types/websiteBanners'

interface Props {
  banners: WebsiteBanner[]
  wellnessBanners: WebsiteBanner[]
  touristBanners: WebsiteBanner[]
  /** horizontal padding for the nav row, e.g. "px-12" (desktop) / "px-4" (mobile) */
  pad: string
}

/**
 * The hero banner + category-nav pill.
 *
 * Home overlaps the pill over the hero's bottom edge. Wellness and Tourist show
 * their own full-bleed hero with the pill sitting cleanly below it (no
 * overlap). Every other route just renders the pill below the top bar.
 */
export function HeaderHeroNav({ banners, wellnessBanners, touristBanners, pad }: Props) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isWellness = pathname === '/wellness'
  const isTourist = pathname === '/tourist'
  // the restaurant page opens straight on its own header (web design) — no category pills
  // the stamp pages open on their own heading or hero
  if (pathname.startsWith('/visit-rewards')) return null
  if (/^\/wellness\/[^/]+$/.test(pathname)) return null
  if (/^\/dining\/(?!mood\/)[^/]+(\/book|\/order|\/reviews)?$/.test(pathname)) return null

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

  if (isTourist) {
    return (
      <div>
        <TouristHero banners={touristBanners} />
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
