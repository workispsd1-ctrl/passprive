'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { TouristPlace } from '@/lib/types/touristPlaces';

interface Props {
  place: TouristPlace;
}

export function CardImageSlider({ place }: Props) {
  const [index, setIndex] = useState(0);
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const googlePhotoUrl =
    place.picture_id && googleKey
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.picture_id}&key=${googleKey}`
      : null;

  const images = useMemo(() => {
    return [
      place.cover_image,
      ...(place.tourist_place_media_assets ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((m) => m.file_url),
      googlePhotoUrl,
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
        sizes="(max-width: 768px) 50vw, 33vw"
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
                  'w-1 h-1 rounded-full transition-all',
                  i === index ? 'bg-white scale-125' : 'bg-white/40'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
