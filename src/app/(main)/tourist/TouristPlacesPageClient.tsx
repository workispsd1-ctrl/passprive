'use client';

import { useState, useMemo } from 'react';
import { useLocation } from '@/lib/context/LocationContext';
import { TouristHero } from '@/components/sections/tourist/TouristHero';
import { TouristFilters } from '@/components/sections/tourist/TouristFilters';
import { TouristCard } from '@/components/sections/tourist/TouristCard';
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

export function TouristPlacesPageClient({ places }: Props) {
  const { location } = useLocation();
  const userCoords = useMemo(
    () =>
      location.lat != null && location.lng != null
        ? { lat: location.lat, lng: location.lng }
        : null,
    [location.lat, location.lng]
  );

  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [showDistanceOptions, setShowDistanceOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique tags from all tourist places
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    places.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => {
          if (t) tagsSet.add(t.trim());
        });
      }
    });
    return Array.from(tagsSet);
  }, [places]);

  const placesWithDist = useMemo(
    () =>
      places.map((p) => ({
        ...p,
        dist:
          userCoords && p.latitude != null && p.longitude != null
            ? haversineKm(userCoords.lat, userCoords.lng, Number(p.latitude), Number(p.longitude))
            : null,
      })),
    [places, userCoords]
  );

  const filtered = useMemo(() => {
    let result = placesWithDist;

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.place_name.toLowerCase().includes(q) ||
          (p.area ?? '').toLowerCase().includes(q) ||
          (p.city ?? '').toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (activeTag) {
      result = result.filter((p) => p.tags.includes(activeTag));
    }

    if (distanceKm != null) {
      result = result.filter((p) => p.dist != null && p.dist <= distanceKm);
    }

    if (userCoords) {
      result = [...result].sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));
    }

    return result;
  }, [placesWithDist, searchQuery, activeTag, distanceKm, userCoords]);

  const isFiltered = activeTag != null || distanceKm != null || searchQuery.trim().length > 0;
  const freeEntryCount = places.filter((p) => Number(p.price) === 0).length;

  return (
    <section className="px-4 py-5 md:px-6 max-w-7xl mx-auto">
      <TouristHero
        totalPlaces={places.length}
        freeEntryCount={freeEntryCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <h2 className="text-[20px] md:text-[24px] font-bold text-gray-900 mb-4">Tourist Attractions</h2>

      <TouristFilters
        distanceKm={distanceKm}
        setDistanceKm={setDistanceKm}
        showDistanceOptions={showDistanceOptions}
        setShowDistanceOptions={setShowDistanceOptions}
        activeTag={activeTag}
        setActiveTag={setActiveTag}
        allTags={allTags}
        distanceOptions={DISTANCE_OPTIONS}
      />

      {isFiltered && (
        <p className="text-[12px] text-gray-400 mb-3">
          {filtered.length} place{filtered.length !== 1 ? 's' : ''} found
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200 mt-4">
          <p className="text-[13px] text-gray-400">No tourist attractions match your active filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-4">
          {filtered.map((place) => (
            <TouristCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </section>
  );
}
