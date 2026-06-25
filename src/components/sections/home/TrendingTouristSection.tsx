'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useLocation } from '@/lib/context/LocationContext';
import { SectionHeader } from './SectionHeader';
import type { TouristPlace } from '@/lib/types/touristPlaces';
import { cn } from '@/lib/utils';

function sameCityScore(city: string | null, userCity: string): number {
  return (city ?? '').trim().toLowerCase() === userCity ? 1 : 0;
}

function CardImageSlider({ place }: { place: TouristPlace }) {
  const [index, setIndex] = useState(0);
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  const googlePhotoUrl = place.picture_id && googleKey
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.picture_id}&key=${googleKey}`
    : null;

  const images = useMemo(() => {
    return [
      place.cover_image,
      ...(place.tourist_place_media_assets ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(m => m.file_url),
      googlePhotoUrl
    ].filter(Boolean) as string[];
  }, [place.cover_image, place.tourist_place_media_assets, googlePhotoUrl]);

  if (images.length === 0) {
    return <div className="w-full h-full bg-linear-to-br from-purple-100 to-purple-50" />;
  }

  return (
    <div className="relative w-full h-full group overflow-hidden">
      <Image
        src={images[index]}
        alt={`${place.place_name} - Image ${index + 1}`}
        fill
        className="object-cover transition-all duration-300"
        sizes="(max-width: 768px) 85vw, 50vw"
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-10 text-[12px] font-bold"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-10 text-[12px] font-bold"
          >
            ›
          </button>
          <div className="absolute bottom-2.5 right-2.5 flex gap-1 z-10 bg-black/35 px-2 py-0.5 rounded-full backdrop-blur-xs">
            {images.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 h-1 rounded-full transition-all",
                  i === index ? "bg-white scale-125" : "bg-white/40"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function TrendingTouristSection({
  places,
}: {
  places: TouristPlace[];
}) {
  const { location } = useLocation();
  const userCity = location.city.trim().toLowerCase();

  const sortedPlaces = useMemo(() => {
    return [...places]
      .map((place, index) => ({ place, index }))
      .sort((a, b) => {
        const cityDiff =
          sameCityScore(b.place.city, userCity) -
          sameCityScore(a.place.city, userCity);
        if (cityDiff !== 0) return cityDiff;

        const aAd = a.place.is_advertised ? 1 : 0;
        const bAd = b.place.is_advertised ? 1 : 0;
        if (aAd !== bAd) return bAd - aAd;

        const aPriority = a.place.ad_priority ?? Number.POSITIVE_INFINITY;
        const bPriority = b.place.ad_priority ?? Number.POSITIVE_INFINITY;
        if (aPriority !== bPriority) return aPriority - bPriority;

        return a.index - b.index;
      })
      .map((item) => item.place);
  }, [places, userCity]);

  if (!sortedPlaces.length) return null;

  return (
    <section className='bg-white py-6 md:py-10'>
      <SectionHeader title='Trending tourist spots near you' />
      <div className='mt-5 flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible'>
        {sortedPlaces.map((place) => (
          <Link
            key={place.id}
            href={`/tourist/${place.slug ?? place.id}`}
            className='relative shrink-0 w-[85vw] max-w-96 md:w-auto aspect-4/3 rounded-2xl overflow-hidden block bg-gray-900'
          >
            <CardImageSlider place={place} />
            <div className='absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent pointer-events-none z-10' />

            <div className='absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-2 z-10 pointer-events-none'>
              <div className='min-w-0 flex-1'>
                <p className='text-white text-[17px] font-bold leading-tight truncate'>
                  {place.place_name}
                </p>
                {(place.area || place.city) && (
                  <p className='text-white/60 text-[12px] mt-1 truncate'>
                    {[place.area, place.city]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                <p className='text-white/50 text-[11px] mt-0.5'>
                  {Number(place.price) === 0 ? 'Free' : `MUR ${place.price} per person`}
                </p>
              </div>
              <button
                type='button'
                aria-label='Save'
                className='p-2 rounded-xl bg-black/40 text-white/80 hover:text-white shrink-0 border border-white/10 z-10 pointer-events-auto'
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
