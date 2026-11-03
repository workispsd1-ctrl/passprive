import { createClient } from '@/lib/supabase/server';
import { isCancelledStatus, numberActivity, sheetProgress, storeCollectsStamps, type StampCardData, type StampSubscription, type StampTier } from '@/lib/stamps';

// ─── Types (mirror the app's restaurants.ts exactly) ─────────────────────────

export type RestaurantFeedRow = {
  id: string;
  name: string;
  area: string | null;
  city: string | null;
  slug: string | null;
  cover_image: string | null;
  cost_for_two: number | null;
  is_pure_veg: boolean | null;
  is_advertised: boolean | null;
  ad_priority: number | null;
  ad_badge_text: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string | null;
  cuisines: string[] | null;
  rating: number | null;
  rating_count: number | null;
  distance_km: number | null;
  food_images: string[] | null;
  ambience_images: string[] | null;
  mood: string[] | null;
  offer_badge: string | null;
  has_offer: boolean | null;
};

export type RepeatRewardTier = {
  id?: string;
  rewardType: string; // 'FREE_ITEM' | 'FLAT' | 'PERCENT'
  visitCount: number;
  rewardLabel?: string | null;
  rewardValue?: number | string | null;
};

export type RestaurantRepeatReward = {
  enabled: boolean;
  visitCount: number; // the logged-in user's paid visits to this restaurant
  tiers: RepeatRewardTier[];
};

// Combined type for the website page — feed row + per-restaurant reward data
export type VisitRewardEntry = {
  id: string;
  name: string;
  slug: string | null;
  area: string | null;
  city: string | null;
  coverImage: string | null;
  cuisines: string[];
  rating: number;
  ratingCount: number;
  costForTwo: number | null;
  distanceKm: number | null;
  isPureVeg: boolean;
  reward: RestaurantRepeatReward;
};

const FEED_PAGE_SIZE = 20;

/**
 * Fetches ALL pages of the repeat-rewards feed then enriches each restaurant
 * with per-user reward data (tiers + visitCount) via restaurant_repeat_reward.
 *
 * KEY: We trust the feed as source of truth — if repeat_rewards_feed returns
 * a restaurant, we ALWAYS show it, even if restaurant_repeat_reward returns
 * enabled=false / tiers=[] (which happens when tiers haven't been configured
 * yet in restaurant_repeat_reward_tiers).
 */
export async function getUserVisitRewards(): Promise<VisitRewardEntry[]> {
  const supabase = await createClient();

  // ── Step 1: drain all pages of the repeat-rewards feed ────────────────────
  // repeat_rewards_feed already filters for repeat_rewards_enabled=true in
  // an active restaurant_subscription — trust it as the authoritative list.
  const allRows: RestaurantFeedRow[] = [];
  let offset = 0;

  while (true) {
    const { data: feedData, error: feedError } = await supabase.rpc('repeat_rewards_feed', {
      in_lat: null,
      in_lng: null,
      in_limit: FEED_PAGE_SIZE,
      in_offset: offset,
    });

    if (feedError) {
      console.error('[visitRewards] repeat_rewards_feed error:', feedError.message);
      break;
    }

    const page = (feedData ?? []) as RestaurantFeedRow[];
    allRows.push(...page);
    if (page.length < FEED_PAGE_SIZE) break;
    offset += FEED_PAGE_SIZE;
  }

  if (allRows.length === 0) return [];

  // ── Step 2: enrich each restaurant with tier + visit-count data ───────────
  // We ALWAYS include the restaurant (feed already validated it belongs here).
  // restaurant_repeat_reward returns enabled=false / tiers=[] when tiers
  // haven't been added to restaurant_repeat_reward_tiers yet — that's fine,
  // we still show the card (tiers section is hidden if empty).
  const enriched = await Promise.allSettled(
    allRows.map(async (row): Promise<VisitRewardEntry> => {
      let reward: RestaurantRepeatReward = { enabled: false, visitCount: 0, tiers: [] };

      const { data: rewardData, error: rewardError } = await supabase.rpc(
        'restaurant_repeat_reward',
        { in_restaurant_id: row.id },
      );

      if (rewardError) {
        console.warn('[visitRewards] restaurant_repeat_reward error for', row.name, ':', rewardError.message);
      } else {
        const rpcRow = Array.isArray(rewardData) ? rewardData[0] : rewardData;
        reward = {
          enabled: !!rpcRow?.enabled,
          visitCount: Number(rpcRow?.visit_count) || 0,
          tiers: Array.isArray(rpcRow?.tiers) ? (rpcRow.tiers as RepeatRewardTier[]) : [],
        };
      }

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        area: row.area,
        city: row.city,
        coverImage: row.cover_image,
        cuisines: Array.isArray(row.cuisines) ? row.cuisines.filter(Boolean) : [],
        rating: row.rating ?? 0,
        ratingCount: row.rating_count ?? 0,
        costForTwo: row.cost_for_two,
        distanceKm: row.distance_km,
        isPureVeg: row.is_pure_veg ?? false,
        reward,
      };
    }),
  );

  return enriched
    .filter((r): r is PromiseFulfilledResult<VisitRewardEntry> => r.status === 'fulfilled')
    .map(r => r.value);
}

const STAMP_RAIL_MAX = 8;

const stampDetailHref = (kind: 'restaurant' | 'store', id: string) => `/visit-rewards/${kind}/${id}`;

type StampStoreRow = {
  id: string; name: string; slug: string | null; category: string | null; city: string | null; location_name: string | null;
  cover_image: string | null; logo_url: string | null; store_type: string | null;
  store_subscriptions: StampSubscription[] | null;
};
const STAMP_STORE_SELECT = 'id, name, slug, category, city, location_name, cover_image, logo_url, store_type, store_subscriptions!inner(status, repeat_rewards_enabled, starts_at, expires_at)';

/** Stores with a live subscription that collects stamps — app parity: storesApi.js repeat_rewards_enabled. */
async function getStampStores(): Promise<StampStoreRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('stores')
    .select(STAMP_STORE_SELECT)
    .eq('is_active', true)
    .eq('store_subscriptions.repeat_rewards_enabled', true);
  return ((data ?? []) as unknown as StampStoreRow[]).filter(row => storeCollectsStamps(row));
}

export type CollectStampsData = { restaurants: StampCardData[]; salons: StampCardData[]; stores: StampCardData[] };

/** The three "Collect at …" rails with the viewer's progress — app parity: CollectStampsScreen.jsx. */
export async function getCollectStamps(): Promise<CollectStampsData> {
  const supabase = await createClient();
  const [{ data: feed }, storeRows] = await Promise.all([
    supabase.rpc('repeat_rewards_feed', { in_lat: null, in_lng: null, in_limit: 15, in_offset: 0 }),
    getStampStores(),
  ]);

  const restaurants = ((feed ?? []) as RestaurantFeedRow[])
    .map(r => ({
      id: r.id,
      name: r.name,
      location: [r.area, r.city].filter(Boolean).join(', '),
      image: r.cover_image || r.food_images?.[0] || r.ambience_images?.[0] || '',
      href: stampDetailHref('restaurant', r.id),
      visits: 0,
    }))
    .filter(card => card.image)
    .slice(0, STAMP_RAIL_MAX);

  const salons: StampCardData[] = [];
  const stores: StampCardData[] = [];
  for (const row of storeRows) {
    const image = row.cover_image || row.logo_url;
    if (!image) continue;
    const isSalon = String(row.store_type ?? '').toUpperCase() === 'SERVICE';
    (isSalon ? salons : stores).push({
      id: row.id,
      name: row.name,
      location: row.city || row.location_name || '',
      image,
      href: stampDetailHref('store', row.id),
      visits: 0,
    });
  }
  const salonCards = salons.slice(0, STAMP_RAIL_MAX);
  const storeCards = stores.slice(0, STAMP_RAIL_MAX);

  const { data: progressRows } = await supabase.rpc('repeat_reward_progress', {
    in_restaurant_ids: restaurants.map(c => c.id),
    in_store_ids: [...salonCards, ...storeCards].map(c => c.id),
  });
  const progress = new Map(
    ((progressRows ?? []) as { entity_id: string; visit_count: number | null; target: number | null }[]).map(p => [String(p.entity_id), p]),
  );
  const withProgress = (cards: StampCardData[]) =>
    cards.map(card => {
      const row = progress.get(card.id);
      return { ...card, visits: Number(row?.visit_count) || 0, target: Number(row?.target) || undefined };
    });

  return { restaurants: withProgress(restaurants), salons: withProgress(salonCards), stores: withProgress(storeCards) };
}

export type StampSheet = StampCardData & { total: number; rewardGoal: StampTier | null; unlocked: boolean };
export type StampSheetsData = { sheets: StampSheet[]; explore: StampCardData[] };

/** The member's own sheets and everywhere else to collect — app parity: CollectStampsScreen `mode: "sheets"`. */
export async function getStampSheets(): Promise<StampSheetsData> {
  const supabase = await createClient();
  const [{ data: feed }, storeRows] = await Promise.all([
    supabase.rpc('repeat_rewards_feed', { in_lat: null, in_lng: null, in_limit: 15, in_offset: 0 }),
    getStampStores(),
  ]);

  const places = [
    ...((feed ?? []) as RestaurantFeedRow[]).map(r => ({
      kind: 'restaurant' as const,
      id: r.id,
      name: r.name,
      location: [r.area, r.city].filter(Boolean).join(', '),
      image: r.cover_image || r.food_images?.[0] || r.ambience_images?.[0] || '',
      href: stampDetailHref('restaurant', r.id),
    })),
    ...storeRows.map(s => ({
      kind: 'store' as const,
      id: s.id,
      name: s.name,
      location: s.city || s.location_name || '',
      image: s.cover_image || s.logo_url || '',
      href: stampDetailHref('store', s.id),
    })),
  ].filter(place => place.image);

  const rewards = await Promise.all(
    places.map(place =>
      place.kind === 'store'
        ? supabase.rpc('store_repeat_reward', { in_store_id: place.id })
        : supabase.rpc('restaurant_repeat_reward', { in_restaurant_id: place.id }),
    ),
  );

  const sheets: StampSheet[] = [];
  const explore: StampCardData[] = [];
  places.forEach((place, i) => {
    const raw = rewards[i].data;
    const row = (Array.isArray(raw) ? raw[0] : raw) as { enabled?: boolean; visit_count?: number; tiers?: StampTier[] } | null;
    const tiers = Array.isArray(row?.tiers) ? row.tiers : [];
    const progress = sheetProgress({ visitCount: row?.visit_count, tiers });
    const target = progress.total || 7;
    const visits = Math.min(Number(row?.visit_count) || 0, target);
    const card = { id: `${place.kind}:${place.id}`, name: place.name, location: place.location, image: place.image, href: place.href, visits, target };
    if (row?.enabled && visits > 0) {
      sheets.push({ ...card, total: target, rewardGoal: progress.goal, unlocked: progress.unlocked });
    } else {
      explore.push(card);
    }
  });
  return { sheets, explore };
}

export type StampDetail = {
  kind: 'restaurant' | 'store';
  name: string;
  image: string | null;
  subtitle: string;
  ctaHref: string;
  isService: boolean;
  enabled: boolean;
  visitCount: number;
  tiers: StampTier[];
  activity: { id: string; date: string; stampNumber: number }[];
};

/** One venue's stamp card — app parity: screens/StampDetailScreen.jsx. */
export async function getStampDetail(kind: string, id: string): Promise<StampDetail | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (kind === 'store') {
    const { data: store } = await supabase.from('stores').select('id, name, slug, category, city, location_name, cover_image, logo_url, store_type').eq('id', id).maybeSingle();
    if (!store) return null;
    const { data: raw } = await supabase.rpc('store_repeat_reward', { in_store_id: id });
    const row = Array.isArray(raw) ? raw[0] : raw;
    const { data: orders } = user
      ? await supabase.from('store_orders').select('id, slot_start_at, created_at').eq('customer_user_id', user.id).eq('store_id', id).eq('status', 'DELIVERED').order('slot_start_at', { ascending: true })
      : { data: [] };
    const isService = String(store.store_type ?? '').toUpperCase() === 'SERVICE';
    return {
      kind: 'store',
      name: store.name,
      image: store.cover_image || store.logo_url,
      subtitle: [store.category || store.store_type, store.city || store.location_name].filter(Boolean).join(' • '),
      ctaHref: `/${isService ? 'wellness' : 'stores'}/${store.slug ?? store.id}`,
      isService,
      enabled: !!row?.enabled,
      visitCount: Number(row?.visit_count) || 0,
      tiers: Array.isArray(row?.tiers) ? row.tiers : [],
      activity: numberActivity((orders ?? []).map(o => ({ id: String(o.id), date: String(o.slot_start_at || o.created_at) }))),
    };
  }

  if (kind !== 'restaurant') return null;
  const { data: restaurant } = await supabase.from('restaurants').select('id, name, slug, area, city, cover_image, restaurant_tags(tag_type, tag_value)').eq('id', id).maybeSingle();
  if (!restaurant) return null;
  const { data: raw } = await supabase.rpc('restaurant_repeat_reward', { in_restaurant_id: id });
  const row = Array.isArray(raw) ? raw[0] : raw;
  const { data: bookings } = user
    ? await supabase.from('restaurant_bookings').select('id, booking_date, status, created_at').eq('customer_user_id', user.id).eq('restaurant_id', id).order('booking_date', { ascending: true }).order('booking_time', { ascending: true })
    : { data: [] };
  const cuisines = ((restaurant.restaurant_tags ?? []) as { tag_type: string; tag_value: string }[]).filter(t => t.tag_type === 'cuisine').map(t => t.tag_value);
  return {
    kind: 'restaurant',
    name: restaurant.name,
    image: restaurant.cover_image,
    subtitle: [cuisines.join(', '), [restaurant.area, restaurant.city].filter(Boolean).join(', ')].filter(Boolean).join(' • '),
    ctaHref: `/dining/${restaurant.slug ?? restaurant.id}`,
    isService: false,
    enabled: !!row?.enabled,
    visitCount: Number(row?.visit_count) || 0,
    tiers: Array.isArray(row?.tiers) ? row.tiers : [],
    activity: numberActivity(
      (bookings ?? [])
        .filter(b => !isCancelledStatus(b.status))
        .map(b => ({ id: String(b.id), date: String(b.booking_date || b.created_at) })),
    ),
  };
}
