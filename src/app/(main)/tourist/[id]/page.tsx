import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTouristPlaceBySlugOrId } from '@/lib/services/touristPlaces';

import {
  PhotoGalleryProvider,
  PhotoGrid,
  PhotoStrip,
} from '@/components/sections/dining/PhotoGalleryClient';

import { TouristHeader } from '@/components/sections/tourist/TouristHeader';
import { TouristActions } from '@/components/sections/tourist/TouristActions';
import { TouristActivities } from '@/components/sections/tourist/TouristActivities';
import { TouristReviews } from '@/components/sections/tourist/TouristReviews';
import { TouristLocation } from '@/components/sections/tourist/TouristLocation';
import { TouristBookingWidget } from '@/components/sections/tourist/TouristBookingWidget';

const fetchTouristPlace = cache((id: string) => getTouristPlaceBySlugOrId(id));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { place } = await fetchTouristPlace(id);
  if (!place) return {};

  const location = [place.area, place.city].filter(Boolean).join(', ');
  const description = [
    place.description,
    location && `Located in ${location}`,
    place.price && `MUR ${place.price} per person`,
  ].filter(Boolean).join('. ');

  return {
    title: place.place_name,
    description: `${description || `Discover ${place.place_name}`}. Plan your visit and book activities on PassPrivé.`,
    openGraph: {
      title: `${place.place_name} | PassPrivé`,
      description: description || `Discover ${place.place_name} on PassPrivé`,
      url: `/tourist/${place.slug ?? id}`,
      images: place.cover_image ? [{ url: place.cover_image, alt: place.place_name }] : [],
    },
    alternates: {
      canonical: `/tourist/${place.slug ?? id}`,
    },
  };
}

export default async function TouristPlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { place, activities, reviews, reviewSummary, galleryPhotos, todayHours, allHours } =
    await fetchTouristPlace(id);

  if (!place) notFound();

  const breadcrumbCity = place.city ?? place.area ?? 'Mauritius';

  return (
    <PhotoGalleryProvider photos={galleryPhotos}>
      <main className="min-h-screen bg-white pb-24 md:pb-0">
        <PhotoGrid
          photos={galleryPhotos}
          restaurantName={place.place_name}
          backHref="/tourist"
        />

        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <nav className="pt-3 pb-2 text-[12px] text-gray-400 hidden md:flex items-center gap-1.5">
            <Link
              href="/"
              className="hover:text-gray-600 transition-colors"
            >
              Home page
            </Link>
            <span>/</span>
            <Link
              href="/tourist"
              className="hover:text-gray-600 transition-colors"
            >
              {breadcrumbCity}
            </Link>
            <span>/</span>
            <span className="text-gray-600">{place.place_name}</span>
          </nav>

          <div className="md:grid md:grid-cols-[1fr_340px] md:gap-10 md:items-start md:pt-2">
            <div className="min-w-0">
              <TouristHeader
                place={place}
                reviewAvg={reviewSummary.avg}
                todayHours={todayHours}
                allHours={allHours}
              />

              <TouristActions phone={place.phone} />

              {place.description && (
                <section className="mt-8 border-t border-gray-100 pt-6">
                  <h2 className="text-[18px] font-bold text-gray-900 mb-3">About the Attraction</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">{place.description}</p>
                </section>
              )}

              <TouristActivities activities={activities} />

              <PhotoStrip photos={galleryPhotos} />

              <TouristReviews reviews={reviews} reviewSummary={reviewSummary} />

              <TouristLocation place={place} />
            </div>

            <TouristBookingWidget
              placeId={place.id}
              placeName={place.place_name}
              bookingEnabled={place.booking_enabled}
              slug={place.slug}
            />
          </div>
        </div>
      </main>
    </PhotoGalleryProvider>
  );
}
