import { TouristPlacesPageClient } from './TouristPlacesPageClient';
import { getActiveTouristPlaces } from '@/lib/services/touristPlaces';
import type { Metadata } from 'next';

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

export default async function TouristPage() {
  const places = await getActiveTouristPlaces(50);

  return (
    <main className="min-h-screen pb-20 md:pb-0 bg-white">
      <TouristPlacesPageClient places={places} />
    </main>
  );
}
