import { DesktopHeaderClient } from './DesktopHeaderClient'
import { MobileHeaderClient } from './MobileHeaderClient'
import { getCurrentUser } from '@/lib/services/user'
import { getWebsiteBanners } from '@/lib/services/websiteBanners'
import { getUserMembership } from '@/lib/services/subscription'

export async function Header() {
  // Home/wellness hero banners live in the header so the category-nav pill
  // can be positioned relative to them per-route (overlap on home, below on
  // wellness); HeaderHeroNav picks the right one based on the pathname.
  const [user, homeBanners, wellnessBanners] = await Promise.all([
    getCurrentUser(),
    getWebsiteBanners('home'),
    getWebsiteBanners('wellness'),
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
        wellnessBanners={wellnessBanners}
        membershipTier={membershipTier}
      />
      <div className="md:hidden">
        <MobileHeaderClient user={user} banners={homeBanners} wellnessBanners={wellnessBanners} />
      </div>
    </header>
  )
}
