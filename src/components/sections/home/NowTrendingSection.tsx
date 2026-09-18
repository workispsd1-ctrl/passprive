'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import { useLocation } from '@/lib/context/LocationContext';
import { haversineKm, merchantRank } from '@/lib/utils';
import { HScroll } from './HScroll';

// App parity: components/Home/NowTrending.jsx (real title "Now trending";
// renamed to "Foodie front row" for the home page's Figma design — the
// dining page passes the app's real title back in via the `title` prop).
const MAX_CARDS = 12;

// orange → blue translucent ring behind each avatar
const RING =
  'linear-gradient(253.56deg, rgba(255,72,0,0.29) 9.31%, rgba(0,68,255,0.29) 99.66%)';

// Structural rather than `Restaurant` — shared by the home page's plain
// `getActiveRestaurants()` rows and the dining page's `restaurant_feed` RPC
// rows, which only overlap on these fields.
type TrendingCardItem = {
  id: string;
  name: string;
  slug: string | null;
  cover_image: string | null;
  area: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  merchant_type?: string | null;
};

export function NowTrendingSection({
  restaurants,
  title = 'Foodie front row',
}: {
  restaurants: TrendingCardItem[];
  title?: string;
}) {
  const { location } = useLocation();
  const userCity = location.city.trim().toLowerCase();
  const { lat: userLat, lng: userLng } = location;

  const items = useMemo(() => {
    const withDist = restaurants
      .filter((r) => r.cover_image)
      .map((r) => {
        const dist =
          userLat != null &&
          userLng != null &&
          r.latitude != null &&
          r.longitude != null
            ? haversineKm(userLat, userLng, r.latitude, r.longitude)
            : null;
        return { r, dist };
      });

    // merchant tier → distance → same-city bias (stable within each key).
    // The app also weights has-offer / rating, which the listing query here
    // doesn't return.
    withDist.sort((a, b) => {
      const tier = merchantRank(a.r) - merchantRank(b.r);
      if (tier !== 0) return tier;

      const da = a.dist ?? Number.POSITIVE_INFINITY;
      const db = b.dist ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;

      const ac = (a.r.city ?? '').trim().toLowerCase() === userCity ? 0 : 1;
      const bc = (b.r.city ?? '').trim().toLowerCase() === userCity ? 0 : 1;
      return ac - bc;
    });

    return withDist.slice(0, MAX_CARDS);
  }, [restaurants, userCity, userLat, userLng]);

  if (!items.length) return null;

  return (
    <HScroll title={title}>
      {items.map(({ r }) => (
        <Link
          key={r.id}
          href={`/dining/${r.slug ?? r.id}`}
          className="flex w-52 shrink-0 flex-col items-center text-center 2xl:w-72"
        >
          <div className="relative aspect-square w-full">
            {/* Two same-size circles (spec: 288×288). The gradient one is
                nudged down 9px so it shows only as a crescent below the photo. */}
            <div
              className="absolute inset-0 translate-y-1.5 rounded-full 2xl:translate-y-2.25"
              style={{ background: RING }}
            />
            <div className="absolute inset-0 overflow-hidden rounded-full bg-gray-100">
              {r.cover_image && (
                <Image
                  src={r.cover_image}
                  alt={r.name}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1536px) 288px, 208px"
                />
              )}
            </div>
          </div>
          {/* DM Sans 700 / 18 / 100% — #0D141C */}
          <p className="mt-4 w-full truncate text-sm font-bold leading-none text-[#0D141C] 2xl:mt-6">
            {r.name}
          </p>
          {/* DM Sans 500 — #717171 */}
          <p className="mt-1.5 w-full truncate text-xs font-medium leading-none text-[#717171]">
            {r.area ?? r.city}
          </p>
        </Link>
      ))}
    </HScroll>
  );
}
