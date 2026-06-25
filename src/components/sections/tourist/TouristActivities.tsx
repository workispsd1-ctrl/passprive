'use client';

import type { TouristPlaceActivity } from '@/lib/types/touristPlaces';

interface Props {
  activities: TouristPlaceActivity[];
}

export function TouristActivities({ activities }: Props) {
  if (activities.length === 0) return null;

  return (
    <section className="mt-8 border-t border-gray-100 pt-6">
      <h2 className="text-[22px] font-bold text-gray-900 mb-4">Activities &amp; Tours</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="border border-gray-200 rounded-2xl p-4 bg-gray-50 flex flex-col justify-between hover:border-brand hover:shadow-sm transition-all"
          >
            <div>
              <p className="text-[15px] font-bold text-gray-900 capitalize">
                {activity.activity_type.replace(/_/g, ' ')}
              </p>
              {activity.child_special_offer && (
                <p className="text-[11px] text-brand font-semibold mt-1 bg-brand/5 px-2 py-0.5 rounded w-fit">
                  {activity.child_special_offer}
                </p>
              )}
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-gray-200/60 pt-3">
              <div>
                <p className="text-[12px] text-gray-400">Adult Price</p>
                <p className="text-[15px] font-bold text-gray-900">MUR {activity.price_adult}</p>
              </div>
              {activity.price_child !== null && (
                <div>
                  <p className="text-[12px] text-gray-400 text-right">Child Price</p>
                  <p className="text-[15px] font-bold text-gray-900 text-right">MUR {activity.price_child}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
