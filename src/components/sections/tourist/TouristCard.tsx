'use client';

import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import { CardImageSlider } from './CardImageSlider';
import type { TouristPlace } from '@/lib/types/touristPlaces';

interface Props {
  place: TouristPlace & { dist: number | null };
}

export function TouristCard({ place }: Props) {
  return (
    <Link
      href={`/tourist/${place.slug ?? place.id}`}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative w-full aspect-[4/3] bg-gray-100">
        <CardImageSlider place={place} />
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5 z-10">
          {place.ad_badge_text && (
            <div className="bg-linear-to-r from-purple-500 to-brand px-2.5 py-1 rounded-full shadow-sm">
              <span className="text-white text-[9px] font-bold whitespace-nowrap">
                {place.ad_badge_text}
              </span>
            </div>
          )}
          <div className="bg-linear-to-r from-purple-500 to-brand px-2.5 py-1 rounded-lg shadow-sm flex items-center justify-center">
            <span className="text-white text-[8px] font-bold whitespace-nowrap text-center">
              {Number(place.price) === 0 ? 'FreeEntry' : `MUR ${place.price}`}
            </span>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3 h-3 fill-orange-500 text-orange-500 shrink-0" />
            <span className="text-[11px] font-bold text-gray-700">
              {place.rating?.toFixed(1) || '5.0'}
            </span>
          </div>
          <span className="w-0.5 h-0.5 rounded-full bg-gray-300 shrink-0" />
          <p className="text-[13px] font-bold text-gray-900 truncate">{place.place_name}</p>
        </div>

        {(place.dist != null || place.full_address || place.area || place.city) && (
          <div className="flex items-center gap-0.5 text-gray-400 mt-1 min-w-0">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="text-[11px] truncate">
              {place.dist != null
                ? `${place.dist < 1 ? `${Math.round(place.dist * 1000)}m` : `${place.dist.toFixed(1)}km`} • ${place.full_address ?? [place.area, place.city].filter(Boolean).join(', ')}`
                : (place.full_address ?? [place.area, place.city].filter(Boolean).join(', '))}
            </span>
          </div>
        )}

        {place.tags && place.tags.length > 0 && (
          <p className="text-[11px] text-gray-400 mt-1 truncate">
            {place.tags.join(' • ')}
          </p>
        )}
      </div>
    </Link>
  );
}
