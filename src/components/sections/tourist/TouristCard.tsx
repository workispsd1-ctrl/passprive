'use client';

import Link from 'next/link';
import { Star, MapPin, Ticket } from 'lucide-react';
import { CardImageSlider } from './CardImageSlider';
import type { TouristPlace } from '@/lib/types/touristPlaces';

interface Props {
  place: TouristPlace & { dist: number | null };
}

export function TouristCard({ place }: Props) {
  const isFree = Number(place.price) === 0;

  return (
    <Link
      href={`/tourist/${place.slug ?? place.id}`}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/3] bg-gray-100">
        <CardImageSlider place={place} />

        {/* Ad badge – top left */}
        {place.ad_badge_text && (
          <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-purple-500 to-brand px-2.5 py-1 rounded-full shadow-sm z-10">
            <span className="text-white text-[9px] font-bold whitespace-nowrap">
              {place.ad_badge_text}
            </span>
          </div>
        )}

        {/* Price banner – bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 bg-brand/90 backdrop-blur-sm px-3 py-1.5 flex items-center gap-1.5 z-10">
          <Ticket className="w-3 h-3 text-white shrink-0" />
          <span className="text-white text-[11px] font-semibold truncate">
            {isFree ? 'Free Entry' : `MUR ${place.price}`}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Name + rating */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-[14px] font-bold text-gray-900 truncate flex-1">
            {place.place_name}
          </p>
          <div className="flex items-center gap-0.5 shrink-0 bg-orange-50 px-1.5 py-0.5 rounded-full">
            <Star className="w-3 h-3 fill-orange-500 text-orange-500 shrink-0" />
            <span className="text-[11px] font-bold text-orange-600">
              {place.rating?.toFixed(1) || '5.0'}
            </span>
          </div>
        </div>

        {/* Location */}
        {(place.dist != null || place.full_address || place.area || place.city) && (
          <div className="flex items-center gap-0.5 text-gray-400 mt-0.5 min-w-0">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="text-[11px] truncate">
              {place.dist != null
                ? `${place.dist < 1 ? `${Math.round(place.dist * 1000)}m` : `${place.dist.toFixed(1)}km`} • ${place.full_address ?? [place.area, place.city].filter(Boolean).join(', ')}`
                : (place.full_address ?? [place.area, place.city].filter(Boolean).join(', '))}
            </span>
          </div>
        )}

        {/* Tags */}
        {place.tags && place.tags.length > 0 && (
          <p className="text-[11px] text-gray-400 mt-1 truncate">
            {place.tags.join(' • ')}
          </p>
        )}
      </div>
    </Link>
  );
}
