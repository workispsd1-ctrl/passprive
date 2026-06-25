'use client';

import { Star, BadgeCheck } from 'lucide-react';
import { HoursPopover } from '@/components/sections/dining/HoursPopover';
import type { TouristPlace, TouristPlaceHours } from '@/lib/types/touristPlaces';

interface Props {
  place: TouristPlace;
  reviewAvg: number;
  todayHours: TouristPlaceHours | null;
  allHours: TouristPlaceHours[];
}

function getOpenStatus(hours: TouristPlaceHours | null) {
  if (!hours) return null;
  if (hours.is_closed || !hours.open_time || !hours.close_time)
    return { isOpen: false, statusText: 'Closed today', label: null };
  const now = new Date();
  const [oh, om] = hours.open_time.split(':').map(Number);
  const [ch, cm] = hours.close_time.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;
  const isOpen =
    closeMins > openMins
      ? nowMins >= openMins && nowMins < closeMins
      : nowMins >= openMins || nowMins < closeMins;
  const fmt = (h: number, m: number) =>
    `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  return {
    isOpen,
    statusText: isOpen ? `Open until ${fmt(ch, cm)}` : `Opens at ${fmt(oh, om)}`,
    label: null,
  };
}

export function TouristHeader({ place, reviewAvg, todayHours, allHours }: Props) {
  const status = getOpenStatus(todayHours);

  return (
    <div className="mt-4 md:mt-0">
      <div className="flex items-start gap-2 flex-wrap">
        <h1 className="text-[28px] md:text-[36px] font-bold text-gray-900 leading-tight">
          {place.place_name}
        </h1>
        {place.booking_enabled && (
          <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 border border-green-200 text-[11px] font-semibold text-green-700 mt-1.5">
            <BadgeCheck className="w-3 h-3" /> Bookable Spot
          </span>
        )}
        {place.ad_badge_text && (
          <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand/10 border border-brand/20 text-[11px] font-semibold text-brand mt-1.5">
            {place.ad_badge_text}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-[14px]">
        {reviewAvg > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand text-white text-[13px] font-bold">
            {reviewAvg}
            <Star className="w-3 h-3 fill-white" />
          </span>
        )}
        <span className="text-gray-300 font-light">|</span>
        <span className="text-gray-800 font-medium">
          {Number(place.price) === 0 ? 'Free' : `MUR ${place.price} per person`}
        </span>
        {status && (
          <>
            <span className="text-gray-300 font-light">|</span>
            <span className={status.isOpen ? 'text-green-600 font-semibold' : 'text-orange-500 font-semibold'}>
              {status.isOpen ? 'Open' : 'Closed'}
            </span>
            <span className="text-gray-400">•</span>
            <HoursPopover
              todayHours={todayHours}
              allHours={allHours}
              statusText={status.statusText}
              isOpen={status.isOpen}
            />
          </>
        )}
      </div>
    </div>
  );
}
