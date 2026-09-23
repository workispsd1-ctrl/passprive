import { DesktopHeaderClient } from './DesktopHeaderClient'
import { MobileHeaderClient } from './MobileHeaderClient'
import { getCurrentUser } from '@/lib/services/user'
import { getWebsiteBanners } from '@/lib/services/websiteBanners'
import { getUserMembership } from '@/lib/services/subscription'

export async function Header() {
  // Home hero banners live in the header so the category-nav pill can overlap
  // them; HomeHero renders null on every route except '/'.
  const [user, homeBanners] = await Promise.all([
    getCurrentUser(),
    getWebsiteBanners('home'),
  ])

  // App parity: components/PackageBadge.jsx — logged-out or free-tier users
  // get the Free badge, only an active paid tier shows Plus/Black. Tier names
  // are free-text in the DB ("Privé Black", "PassPrivé Gold", …), so the app
  // just checks for "black" and otherwise treats any non-empty tier as Plus.
  const membership = user ? await getUserMembership(user.id) : null
  const rawTier = (membership?.membership_tier ?? 'none').toLowerCase()
  const membershipTier =
    rawTier === 'none'
      ? 'none'
      : rawTier.includes('black')
        ? 'black'
        : 'premium'

  return (
    <header className="relative z-50">
      <DesktopHeaderClient
        user={user}
        banners={homeBanners}
        membershipTier={membershipTier}
      />
      <div className="md:hidden">
        <MobileHeaderClient user={user} banners={homeBanners} />
      </div>
    </header>
  )
}
