'use client';

import { Navigation, Share2, Phone } from 'lucide-react';

interface Props {
  phone?: string | null;
}

export function TouristActions({ phone }: Props) {
  return (
    <div className="flex flex-wrap gap-3 mt-5">
      <button
        type="button"
        className="flex items-center gap-2 px-7 py-3 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-800 hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors"
      >
        <Navigation className="w-4 h-4" /> Direction
      </button>
      <button
        type="button"
        className="flex items-center gap-2 px-7 py-3 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-800 hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors"
      >
        <Share2 className="w-4 h-4" /> Share
      </button>
      {phone && (
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-2 px-7 py-3 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-800 hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors"
        >
          <Phone className="w-4 h-4" /> Call
        </a>
      )}
    </div>
  );
}
