'use client';

import Image from 'next/image';
import { Search } from 'lucide-react';

interface Props {
  totalPlaces: number;
  freeEntryCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function TouristHero({ totalPlaces, freeEntryCount, searchQuery, setSearchQuery }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl px-6 py-12 md:px-14 md:py-20 mb-6">
      <Image
        src="/tourist-beach-hero.jpg"
        alt="Tropical beach in Mauritius"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-linear-to-r from-cyan-950/65 via-cyan-900/30 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-cyan-950/45 via-transparent to-transparent" />

      <div className="relative z-10 max-w-2xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm text-white text-[11px] font-semibold uppercase tracking-wide">
          Your Pass to the Island&rsquo;s Best
        </span>

        <h1 className="text-[26px] md:text-[40px] font-bold text-white leading-tight drop-shadow-sm mt-3">
          Explore Mauritius&rsquo;s{' '}
          <span className="text-purple-300 drop-shadow-sm">
            best attractions
          </span>
        </h1>
        <p className="text-white/85 text-[13px] md:text-[15px] mt-2 drop-shadow-sm">
          Find beaches, parks &amp; experiences, and book tickets — skip the queue with PassPrivé.
        </p>

        <div className="flex items-center bg-white rounded-full overflow-hidden h-12 md:h-14 pr-1.5 pl-4 shadow-lg mt-6 ring-2 ring-transparent focus-within:ring-white/60 transition-shadow">
          <Search className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search attractions, beaches, parks..."
            aria-label="Search tourist attractions"
            className="flex-1 px-3 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-500 font-medium h-full"
            autoComplete="off"
          />
          <span className="hidden sm:flex w-9 h-9 md:w-11 md:h-11 rounded-full bg-brand items-center justify-center shrink-0">
            <Search className="w-4 h-4 text-white" aria-hidden="true" />
          </span>
        </div>

        <div className="flex items-center gap-4 mt-4 text-white/90 text-[12px] md:text-[13px] font-medium">
          <span>
            {totalPlaces} attraction{totalPlaces !== 1 ? 's' : ''}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span>{freeEntryCount} free entry</span>
        </div>
      </div>
    </div>
  );
}
