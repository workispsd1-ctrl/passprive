'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import { Bookmark } from 'lucide-react';
import { useLocation } from '@/lib/context/LocationContext';
import { SectionHeader } from './SectionHeader';
import type { Restaurant } from '@/lib/types/dining';

function sameCityScore(city: string | null, userCity: string): number {
  return (city ?? '').trim().toLowerCase() === userCity ? 1 : 0;
}

export function NowTrendingSection({
  restaurants,
}: {
  restaurants: Restaurant[];
}) {
  const { location } = useLocation();
  const userCity = location.city.trim().toLowerCase();

  const sortedRestaurants = useMemo(() => {
    return [...restaurants]
      .map((restaurant, index) => ({ restaurant, index }))
      .sort((a, b) => {
        const cityDiff =
          sameCityScore(b.restaurant.city, userCity) -
          sameCityScore(a.restaurant.city, userCity);
        if (cityDiff !== 0) return cityDiff;

        const aAd = a.restaurant.is_advertised ? 1 : 0;
        const bAd = b.restaurant.is_advertised ? 1 : 0;
        if (aAd !== bAd) return bAd - aAd;

        const aPriority = a.restaurant.ad_priority ?? Number.POSITIVE_INFINITY;
        const bPriority = b.restaurant.ad_priority ?? Number.POSITIVE_INFINITY;
        if (aPriority !== bPriority) return aPriority - bPriority;

        return a.index - b.index;
      })
      .map((item) => item.restaurant);
  }, [restaurants, userCity]);

  if (!sortedRestaurants.length) return null;

  return (
    <section className='bg-white py-6 md:py-10'>
      <SectionHeader title='Trending restaurants near you' />
      <div className='mt-5 flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible'>
        {sortedRestaurants.map((restaurant) => (
          <Link
            key={restaurant.id}
            href={`/dining/${restaurant.slug ?? restaurant.id}`}
            className='relative shrink-0 w-[85vw] max-w-96 md:w-auto aspect-4/3 rounded-2xl overflow-hidden block bg-gray-900'
          >
            {restaurant.cover_image ? (
              <Image
                src={restaurant.cover_image}
                alt={restaurant.name}
                fill
                className='object-cover opacity-80'
                sizes='(max-width: 768px) 85vw, 50vw'
              />
            ) : (
              <div className='absolute inset-0 bg-linear-to-br from-orange-900 to-gray-900' />
            )}
            <div className='absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent' />

            <div className='absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-2'>
              <div className='min-w-0 flex-1'>
                <p className='text-white text-[17px] font-bold leading-tight truncate'>
                  {restaurant.name}
                </p>
                {(restaurant.area || restaurant.city) && (
                  <p className='text-white/60 text-[12px] mt-1 truncate'>
                    {[restaurant.area, restaurant.city]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                {restaurant.cost_for_two && (
                  <p className='text-white/50 text-[11px] mt-0.5'>
                    ₹{restaurant.cost_for_two} for two
                  </p>
                )}
              </div>
              <button
                type='button'
                aria-label='Save'
                className='p-2 rounded-xl bg-black/40 text-white/80 hover:text-white shrink-0 border border-white/10'
              >
                <Bookmark className='w-4 h-4' />
              </button>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
