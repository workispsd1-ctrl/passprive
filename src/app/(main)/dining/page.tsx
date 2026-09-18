import type { Metadata } from 'next'
import { HeroSection } from '@/components/sections'
import { MoodCategoriesSection } from '@/components/sections/dining/MoodCategoriesSection'
import { QuickFilterTiles } from '@/components/sections/dining/QuickFilterTiles'
import { DiningDiscoverSection } from '@/components/sections/dining/DiningDiscoverSection'
import { NowTrendingSection } from '@/components/sections/home/NowTrendingSection'
import { OffersYoullLoveSection } from '@/components/sections/dining/OffersYoullLoveSection'
import { DiningPopularChainsSection } from '@/components/sections/dining/DiningPopularChainsSection'
import { BankOffersSection } from '@/components/sections/dining/BankOffersSection'
import { HotOnPassprive } from '@/components/sections/home/HotOnPassprive'
import {
  getMoodCategories,
  getNewRestaurants,
  getOffersForYouCards,
} from '@/lib/services/dining'
import { getEditorialCollections } from '@/lib/services/stores'

export const metadata: Metadata = {
  title: 'Dining Deals & Restaurants',
  description:
    'Explore top restaurants with exclusive dining deals, table bookings, and member discounts. Discover the best places to eat near you with PassPrivé.',
  openGraph: {
    title: 'Dining Deals & Restaurants | PassPrivé',
    description:
      'Find exclusive dining deals, book tables, and discover top restaurants near you.',
    url: '/dining',
  },
  alternates: {
    canonical: '/dining',
  },
}

export default async function Dining() {
  const [moodCategories, restaurants, bankOffers, editorialCollections] =
    await Promise.all([
      getMoodCategories(),
      getNewRestaurants(20),
      getOffersForYouCards(),
      getEditorialCollections('RESTAURANT'),
    ])

  const featured = restaurants.slice(0, 10)

  const offersYoullLove = [...restaurants]
    .filter((r) => r.has_offer)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10)

  const popularChains = [...restaurants]
    .sort((a, b) => (a.cost_for_two ?? 0) - (b.cost_for_two ?? 0))
    .slice(0, 10)

  return (
    <main>
      <HeroSection />
      <MoodCategoriesSection categories={moodCategories} />
      <QuickFilterTiles />
      <DiningDiscoverSection restaurants={featured} />
      <NowTrendingSection restaurants={restaurants} title="Now trending" />
      <OffersYoullLoveSection restaurants={offersYoullLove} />
      <DiningPopularChainsSection restaurants={popularChains} />
      <BankOffersSection cards={bankOffers} />
      <HotOnPassprive collections={editorialCollections} />
    </main>
  )
}
