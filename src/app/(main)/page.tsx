import { NewKickInStores } from '@/components/sections/home/NewKickInStores';
import { NewlyFeaturedSection } from '@/components/sections/home/NewlyFeaturedSection';
import { NowTrendingSection } from '@/components/sections/home/NowTrendingSection';
import { StoresNearYouSection } from '@/components/sections/home/StoresNearYouSection';
import { NewlyFeaturedTouristSection } from '@/components/sections/home/NewlyFeaturedTouristSection';
import { TrendingTouristSection } from '@/components/sections/home/TrendingTouristSection';
import { getActiveRestaurants, getNewRestaurants } from '@/lib/services/dining';
import { getActiveStores, getNewKickInStores } from '@/lib/services/stores';
import { getActiveTouristPlaces, getNewTouristPlaces } from '@/lib/services/touristPlaces';
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
  const [stores, newStores, featured, restaurants, touristPlaces, newTouristPlaces] = await Promise.all([
    getActiveStores(),
    getNewKickInStores({ limit: 6 }),
    getNewRestaurants(8),
    getActiveRestaurants(6),
    getActiveTouristPlaces(6),
    getNewTouristPlaces(8),
  ]);

  return (
    <main className='min-h-screen pb-10'>
      {featured.length > 0 && <NewlyFeaturedSection restaurants={featured} />}
      {newTouristPlaces.length > 0 && <NewlyFeaturedTouristSection places={newTouristPlaces} />}
      {/* <PopularChainsSection stores={stores} /> */}
      {newStores.length > 0 && <NewKickInStores stores={newStores} />}
      {/* <OffersForYouSection /> */}
      {stores.length > 0 && <StoresNearYouSection stores={stores} />}
      {restaurants.length > 0 && (
        <NowTrendingSection restaurants={restaurants} />
      )}
      {touristPlaces.length > 0 && (
        <TrendingTouristSection places={touristPlaces} />
      )}
    </main>
  );
}
