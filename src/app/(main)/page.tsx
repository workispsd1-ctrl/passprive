import { NewKickInStores } from '@/components/sections/home/NewKickInStores';
import { NewlyFeaturedSection } from '@/components/sections/home/NewlyFeaturedSection';
import { NowTrendingSection } from '@/components/sections/home/NowTrendingSection';
import { StoresNearYouSection } from '@/components/sections/home/StoresNearYouSection';
import { getActiveRestaurants, getNewRestaurants } from '@/lib/services/dining';
import { getActiveStores, getNewKickInStores } from '@/lib/services/stores';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover Deals on Dining & Stores Near You',
  description:
    'Browse newly featured restaurants, popular store chains, exclusive member offers, and trending dining spots — all in one place with PassPrivé.',
  openGraph: {
    title: 'PassPrivé — Your Pass to the Best Deals & Places',
    description:
      "Exclusive dining deals, store discounts, and member offers near you. Discover what's trending on PassPrivé.",
    url: '/',
  },
  alternates: {
    canonical: '/',
  },
};

export default async function Home() {
  const [stores, newStores, featured, restaurants] = await Promise.all([
    getActiveStores(),
    getNewKickInStores({ limit: 6 }),
    getNewRestaurants(8),
    getActiveRestaurants(6),
  ]);

  return (
    <main className='min-h-screen pb-10'>
      {featured.length > 0 && <NewlyFeaturedSection restaurants={featured} />}
      {/* <PopularChainsSection stores={stores} /> */}
      {newStores.length > 0 && <NewKickInStores stores={newStores} />}
      {/* <OffersForYouSection /> */}
      {stores.length > 0 && <StoresNearYouSection stores={stores} />}
      {restaurants.length > 0 && (
        <NowTrendingSection restaurants={restaurants} />
      )}
    </main>
  );
}
