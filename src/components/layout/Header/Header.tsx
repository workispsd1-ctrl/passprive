import { DesktopHeaderClient } from './DesktopHeaderClient'
import { MobileHeaderClient } from './MobileHeaderClient'
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
    <header className="relative z-50">
      <DesktopHeaderClient user={user} banners={homeBanners} />
      <div className="md:hidden">
        <MobileHeaderClient user={user} banners={homeBanners} />
      </div>
    </header>
  )
}
