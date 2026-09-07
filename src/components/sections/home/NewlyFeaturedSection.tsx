'use client';

import { useMemo } from 'react';
import { useLocation } from '@/lib/context/LocationContext';
import { formatDistanceKm, haversineKm, sortByMerchant } from '@/lib/utils';
import { showsCashbackBadge } from '@/lib/cashback';
import { HScroll } from './HScroll';
import { CARD_FRAME_COLORS, MerchantCard } from './MerchantCard';
import type { FeaturedRestaurant } from '@/lib/types/dining';
import type { StoreRow } from '@/lib/types/stores';

const MAX_CARDS = 10;

type FeedCard = {
  key: string;
  href: string;
  image: string | null;
  name: string;
  address: string;
  tagline?: string;
  offerLabel?: string;
  merchant_type: 'preferred' | 'verified' | null;
  cashback: boolean;
  city: string | null;
  lat: number | null;
  lng: number | null;
};

function restaurantToCard(r: FeaturedRestaurant): FeedCard {
  return {
    key: `r-${r.id}`,
    href: `/dining/${r.slug ?? r.id}`,
    image: r.cover_image,
    name: r.name,
    address:
      r.full_address ?? [r.area, r.city].filter(Boolean).join(', '),
    tagline: r.description ?? undefined,
    offerLabel: r.restaurant_offers?.[0]?.badge_text ?? undefined,
    merchant_type: r.merchant_type,
    cashback: showsCashbackBadge(r),
    city: r.city,
    lat: r.latitude,
    lng: r.longitude,
  };
}

function storeToCard(s: StoreRow): FeedCard {
  return {
    key: `s-${s.id}`,
    href: `/stores/${s.slug}`,
    image: s.cover_image ?? s.logo_url,
    name: s.name,
    address: [s.location_name, s.city].filter(Boolean).join(', '),
    tagline: s.description ?? undefined,
    offerLabel: s.store_offers?.[0]?.badge_text ?? undefined,
    merchant_type: s.merchant_type,
    cashback: showsCashbackBadge(s),
    city: s.city,
    lat: s.lat,
    lng: s.lng,
  };
}

/**
 * "In the limelight" — mirrors the app's `loadLimelight`
 * (`components/Home/InTheLimelight.jsx`): nearby restaurants and stores are
 * interleaved, then stably re-sorted by merchant tier (preferred → verified →
 * rest) and capped. Radius scoping is skipped — SSR has no user GPS — so this
 * falls back to a same-city bias. Distance is computed on the client from the
 * LocationContext coords (GPS or the selected city's centroid).
 */
export function NewlyFeaturedSection({
  restaurants,
  stores = [],
}: {
  restaurants: FeaturedRestaurant[];
  stores?: StoreRow[];
}) {
  const { location } = useLocation();
  const userCity = location.city.trim().toLowerCase();
  const { lat: userLat, lng: userLng } = location;

  const cards = useMemo(() => {
    const r = restaurants.map(restaurantToCard);
    const s = stores.map(storeToCard);

    // interleave restaurant, store, restaurant, store, …
    const mixed: FeedCard[] = [];
    for (let i = 0; i < Math.max(r.length, s.length); i++) {
      if (i < r.length) mixed.push(r[i]);
      if (i < s.length) mixed.push(s[i]);
    }

    // same-city first (stable), then merchant tier (stable)
    const cityBias = [...mixed].sort((a, b) => {
      const am = (a.city ?? '').trim().toLowerCase() === userCity ? 0 : 1;
      const bm = (b.city ?? '').trim().toLowerCase() === userCity ? 0 : 1;
      return am - bm;
    });

    return sortByMerchant(cityBias).slice(0, MAX_CARDS);
  }, [restaurants, stores, userCity]);

  if (!cards.length) return null;

  return (
    <HScroll title="In the limelight">
      {cards.map((card, i) => {
        const dist =
          userLat != null && userLng != null && card.lat != null && card.lng != null
            ? haversineKm(userLat, userLng, card.lat, card.lng)
            : null;
        const meta = [formatDistanceKm(dist), card.address]
          .filter(Boolean)
          .join(' • ');

        return (
          <MerchantCard
            key={card.key}
            href={card.href}
            image={card.image}
            name={card.name}
            meta={meta || undefined}
            tagline={card.tagline}
            offerLabel={card.offerLabel}
            frameColor={CARD_FRAME_COLORS[i % CARD_FRAME_COLORS.length]}
            // App parity: getEntityCashbackBadge — canPayBill && isPaidMerchant
            cashback={card.cashback}
          />
        );
      })}
    </HScroll>
  );
}
