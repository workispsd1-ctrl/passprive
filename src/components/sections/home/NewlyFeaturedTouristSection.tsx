'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useRef, useState, useEffect } from 'react';
import { Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from '@/lib/context/LocationContext';
import type { TouristPlace } from '@/lib/types/touristPlaces';
import { cn } from '@/lib/utils';

const SCROLL_BY = 300;

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
        sizes="280px"
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

export function NewlyFeaturedTouristSection({
  places,
}: {
  places: TouristPlace[];
}) {
  const { location } = useLocation();
  const userCity = location.city.trim().toLowerCase();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function updateArrows() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    return () => el.removeEventListener('scroll', updateArrows);
  }, []);

  function scrollLeft() {
    scrollRef.current?.scrollBy({ left: -SCROLL_BY, behavior: 'smooth' });
  }

  function scrollRight() {
    scrollRef.current?.scrollBy({ left: SCROLL_BY, behavior: 'smooth' });
  }

  const sortedPlaces = useMemo(() => {
    return places
      .map((place, index) => ({ place, index }))
      .sort((a, b) => {
        const cityCompare = compareCity(
          a.place.city,
          b.place.city,
          userCity,
        );
        if (cityCompare !== 0) return cityCompare;

        if (a.place.is_advertised !== b.place.is_advertised) {
          return (
            Number(b.place.is_advertised) -
            Number(a.place.is_advertised)
          );
        }

        if (
          (a.place.ad_priority ?? Number.POSITIVE_INFINITY) !==
          (b.place.ad_priority ?? Number.POSITIVE_INFINITY)
        ) {
          return (
            (a.place.ad_priority ?? Number.POSITIVE_INFINITY) -
            (b.place.ad_priority ?? Number.POSITIVE_INFINITY)
          );
        }

        return a.index - b.index;
      })
      .map((item) => item.place);
  }, [places, userCity]);

  if (!sortedPlaces.length) return null;

  return (
    <section className='bg-white pt-5 pb-2 md:pt-8'>
      <div className='flex items-center justify-between px-4 md:px-6 mb-4'>
        <h2 className='text-[17px] md:text-[19px] font-bold text-gray-900'>
          Featured tourist spots
        </h2>
        <div className='flex items-center gap-1.5'>
          <button
            type='button'
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            aria-label='Scroll left'
            className='w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
          >
            <ChevronLeft className='w-4 h-4' />
          </button>
          <button
            type='button'
            onClick={scrollRight}
            disabled={!canScrollRight}
            aria-label='Scroll right'
            className='w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
          >
            <ChevronRight className='w-4 h-4' />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className='flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-6 pb-3'>
        {sortedPlaces.map((place) => {
          return (
            <Link
              key={place.id}
              href={`/tourist/${place.slug ?? place.id}`}
              className='relative shrink-0 w-[72vw] max-w-70 aspect-5/4 rounded-2xl overflow-hidden block bg-gray-900'
            >
              <CardImageSlider place={place} />
              <div className='absolute inset-0 bg-linear-to-t from-black/80 via-black/15 to-black/15 pointer-events-none z-10' />

              {place.ad_badge_text && (
                <span className='absolute top-2.5 left-2.5 bg-brand/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg leading-none z-10'>
                  {place.ad_badge_text}
                </span>
              )}

              <button
                type='button'
                aria-label='Save'
                className='absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/30 text-white/80 hover:text-white z-10'
              >
                <Bookmark className='w-3.5 h-3.5' />
              </button>

              <div className='absolute bottom-0 left-0 right-0 p-3 z-10 pointer-events-none'>
                <p className='text-white text-[14px] font-bold leading-tight truncate'>
                  {place.place_name}
                </p>
                {(place.area || place.city) && (
                  <p className='text-white/60 text-[11px] mt-0.5 truncate'>
                    {[place.area, place.city]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                <p className='text-white/45 text-[10px] mt-0.5'>
                  {Number(place.price) === 0 ? 'Free' : `MUR ${place.price} per person`}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
