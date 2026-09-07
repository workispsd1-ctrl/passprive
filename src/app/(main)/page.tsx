import { NewKickInStores } from '@/components/sections/home/NewKickInStores';
import { NewlyFeaturedSection } from '@/components/sections/home/NewlyFeaturedSection';
import { NowTrendingSection } from '@/components/sections/home/NowTrendingSection';
import { StoresNearYouSection } from '@/components/sections/home/StoresNearYouSection';
import { StampsGiftPromo } from '@/components/sections/home/StampsGiftPromo';
import { OffersForYouSection } from '@/components/sections/home/OffersForYouSection';
import { SalonVisitSection } from '@/components/sections/home/SalonVisitSection';
import { HotOnPassprive } from '@/components/sections/home/HotOnPassprive';
import { getActiveRestaurants, getNewRestaurants } from '@/lib/services/dining';
import {
  getActiveStores,
  getEditorialCollections,
  getNewKickInStores,
} from '@/lib/services/stores';
import { getOffersForYou } from '@/lib/services/offersForYou';
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
  const [newStores, featured, restaurants, stores, offers, collections] =
    await Promise.all([
      getNewKickInStores({ limit: 8 }),
      getNewRestaurants(8),
      getActiveRestaurants(50),
      getActiveStores(),
      getOffersForYou(),
      getEditorialCollections(),
    ]);

  return (
    <main className='min-h-screen bg-white pb-10'>
      {featured.length > 0 && (
        <NewlyFeaturedSection restaurants={featured} stores={stores} />
      )}
      <StampsGiftPromo />
      <OffersForYouSection cards={offers} />
      {restaurants.length > 0 && <NowTrendingSection restaurants={restaurants} />}
      {newStores.length > 0 && <NewKickInStores stores={newStores} />}
      <SalonVisitSection stores={stores} />
      {stores.length > 0 && <StoresNearYouSection stores={stores} />}
      <HotOnPassprive collections={collections} />
    </main>
  );
}
