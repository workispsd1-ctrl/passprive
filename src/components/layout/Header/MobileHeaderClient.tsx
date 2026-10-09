'use client'

import Image from 'next/image'
import Link from 'next/link'
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
  wellnessBanners: WebsiteBanner[]
  touristBanners: WebsiteBanner[]
  minimal?: boolean
}

/** Mobile counterpart of DesktopHeaderClient — same home vs. other-page theme split. */
export function MobileHeaderClient({ user, banners, wellnessBanners, touristBanners, minimal = false }: Props) {
  const isHome = usePathname() === '/'

  return (
    <div className={cn(isHome ? 'bg-brand' : 'bg-white border-b border-gray-100')}>
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        {minimal ? (
          <Link href="/" aria-label="PassPrive home">
            <Image src="/logo-orange.png" alt="PassPrive" width={218} height={52} className="h-8 w-auto object-contain" priority />
          </Link>
        ) : (
          <LocationButton variant="mobile" theme={isHome ? 'light' : 'default'} />
        )}
        <HeaderActions user={user} />
      </div>

      <div className="px-4 pb-3">
        <SearchBar variant="hero" />
      </div>

      {!minimal && <HeaderHeroNav banners={banners} wellnessBanners={wellnessBanners} touristBanners={touristBanners} pad="px-4" />}
    </div>
  )
}
