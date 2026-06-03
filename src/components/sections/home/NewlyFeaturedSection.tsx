'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import { Bookmark } from 'lucide-react';
import { useLocation } from '@/lib/context/LocationContext';
import type { FeaturedRestaurant } from '@/lib/types/dining';

function compareCity(
  aCity: string | null,
  bCity: string | null,
  userCity: string,
): number {
  const aMatches = (aCity ?? '').trim().toLowerCase() === userCity;
  const bMatches = (bCity ?? '').trim().toLowerCase() === userCity;
  if (aMatches !== bMatches) return Number(bMatches) - Number(aMatches);
  return 0;
}

export function NewlyFeaturedSection({
  restaurants,
}: {
  restaurants: FeaturedRestaurant[];
}) {
  const { location } = useLocation();
  const userCity = location.city.trim().toLowerCase();

  const sortedRestaurants = useMemo(() => {
    return restaurants
      .map((restaurant, index) => ({ restaurant, index }))
      .sort((a, b) => {
        const cityCompare = compareCity(
          a.restaurant.city,
          b.restaurant.city,
          userCity,
        );
        if (cityCompare !== 0) return cityCompare;

        if (a.restaurant.is_advertised !== b.restaurant.is_advertised) {
          return (
            Number(b.restaurant.is_advertised) -
            Number(a.restaurant.is_advertised)
          );
        }

        if (
          (a.restaurant.ad_priority ?? Number.POSITIVE_INFINITY) !==
          (b.restaurant.ad_priority ?? Number.POSITIVE_INFINITY)
        ) {
          return (
            (a.restaurant.ad_priority ?? Number.POSITIVE_INFINITY) -
            (b.restaurant.ad_priority ?? Number.POSITIVE_INFINITY)
          );
        }

        return a.index - b.index;
      })
      .map((item) => item.restaurant);
  }, [restaurants, userCity]);

  if (!sortedRestaurants.length) return null;

  return (
    <section className='bg-white pt-5 pb-2 md:pt-8'>
      <h2 className='text-[17px] md:text-[19px] font-bold text-gray-900 px-4 md:px-6 mb-4'>
        Newly featured for you
      </h2>
      <div className='flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-6 pb-3'>
        {sortedRestaurants.map((restaurant) => {
          const offer = restaurant.restaurant_offers?.[0];
          return (
            <Link
              key={restaurant.id}
              href={`/dining/${restaurant.slug ?? restaurant.id}`}
              className='relative shrink-0 w-[72vw] max-w-70 aspect-5/4 rounded-2xl overflow-hidden block bg-gray-900'
            >
              {restaurant.cover_image ? (
                <Image
                  src={restaurant.cover_image}
                  alt={restaurant.name}
                  fill
                  className='object-cover'
                  sizes='280px'
                />
              ) : (
                <div className='absolute inset-0 bg-linear-to-br from-orange-900 to-gray-900' />
              )}
              <div className='absolute inset-0 bg-linear-to-t from-black/80 via-black/15 to-black/15' />

              {offer?.badge_text && (
                <span className='absolute top-2.5 left-2.5 bg-green-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg leading-none'>
                  {offer.badge_text}
                </span>
              )}

              <button
                type='button'
                aria-label='Save'
                className='absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/30 text-white/80 hover:text-white'
              >
                <Bookmark className='w-3.5 h-3.5' />
              </button>

              <div className='absolute bottom-0 left-0 right-0 p-3'>
                <p className='text-white text-[14px] font-bold leading-tight truncate'>
                  {restaurant.name}
                </p>
                {(restaurant.area || restaurant.city) && (
                  <p className='text-white/60 text-[11px] mt-0.5 truncate'>
                    {[restaurant.area, restaurant.city]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                {restaurant.cost_for_two && (
                  <p className='text-white/45 text-[10px] mt-0.5'>
                    ₹{restaurant.cost_for_two} for two
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
