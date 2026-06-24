'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tag, SlidersHorizontal, MapPin, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from '@/lib/context/LocationContext';
import type { TouristPlace } from '@/lib/types/touristPlaces';

interface Props {
  places: TouristPlace[];
}

const DISTANCE_OPTIONS = [
  { label: 'Under 5 km', km: 5 },
  { label: 'Under 10 km', km: 10 },
  { label: 'Under 25 km', km: 25 },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
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

export function TouristPlacesPageClient({ places }: Props) {
  const { location } = useLocation();
  const userCoords = useMemo(
    () => location.lat != null && location.lng != null
      ? { lat: location.lat, lng: location.lng }
      : null,
    [location.lat, location.lng]
  );

  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [showDistanceOptions, setShowDistanceOptions] = useState(false);

  // Extract unique tags from all tourist places
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    places.forEach(p => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach(t => {
          if (t) tagsSet.add(t.trim());
        });
      }
    });
    return Array.from(tagsSet);
  }, [places]);

  const placesWithDist = useMemo(() =>
    places.map(p => ({
      ...p,
      dist: userCoords && p.latitude != null && p.longitude != null
        ? haversineKm(userCoords.lat, userCoords.lng, Number(p.latitude), Number(p.longitude))
        : null,
    })),
    [places, userCoords]
  );

  const filtered = useMemo(() => {
    let result = placesWithDist;

    if (activeTag) {
      result = result.filter(p => p.tags.includes(activeTag));
    }

    if (distanceKm != null) {
      result = result.filter(p => p.dist != null && p.dist <= distanceKm);
    }

    if (userCoords) {
      result = [...result].sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));
    }

    return result;
  }, [placesWithDist, activeTag, distanceKm, userCoords]);

  const activeDistLabel = DISTANCE_OPTIONS.find(o => o.km === distanceKm)?.label;
  const isFiltered = activeTag != null || distanceKm != null;

  return (
    <section className="px-4 py-5 md:px-6 max-w-7xl mx-auto">
      <h1 className="text-[20px] md:text-[24px] font-bold text-gray-900 mb-4">Tourist Attractions</h1>

      <div className="relative mb-3">
        {/* Single scrollable row — Filters button + category/tag pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1 md:mx-0 md:px-0 md:flex-wrap">
          <button
            type="button"
            onClick={() => setShowDistanceOptions(v => !v)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold border transition-colors whitespace-nowrap',
              distanceKm != null
                ? 'bg-brand text-white border-brand'
                : 'bg-white text-gray-700 border-gray-300 hover:border-brand hover:text-brand'
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {activeDistLabel ?? 'Filters'}
            <span className="text-[10px]">▾</span>
          </button>

          {allTags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={cn(
                'shrink-0 px-3.5 py-2 rounded-full text-[12px] font-semibold border transition-colors whitespace-nowrap',
                tag === activeTag
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-brand hover:text-brand'
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Dropdown for distance options */}
        {showDistanceOptions && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 min-w-35 py-1">
            <button
              type="button"
              onClick={() => { setDistanceKm(null); setShowDistanceOptions(false); }}
              className={cn('w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50', distanceKm == null && 'text-brand font-semibold')}
            >
              All distances
            </button>
            {DISTANCE_OPTIONS.map(opt => (
              <button
                key={opt.km}
                type="button"
                onClick={() => { setDistanceKm(opt.km); setShowDistanceOptions(false); }}
                className={cn('w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50', distanceKm === opt.km && 'text-brand font-semibold')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isFiltered && (
        <p className="text-[12px] text-gray-400 mb-3">{filtered.length} place{filtered.length !== 1 ? 's' : ''} found</p>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200 mt-4">
          <p className="text-[13px] text-gray-400">No tourist attractions match your active filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-4">
          {filtered.map(place => (
            <Link
              key={place.id}
              href={`/tourist/${place.slug ?? place.id}`}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative w-full aspect-[4/3] bg-gray-100">
                <CardImageSlider place={place} />
                {place.ad_badge_text && (
                  <div className="absolute top-2.5 left-2.5 bg-brand/90 backdrop-blur-sm px-2 py-1 rounded-lg z-10">
                    <span className="text-white text-[9px] font-bold">
                      {place.ad_badge_text}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-2.5">
                <p className="text-[12px] font-bold text-gray-900 truncate">{place.place_name}</p>
                {place.tags && place.tags.length > 0 && (
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                    {place.tags.join(' · ')}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="text-[10px] font-semibold text-gray-700">
                      {place.rating?.toFixed(1) || '5.0'}
                    </span>
                  </div>
                  <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                  <div className="flex items-center gap-0.5 text-gray-400">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    <span className="text-[10px] truncate max-w-20">
                      {place.dist != null
                        ? `${place.dist < 1 ? `${Math.round(place.dist * 1000)}m` : `${place.dist.toFixed(1)}km`}`
                        : (place.area ?? place.city ?? '')}
                    </span>
                  </div>
                  <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                  <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
                    {Number(place.price) === 0 ? 'Free' : `MUR ${place.price}`}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
