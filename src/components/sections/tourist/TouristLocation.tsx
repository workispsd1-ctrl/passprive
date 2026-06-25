'use client';

import { Navigation } from 'lucide-react';
import type { TouristPlace } from '@/lib/types/touristPlaces';

interface Props {
  place: TouristPlace;
}

export function TouristLocation({ place }: Props) {
  const address = place.full_address ?? `${place.area}, ${place.city}`;

  if (!place.full_address && !place.area) return null;

  return (
    <section className="mt-8 border-t border-gray-200 pt-6 pb-8">
      <h2 className="text-[18px] font-bold text-gray-900 mb-4">Location</h2>

      <div className="border border-gray-200 rounded-2xl hover:border-brand/30 transition-colors">
        <div className="w-full h-52 rounded-t-2xl overflow-hidden mb-4 bg-gray-100">
          {place.latitude && place.longitude ? (
            <iframe
              title="Attraction location"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(place.longitude) - 0.006},${Number(place.latitude) - 0.004},${Number(place.longitude) + 0.006},${Number(place.latitude) + 0.004}&layer=mapnik&marker=${place.latitude},${place.longitude}`}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <p className="text-[13px] text-gray-400">Map not available</p>
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <p className="font-bold text-gray-900">{place.place_name}</p>
          <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{address}</p>
          <a
            href={
              place.latitude && place.longitude
                ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
                : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2.5 text-[12px] font-semibold text-brand hover:underline"
          >
            <Navigation className="w-3.5 h-3.5" /> Get Directions
          </a>
        </div>
      </div>
    </section>
  );
}
