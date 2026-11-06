'use client'

import { usePathname } from 'next/navigation'
import { HeaderActions } from './HeaderActions'
import { HeaderHeroNav } from './HeaderHeroNav'
import { HeaderNav } from './HeaderNav'
import { LocationButton } from './LocationButton'
import { SearchBar } from '@/components/SearchBar'
import { BannerCarousel } from '@/components/shared/BannerCarousel'
import { cn } from '@/lib/utils'
import type { WebsiteBanner, WebsiteBannerSection } from '@/lib/types/websiteBanners'
import type { AppBannerSets } from '@/lib/services/websiteBanners'

interface Props {
  user: { email?: string; name?: string | null; phone?: string | null } | null
  banners: WebsiteBanner[]
  wellnessBanners: WebsiteBanner[]
  touristBanners: WebsiteBanner[]
  /** the app's own banner sets, for the category home screens */
  appBanners?: AppBannerSets | null
  minimal?: boolean
}

/** Category home screens that open on the app's banner, and its frame (app creatives are 1560 wide). */
const BANNER_ROUTES: Record<string, { section: WebsiteBannerSection; aspect: string }> = {
  '/': { section: 'home', aspect: 'aspect-[1560/1824]' },
  '/dining': { section: 'dining', aspect: 'aspect-[1560/2152]' },
  '/stores': { section: 'store', aspect: 'aspect-[1560/2152]' },
  '/wellness': { section: 'wellness', aspect: 'aspect-[1560/2152]' },
  '/tourist': { section: 'tourist', aspect: 'aspect-[1560/1824]' },
}

/**
 * Phone header. On the category home screens it follows the app's home
 * (screens/Home/index.jsx + HomeOffers.jsx): the section's banner fills the
 * top of the screen and the location, search and category pills sit over its
 * empty upper band. Everywhere else it's the plain top bar.
 */
export function MobileHeaderClient({ user, banners, wellnessBanners, touristBanners, appBanners, minimal = false }: Props) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const route = minimal ? null : BANNER_ROUTES[pathname]
  const appSet = route ? (appBanners?.[route.section] ?? []) : []
  // the dedicated search page has its own search box
  const showSearch = pathname !== '/search'

  if (route && appSet.length > 0) {
    return (
      <div className='relative'>
        <BannerCarousel banners={appSet} className={cn(route.aspect, 'rounded-none! rounded-b-[28px]!')} />
        <div className='pointer-events-none absolute inset-x-0 top-0 z-10 bg-linear-to-b from-black/25 to-transparent pb-6'>
          <div className='pointer-events-auto flex items-center justify-between px-4 pt-3 pb-1'>
            <LocationButton variant='mobile' theme='light' />
            <HeaderActions user={user} />
          </div>
          {showSearch && (
            <div className='pointer-events-auto px-4 pb-1'>
              <SearchBar variant='hero' />
            </div>
          )}
          <div className='pointer-events-auto px-4'>
            <HeaderNav />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(isHome ? 'bg-brand' : 'border-b border-gray-100 bg-white')}>
      <div className='flex items-center justify-between px-4 pt-3 pb-1'>
        <LocationButton variant='mobile' theme={isHome ? 'light' : 'default'} />
        <HeaderActions user={user} />
      </div>

      {showSearch && (
        <div className='px-4 pb-3'>
          <SearchBar variant='hero' />
        </div>
      )}

      {!minimal && <HeaderHeroNav banners={banners} wellnessBanners={wellnessBanners} touristBanners={touristBanners} pad='px-4' />}
    </div>
  )
}
