import type { Metadata } from 'next';
import { HScroll } from '@/components/sections/home/HScroll';
import { FeedRestaurantCard } from '@/components/sections/dining/FeedRestaurantCard';
import { TouristImageBanner } from '@/components/sections/tourist/home/TouristHero';
import { TouristHomeClient } from '@/components/sections/tourist/home/TouristHomeClient';
import { getAllTouristPlaces, getTouristCategories } from '@/lib/services/touristPlaces';
import { getNewRestaurants } from '@/lib/services/dining';
import { getUserCoords } from '@/lib/location';
import { withDistances } from '@/lib/touristCatalog';
import { scopeToRadius } from '@/lib/nearby';
import { haversineKm } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Tourist Attractions & Places | PassPrivé',
  description:
    'Discover top tourist spots, activities, and scenery in Mauritius. Plan your visits and book tours with PassPrivé.',
  openGraph: {
    title: 'Tourist Attractions & Places | PassPrivé',
    description: 'Explore top tourist spots and activities in Mauritius with exclusive member privileges.',
    url: '/tourist',
  },
  alternates: {
    canonical: '/tourist',
  },
};

// App parity: components/Home/TouristHome.jsx (krittika branch).
export default async function TouristPage() {
  const coords = await getUserCoords();
  // The hero banner is rendered by the header (HeaderHeroNav), like Home/Wellness.
  const [allPlaces, categories, nearbyRestaurants] = await Promise.all([
    getAllTouristPlaces(),
    getTouristCategories(),
    getNewRestaurants(12, coords), // already trimmed to the 3–5 km radius
  ]);
  // Every tourist section (rails, ad, category results, day plans) draws from
  // this list, so trimming it here applies the 3–5 km radius to all of them.
  const places = scopeToRadius(
    withDistances(allPlaces, coords, haversineKm),
    (p) => p._distanceKm,
    !!coords,
  );

  return (
    <main className="min-h-screen bg-white pb-20 md:pb-0">
      {/* TODO(design): the app opens its Taxi flow here; the web has no taxi route yet. */}
      <TouristImageBanner
        src="/tourist/HireTaxis.png"
        desktop={{ src: '/tourist/hire-taxis-banner-desktop.png', width: 6304, height: 500 }}
        alt="Hire Taxis — local prices guaranteed. No surcharges. No scams."
      />
      <TouristHomeClient
        places={places}
        categories={categories}
        coords={coords}
        nearMe={
          nearbyRestaurants.length > 0 && (
            <HScroll title="Near me now">
              {nearbyRestaurants.map((r) => (
                <FeedRestaurantCard key={r.id} r={r} />
              ))}
            </HScroll>
          )
        }
        exploreArea={
          // TODO(design): the app opens Saved Locations here; no web equivalent yet.
          <TouristImageBanner
            src="/tourist/ExploreArea.png"
            desktop={{ src: '/tourist/explore-area-banner-desktop.png', width: 6304, height: 656 }}
            alt="Explore Area — pick a location in Mauritius and check out customised gems around"
          />
        }
        houseAd={
          // Shown only while no tourist place is advertised. Desktop-only art:
          // its copy is unreadable at phone width. No matching place exists
          // to link to yet, so it isn't clickable.
          <TouristImageBanner
            mobile={false}
            desktop={{ src: '/tourist/ad-blue-bay-tours-desktop.png', width: 6304, height: 656 }}
            alt="Ad: Blue Bay Tours — Private Pirogue Sunset Cruise, book now from MUR 450"
          />
        }
      />
    </main>
  );
}
