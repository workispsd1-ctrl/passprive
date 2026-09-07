import { HeaderActions } from './HeaderActions'
import { HeaderHeroNav } from './HeaderHeroNav'
import { SearchBar } from '@/components/SearchBar'
import { DesktopHeaderClient } from './DesktopHeaderClient'
import { LocationButton } from './LocationButton'
import { getCurrentUser } from '@/lib/services/user'
import { getWebsiteBanners } from '@/lib/services/websiteBanners'

export async function Header() {
  // Home hero banners live in the header so the category-nav pill can overlap
  // them; HomeHero renders null on every route except '/'.
  const [user, homeBanners] = await Promise.all([
    getCurrentUser(),
    getWebsiteBanners('home'),
  ])

  return (
    <header className="relative z-50 bg-[#FF4800]">

      <DesktopHeaderClient user={user} banners={homeBanners} />

      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <LocationButton variant="mobile" theme="light" />
          <HeaderActions user={user} theme="light" />
        </div>

        <div className="px-4 pb-3">
          <SearchBar variant="hero" />
        </div>

        <HeaderHeroNav banners={homeBanners} pad="px-4" />
      </div>

    </header>
  )
}
