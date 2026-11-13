import { NewKickInStores } from '@/components/sections/home/NewKickInStores';
import { HuntSpot } from '@/components/hunt/HuntSpot'
import { ServiceAreaGate } from '@/components/shared/ServiceAreaGate';
import { NewlyFeaturedSection } from '@/components/sections/home/NewlyFeaturedSection';
import { NowTrendingSection } from '@/components/sections/home/NowTrendingSection';
import { StampsGiftPromo } from '@/components/sections/home/StampsGiftPromo';
import { BankOffersSection } from '@/components/sections/dining/BankOffersSection';
import { SalonVisitSection } from '@/components/sections/home/SalonVisitSection';
import { HotOnPassprive } from '@/components/sections/home/HotOnPassprive';
import { getFamilyFeast, getFreshSpots, getNewRestaurants, getPromotionalCollections } from '@/lib/services/dining';
import {
  getActiveStores,
  getEditorialCollections,
  getNewKickInStores,
} from '@/lib/services/stores';
import { getOffersForYou } from '@/lib/services/offersForYou';
import { UpcomingBookings } from '@/components/sections/home/UpcomingBookings';
import { getUserCoords } from '@/lib/location';
import { scopeStoresToRadius } from '@/lib/nearby';
import { getCurrentUser } from '@/lib/services/user';
import { getUpcomingDiningBookings } from '@/lib/services/bookings';
import { getActiveMalls } from '@/lib/services/malls';
import { MallsNearYou } from '@/components/sections/malls/MallsNearYou';
import { getHomeSectionOrder } from '@/lib/services/homeSections';
import { PromotionalCollectionsSection } from '@/components/sections/dining/PromotionalCollectionsSection';
import { CashbackIntroStrip } from '@/components/sections/home/CashbackIntroStrip';
import { Fragment, type ReactNode } from 'react';
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
  const [user, coords, order] = await Promise.all([getCurrentUser(), getUserCoords(), getHomeSectionOrder()]);
  // app parity: HomeContent.jsx — sections come from the CMS order ("Home Screen"
  // rows of session_sorting_titles), and only the enabled ones are fetched.
  const on = new Set(order.map((r) => r.section_key));
  const [newStores, restaurants, allStores, offers, collections, upcoming, freshSpots, familyFeast, promos, malls] =
    await Promise.all([
      on.has('new-kick-in-stores') ? getNewKickInStores({ limit: 8, userLat: coords?.lat, userLng: coords?.lng }) : [],
      on.has('foodie-frontrow') || on.has('foodie-frontrow-classic') ? getNewRestaurants(40, coords) : [],
      getActiveStores(),
      on.has('offers-for-you') ? getOffersForYou() : [],
      on.has('whats-hot') ? getEditorialCollections() : [],
      user ? getUpcomingDiningBookings(user.id) : Promise.resolve([]),
      on.has('fresh-spots') ? getFreshSpots(coords) : [],
      on.has('family-feast') ? getFamilyFeast(coords) : [],
      on.has('promotional-cards') ? getPromotionalCollections('home', coords) : [],
      on.has('malls') ? getActiveMalls(coords) : [],
    ]);

  // the store rails use the 3–5 km radius; salons are scoped inside their own section
  const stores = scopeStoresToRadius(allStores, coords);
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

  /**
   * app parity: HomeContent SECTION_COMPONENTS (+ "promotional-cards"). Keys the
   * app has no component for — "deals-near-you", "shop-this-weekend",
   * "now-trending" — render nothing there, so they render nothing here.
   */
  const section = (key: string | null, title: string | null): ReactNode => {
    switch (key) {
      case 'foodie-frontrow':
        return featured.length > 0 ? <NewlyFeaturedSection restaurants={featured} stores={stores} /> : null;
      case 'fresh-spots':
        return <NowTrendingSection restaurants={freshSpots} title={title || 'New Dining Spots'} presorted />;
      case 'more-with-passprive':
        return <StampsGiftPromo />;
      case 'offers-for-you':
        return (
          <BankOffersSection
            cards={offers}
            title={title || 'Offers for you'}
            className='relative left-1/2 w-screen -translate-x-1/2 bg-[#FFF7F2]'
          />
        );
      case 'foodie-frontrow-classic':
        return restaurants.length > 0 ? <NowTrendingSection restaurants={restaurants} /> : null;
      case 'promotional-cards':
        // app parity: PromotionalCards drops a card with no nearby restaurants
        return <PromotionalCollectionsSection collections={promos.filter((c) => c.restaurants.length > 0)} />;
      case 'new-kick-in-stores':
        return newStores.length > 0 ? <NewKickInStores stores={newStores} capabilities={newStoreCapabilities} /> : null;
      case 'family-feast':
        return <NowTrendingSection restaurants={familyFeast} title={title || 'Family Feast'} presorted />;
      case 'plan-your-salon-visit':
        // app parity: PlanYourSalonVisit — 15 km, or the same city / area for salons with no coordinates
        return <SalonVisitSection stores={allStores} />;
      case 'whats-hot':
        return <HotOnPassprive collections={collections} />;
      case 'malls':
        return <MallsNearYou malls={malls} title={title || 'Explore Malls'} />;
      default:
        return null;
    }
  };

  return (
    <ServiceAreaGate>
    <main className='relative min-h-screen bg-white pb-10'>
      <CashbackIntroStrip />
      <HuntSpot slot='home-top' />
      <UpcomingBookings bookings={upcoming} />
      {order.map((row, i) => {
        const node = section(row.section_key, row.title);
        return node ? <Fragment key={row.section_key ?? `row-${i}`}>{node}</Fragment> : null;
      })}
    </main>
    </ServiceAreaGate>
  );
}
