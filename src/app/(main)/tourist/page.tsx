import { TouristPlacesPageClient } from './TouristPlacesPageClient';
import { BannerCarousel } from '@/components/shared/BannerCarousel';
import { getActiveTouristPlaces } from '@/lib/services/touristPlaces';
import { getWebsiteBanners } from '@/lib/services/websiteBanners';
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
  const [places, banners] = await Promise.all([
    getActiveTouristPlaces(50),
    getWebsiteBanners('tourist'),
  ]);

  return (
    <main className="min-h-screen pb-20 md:pb-0 bg-white">
      {banners.length > 0 && (
        <div className="mx-auto max-w-350 px-4 pt-4 md:px-12">
          <BannerCarousel banners={banners} className="aspect-[16/9] md:aspect-[21/9]" />
        </div>
      )}
      <TouristPlacesPageClient places={places} />
    </main>
  );
}
