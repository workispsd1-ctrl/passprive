import type { Metadata } from 'next'
import { getActiveStores, getNewKickInStores } from '@/lib/services/stores'

export const metadata: Metadata = {
  title: 'Discover Deals on Dining & Stores Near You',
  description:
    'Browse newly featured restaurants, popular store chains, exclusive member offers, and trending dining spots — all in one place with PassPrivé.',
  openGraph: {
    title: 'PassPrivé — Your Pass to the Best Deals & Places',
    description:
      'Exclusive dining deals, store discounts, and member offers near you. Discover what\'s trending on PassPrivé.',
    url: '/',
  },
  alternates: {
    canonical: '/',
  },
}
import { getFeaturedRestaurants, getActiveRestaurants } from '@/lib/services/dining'
import { NewlyFeaturedSection } from '@/components/sections/home/NewlyFeaturedSection'
import { PopularChainsSection } from '@/components/sections/home/PopularChainsSection'
import { NewKickInStores } from '@/components/sections/home/NewKickInStores'
import { OffersForYouSection } from '@/components/sections/home/OffersForYouSection'
import { StoresNearYouSection } from '@/components/sections/home/StoresNearYouSection'
import { NowTrendingSection } from '@/components/sections/home/NowTrendingSection'

export default async function Home() {
  const [stores, newStores, featured, restaurants] = await Promise.all([
    getActiveStores(),
    getNewKickInStores({ limit: 6 }),
    getFeaturedRestaurants(8),
    getActiveRestaurants(6),
  ])

  return (
    <main className="min-h-screen pb-10">
      {featured.length > 0 && <NewlyFeaturedSection restaurants={featured} />}
      {/* <PopularChainsSection stores={stores} /> */}
      {newStores.length > 0 && <NewKickInStores stores={newStores} />}
      {/* <OffersForYouSection /> */}
      {stores.length > 0 && <StoresNearYouSection stores={stores} />}
      {restaurants.length > 0 && <NowTrendingSection restaurants={restaurants} />}
    </main>
  )
}
