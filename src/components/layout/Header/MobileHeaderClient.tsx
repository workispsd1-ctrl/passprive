'use client'

import { usePathname } from 'next/navigation'
import { HeaderActions } from './HeaderActions'
import { HeaderHeroNav } from './HeaderHeroNav'
import { LocationButton } from './LocationButton'
import { SearchBar } from '@/components/SearchBar'
import { cn } from '@/lib/utils'
import type { WebsiteBanner } from '@/lib/types/websiteBanners'

interface Props {
  user: { email?: string; name?: string | null; phone?: string | null } | null
  banners: WebsiteBanner[]
}

/** Mobile counterpart of DesktopHeaderClient — same home vs. other-page theme split. */
export function MobileHeaderClient({ user, banners }: Props) {
  const isHome = usePathname() === '/'

  return (
    <div className={cn(isHome ? 'bg-[#FF4800]' : 'bg-white border-b border-gray-100')}>
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <LocationButton variant="mobile" theme={isHome ? 'light' : 'default'} />
        <HeaderActions user={user} />
      </div>

      <div className="px-4 pb-3">
        <SearchBar variant="hero" />
      </div>

      <HeaderHeroNav banners={banners} pad="px-4" />
    </div>
  )
}
