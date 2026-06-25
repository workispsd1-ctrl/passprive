'use client';

import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DistanceOption {
  label: string;
  km: number;
}

interface Props {
  distanceKm: number | null;
  setDistanceKm: (d: number | null) => void;
  showDistanceOptions: boolean;
  setShowDistanceOptions: (show: boolean | ((prev: boolean) => boolean)) => void;
  activeTag: string | null;
  setActiveTag: (t: string | null) => void;
  allTags: string[];
  distanceOptions: DistanceOption[];
}

export function TouristFilters({
  distanceKm,
  setDistanceKm,
  showDistanceOptions,
  setShowDistanceOptions,
  activeTag,
  setActiveTag,
  allTags,
  distanceOptions,
}: Props) {
  const activeDistLabel = distanceOptions.find((o) => o.km === distanceKm)?.label;

  return (
    <div className="relative mb-3">
      {/* Single scrollable row — Filters button + category/tag pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1 md:mx-0 md:px-0 md:flex-wrap">
        <button
          type="button"
          onClick={() => setShowDistanceOptions((v) => !v)}
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

        {allTags.map((tag) => (
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
            onClick={() => {
              setDistanceKm(null);
              setShowDistanceOptions(false);
            }}
            className={cn(
              'w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50',
              distanceKm == null && 'text-brand font-semibold'
            )}
          >
            All distances
          </button>
          {distanceOptions.map((opt) => (
            <button
              key={opt.km}
              type="button"
              onClick={() => {
                setDistanceKm(opt.km);
                setShowDistanceOptions(false);
              }}
              className={cn(
                'w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50',
                distanceKm === opt.km && 'text-brand font-semibold'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
