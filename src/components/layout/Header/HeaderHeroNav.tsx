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
 * The pill sits below the hero (or below the top bar on routes with no hero),
 * with a small top gap and no overlap — same treatment on every route.
 */
export function HeaderHeroNav({ banners, pad }: Props) {
  const isHome = usePathname() === '/'

  if (isHome) {
    return (
      <div className="relative">
        <HomeHero banners={banners} />
        <div className={`relative z-20 -mb-9.5 pt-4 ${pad}`}>
          <HeaderNav />
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
