import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRestaurantBySlugOrId } from '@/lib/services/dining';
import { getUserCashbackInfo } from '@/lib/services/wallet';
import { createClient } from '@/lib/supabase/server';
import {
  PhotoGalleryProvider,
  PhotoGrid,
  PhotoStrip,
} from '@/components/sections/dining/PhotoGalleryClient';
import { RestaurantHeader } from '@/components/sections/dining/RestaurantHeader';
import { RestaurantInfoCards } from '@/components/sections/dining/RestaurantInfoCards';
import { RestaurantOffersSection } from '@/components/sections/dining/RestaurantOffersSection';
import { RestaurantMenuSection } from '@/components/sections/dining/RestaurantMenuSection';
import { RestaurantReviewsSection } from '@/components/sections/dining/RestaurantReviewsSection';
import { RestaurantAboutSection } from '@/components/sections/dining/RestaurantAboutSection';
import { RestaurantLocationSection } from '@/components/sections/dining/RestaurantLocationSection';

const fetchRestaurant = cache((id: string) => getRestaurantBySlugOrId(id));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { restaurant, tags } = await fetchRestaurant(id);
  if (!restaurant) return {};

  const cuisineTags = tags
    .filter((t) => t.tag_type === 'cuisine')
    .map((t) => t.tag_value);
  const location = [restaurant.area, restaurant.city]
    .filter(Boolean)
    .join(', ');
  const cuisineStr = cuisineTags.length ? cuisineTags.join(', ') : null;
  const description = [
    restaurant.description,
    cuisineStr && `Cuisine: ${cuisineStr}`,
    location && `Located in ${location}`,
    restaurant.cost_for_two && `₨${restaurant.cost_for_two} for two`,
  ]
    .filter(Boolean)
    .join('. ');

  return {
    title: restaurant.name,
    description: `${description || `Discover ${restaurant.name}`}. Book a table and unlock exclusive dining deals on PassPrivé.`,
    openGraph: {
      title: `${restaurant.name} | PassPrivé`,
      description: description || `Discover ${restaurant.name} on PassPrivé`,
      url: `/dining/${restaurant.slug ?? id}`,
      images: restaurant.cover_image
        ? [{ url: restaurant.cover_image, alt: restaurant.name }]
        : [],
    },
    alternates: { canonical: `/dining/${restaurant.slug ?? id}` },
  };
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [
    {
      restaurant,
      offers,
      tags,
      reviews,
      reviewSummary,
      galleryPhotos,
      menuImages,
      todayHours,
      allHours,
    },
    supabase,
  ] = await Promise.all([fetchRestaurant(id), createClient()]);

  if (!restaurant) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cashbackInfo = user
    ? await getUserCashbackInfo(user.id, restaurant.id)
    : null;

  const cuisineTags = tags
    .filter((t) => t.tag_type === 'cuisine')
    .map((t) => t.tag_value);
  const facilityTags = tags
    .filter((t) => t.tag_type === 'facility')
    .map((t) => t.tag_value);
  const highlightTags = tags
    .filter((t) => t.tag_type === 'highlight')
    .map((t) => t.tag_value);
  const worthVisitTags = tags
    .filter((t) => t.tag_type === 'worth_visit')
    .map((t) => t.tag_value);
  const moodTags = tags
    .filter((t) => t.tag_type === 'mood')
    .map((t) => t.tag_value);
  const cuisineLabel = cuisineTags.join(', ');
  const fullMenuImages: string[] =
    menuImages.length > 0
      ? menuImages
      : (restaurant.menu_json?.full_menu_image_urls ?? []);
  const breadcrumbCity = restaurant.city ?? restaurant.area ?? 'Dining';
  const mainOffers = offers.filter(
    (o) => o.offer_type !== 'bank_card' && o.offer_type !== 'credit_card',
  );
  const bankOffers = offers.filter(
    (o) => o.offer_type === 'bank_card' || o.offer_type === 'credit_card',
  );

  return (
    <PhotoGalleryProvider photos={galleryPhotos}>
      <main className='min-h-screen bg-white pb-24 md:pb-0'>
        <PhotoGrid
          photos={galleryPhotos}
          restaurantName={restaurant.name}
        />

        <div className='max-w-7xl mx-auto px-4 md:px-6'>
          <nav className='pt-3 pb-2 text-[12px] text-gray-400 hidden md:flex items-center gap-1.5'>
            <Link
              href='/'
              className='hover:text-gray-600 transition-colors'
            >
              Home page
            </Link>
            <span>/</span>
            <Link
              href='/dining'
              className='hover:text-gray-600 transition-colors'
            >
              {breadcrumbCity}
            </Link>
            <span>/</span>
            <span className='text-gray-600'>{restaurant.name}</span>
          </nav>

          <div className='md:grid md:grid-cols-[1fr_340px] md:gap-10 md:items-start md:pt-2'>
            <div className='min-w-0'>
              <RestaurantHeader
                restaurant={restaurant}
                cashbackInfo={cashbackInfo}
                todayHours={todayHours}
                allHours={allHours}
                reviewSummary={reviewSummary}
              />
              <RestaurantInfoCards
                description={restaurant.description}
                cuisineLabel={cuisineLabel}
                facilityTags={facilityTags}
                highlightTags={highlightTags}
                worthVisitTags={worthVisitTags}
              />
              <RestaurantOffersSection
                mainOffers={mainOffers}
                bankOffers={bankOffers}
              />
              <RestaurantMenuSection
                sections={restaurant.menu_json?.sections ?? []}
                fullMenuImages={fullMenuImages}
              />
              <PhotoStrip photos={galleryPhotos} />
              <RestaurantReviewsSection
                reviews={reviews}
                reviewSummary={reviewSummary}
              />
              <RestaurantAboutSection
                costForTwo={restaurant.cost_for_two}
                cuisineLabel={cuisineLabel}
                facilityTags={facilityTags}
              />
              <RestaurantLocationSection
                name={restaurant.name}
                fullAddress={restaurant.full_address}
                area={restaurant.area}
                city={restaurant.city}
                latitude={restaurant.latitude}
                longitude={restaurant.longitude}
                phone={restaurant.phone}
              />
            </div>

            {restaurant.booking_enabled && (
              <div className='hidden md:block sticky top-20 pt-4'>
                <div className='rounded-2xl border border-gray-200 bg-white shadow-sm p-6 flex flex-col gap-4'>
                  <div>
                    <h2 className='text-[17px] font-extrabold text-gray-900'>
                      Book a table
                    </h2>
                    <p className='text-sm text-gray-500 mt-1'>
                      Reserve your spot at {restaurant.name}
                    </p>
                  </div>
                  <Link
                    href={`/dining/${restaurant.slug ?? restaurant.id}/book`}
                    className='block w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold text-[14px] text-center hover:bg-black transition-colors'
                  >
                    Book a table
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {restaurant.booking_enabled && (
          <div className='md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-4 z-20 shadow-lg'>
            <Link
              href={`/dining/${restaurant.slug ?? restaurant.id}/book`}
              className='block w-full py-3.5 rounded-2xl bg-gray-900 text-white font-bold text-[15px] text-center hover:bg-black transition-colors'
            >
              Book a table
            </Link>
          </div>
        )}
      </main>
    </PhotoGalleryProvider>
  );
}
