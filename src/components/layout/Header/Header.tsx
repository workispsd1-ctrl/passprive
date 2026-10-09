import { DesktopHeaderClient } from './DesktopHeaderClient'
import { MobileHeaderClient } from './MobileHeaderClient'
import { getCurrentUser } from '@/lib/services/user'
import { getWebsiteBanners } from '@/lib/services/websiteBanners'
import { getUserMembership } from '@/lib/services/subscription'

/**
 * Site header. `minimal` (account + static pages) keeps the top bar — logo,
 * search, Privé credits, membership badge, favourites, profile — and drops
 * the location picker and the category nav/hero, which are for browsing.
 */
export async function Header({ minimal = false }: { minimal?: boolean } = {}) {
  // Home/wellness/tourist hero banners live in the header so the category-nav
  // pill can be positioned relative to them per-route (overlap on home, below
  // on wellness/tourist); HeaderHeroNav picks the right one by pathname.
  const [user, homeBanners, wellnessBanners, touristBanners] = await Promise.all([
    getCurrentUser(),
    getWebsiteBanners('home'),
    getWebsiteBanners('wellness'),
    getWebsiteBanners('tourist'),
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
        touristBanners={touristBanners}
        membershipTier={membershipTier}
        minimal={minimal}
      />
      <div className="md:hidden">
        <MobileHeaderClient user={user} banners={homeBanners} wellnessBanners={wellnessBanners} touristBanners={touristBanners} minimal={minimal} />
      </div>
    </header>
  )
}
