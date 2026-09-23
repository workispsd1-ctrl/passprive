import { NewKickInStores } from '@/components/sections/home/NewKickInStores';
import { NewlyFeaturedSection } from '@/components/sections/home/NewlyFeaturedSection';
import { NowTrendingSection } from '@/components/sections/home/NowTrendingSection';
import { StoresNearYouSection } from '@/components/sections/home/StoresNearYouSection';
import { StampsGiftPromo } from '@/components/sections/home/StampsGiftPromo';
import { BankOffersSection } from '@/components/sections/dining/BankOffersSection';
import { SalonVisitSection } from '@/components/sections/home/SalonVisitSection';
import { HotOnPassprive } from '@/components/sections/home/HotOnPassprive';
import { getNewRestaurants } from '@/lib/services/dining';
import {
  getActiveStores,
  getEditorialCollections,
  getNewKickInStores,
} from '@/lib/services/stores';
import { getOffersForYou } from '@/lib/services/offersForYou';
import { UpcomingBookings } from '@/components/sections/home/UpcomingBookings';
import { getUserCoords } from '@/lib/location';
import { sortByDistanceFrom } from '@/lib/utils';
import { getCurrentUser } from '@/lib/services/user';
import { getUpcomingDiningBookings } from '@/lib/services/bookings';
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
  const [user, coords] = await Promise.all([getCurrentUser(), getUserCoords()]);
  const [newStores, restaurants, stores, offers, collections, upcoming] =
    await Promise.all([
      getNewKickInStores({ limit: 8, userLat: coords?.lat, userLng: coords?.lng }),
      getNewRestaurants(40, coords),
      getActiveStores().then((all) => sortByDistanceFrom(all, coords)),
      getOffersForYou(),
      getEditorialCollections(),
      user ? getUpcomingDiningBookings(user.id) : Promise.resolve([]),
    ]);

  const featured = restaurants.slice(0, 8);

  return (
    <main className='min-h-screen bg-white pb-10'>
      <UpcomingBookings bookings={upcoming} />
      {featured.length > 0 && (
        <NewlyFeaturedSection restaurants={featured} stores={stores} />
      )}
      <StampsGiftPromo />
      <BankOffersSection
        cards={offers}
        title='Offers for you'
        className='relative left-1/2 w-screen -translate-x-1/2 bg-[#FFF7F2]'
      />
      {restaurants.length > 0 && <NowTrendingSection restaurants={restaurants} />}
      {newStores.length > 0 && <NewKickInStores stores={newStores} />}
      <SalonVisitSection stores={stores} />
      {stores.length > 0 && <StoresNearYouSection stores={stores} />}
      <HotOnPassprive collections={collections} />
    </main>
  );
}
