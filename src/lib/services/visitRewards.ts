import { createClient } from '@/lib/supabase/server';

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
