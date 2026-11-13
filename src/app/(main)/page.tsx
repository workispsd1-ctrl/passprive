import { NewKickInStores } from '@/components/sections/home/NewKickInStores';
import { HuntSpot } from '@/components/hunt/HuntSpot'
import { ServiceAreaGate } from '@/components/shared/ServiceAreaGate';
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
import { scopeStoresToRadius } from '@/lib/nearby';
import { isWellnessStore } from '@/lib/storeType';
import { getCurrentUser } from '@/lib/services/user';
import { getUpcomingDiningBookings } from '@/lib/services/bookings';
import { getActiveMalls, getMallsSectionTitle } from '@/lib/services/malls';
import { MallsNearYou } from '@/components/sections/malls/MallsNearYou';
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
  const [newStores, restaurants, allStores, offers, collections, upcoming, mallsTitle] =
    await Promise.all([
      getNewKickInStores({ limit: 8, userLat: coords?.lat, userLng: coords?.lng }),
      getNewRestaurants(40, coords),
      getActiveStores(),
      getOffersForYou(),
      getEditorialCollections(),
      user ? getUpcomingDiningBookings(user.id) : Promise.resolve([]),
      getMallsSectionTitle(),
    ]);

  // the store rails use the 3–5 km radius; salons are scoped inside their own section
  const stores = scopeStoresToRadius(allStores, coords);
  const malls = mallsTitle ? await getActiveMalls(coords) : [];
  const featured = restaurants.slice(0, 8);
  // badge fields for the "New Kicks in Store" rail, which its RPC doesn't return
  const newStoreIds = new Set(newStores.map((n) => n.store_id));
  const newStoreCapabilities = Object.fromEntries(
    allStores
      .filter((s) => newStoreIds.has(s.id))
      .map((s) => [
        s.id,
        {
          merchant_type: s.merchant_type,
          merchant_plan: s.merchant_plan,
          pay_bill_enabled: s.pay_bill_enabled,
          service_level: s.service_level,
          on_boarded: s.on_boarded,
          booking_enabled: s.booking_enabled,
          cashback_enabled: s.cashback_enabled,
          is_promoted: s.is_promoted,
        },
      ]),
  );

  return (
    <ServiceAreaGate>
    <main className='relative min-h-screen bg-white pb-10'>
      <HuntSpot slot='home-top' />
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
      {newStores.length > 0 && <NewKickInStores stores={newStores} capabilities={newStoreCapabilities} />}
      {/* app parity: PlanYourSalonVisit — 15 km, or the same city / area for salons with no coordinates */}
      <SalonVisitSection stores={allStores} />
      {stores.length > 0 && <StoresNearYouSection stores={stores.filter((s) => !isWellnessStore(s))} />}
      {mallsTitle && <MallsNearYou malls={malls} title={mallsTitle} />}
      <HotOnPassprive collections={collections} />
    </main>
    </ServiceAreaGate>
  );
}
