import type { ReviewRow } from '@/lib/allReviews';
import { orderableItems, type OrderItem } from '@/lib/orderCollect';
import { createClient } from '@/lib/supabase/server';
import { FEED_PAGE_SIZE, toRpcArgs, type Coords, type FeedFilters } from '@/lib/restaurantFilters';
import { scopeToRadius, withinRadius } from '@/lib/nearby';
import type {
  Restaurant,
  DiningOffer,
  RestaurantTag,
  Review,
  ReviewSummary,
  RestaurantDetail,
  FeaturedRestaurant,
  RestaurantHours,
  MoodCategory,
} from '@/lib/types/dining';

const SELECT_FIELDS =
  'id, name, slug, description, area, city, full_address, cover_image, cost_for_two, phone, is_pure_veg, booking_enabled, menu_json, latitude, longitude, is_advertised, ad_priority, merchant_type, merchant_plan, pay_bill_enabled, service_level, on_boarded, cashback_enabled, is_promoted, cover_charge_enabled, cover_charge_amount, max_bookings_per_slot';

/**
 * Newest restaurants via the `restaurant_feed` RPC — app parity:
 * services/restaurants.ts → fetchRestaurantFeedPage/mapFeedRowToRestaurant.
 * Used over the plain `restaurants` table select because it's the only
 * public source for the pre-aggregated rating and mood tags the cards need.
 */
export async function getNewRestaurants(
  limit = 8,
  coords?: Coords | null,
): Promise<FeaturedRestaurant[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('restaurant_feed', {
    in_lat: coords?.lat ?? null,
    in_lng: coords?.lng ?? null,
    in_limit: coords ? Math.max(limit, 30) : limit,
    in_offset: 0,
    in_sort: coords ? 'distance' : 'newest',
  });
  const rows = (data ?? []) as FeaturedRestaurant[];
  return coords ? nearbyOrAll(rows).slice(0, limit) : rows;
}

/**
 * Restaurants with a live offer, best rated first — the "Offers You'll love"
 * rail. Asked of the feed RPC directly (in_has_offer) rather than filtered out
 * of the newest few, which rarely held one and left the rail empty.
 */
export async function getOfferRestaurants(limit = 10): Promise<FeaturedRestaurant[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('restaurant_feed', {
    in_lat: null,
    in_lng: null,
    in_limit: limit,
    in_offset: 0,
    in_sort: 'rating_desc',
    in_has_offer: true,
  });
  return (data ?? []) as FeaturedRestaurant[];
}

/** Curated rails: only restaurants within the shared 3–5 km radius (lib/nearby). */
export function nearbyOrAll(rows: FeaturedRestaurant[]): FeaturedRestaurant[] {
  return scopeToRadius(rows, (r) => r.distance_km, true);
}

/**
 * One page of the filtered "All restaurants" feed — app parity:
 * fetchRestaurantFeedPage. `instant` has no RPC param, so (like the app) it
 * fetches bookable restaurants and trims client-side.
 */
// Enough to hold every restaurant within MAX_NEARBY_KM on the island.
const NEARBY_FEED_FETCH = 200;

/**
 * `nearbyOnly` (home-screen use) keeps only restaurants within the shared
 * 3–5 km radius when a location is known. The radius can only be applied to
 * the full result set, so it fetches one large batch in the requested sort
 * order, trims it, then pages through it locally. `radiusKm` (results pages)
 * keeps everything inside that fixed radius instead of the 3 → 5 km widening.
 */
export async function getRestaurantFeed(
  filters: FeedFilters,
  offset = 0,
  limit = FEED_PAGE_SIZE,
  coords?: Coords | null,
  { nearbyOnly = false, radiusKm }: { nearbyOnly?: boolean; radiusKm?: number } = {},
): Promise<FeaturedRestaurant[]> {
  const supabase = await createClient();
  const scoped = (nearbyOnly || radiusKm != null) && !!coords;
  const { data } = await supabase.rpc(
    'restaurant_feed',
    scoped ? toRpcArgs(filters, NEARBY_FEED_FETCH, 0, coords) : toRpcArgs(filters, limit, offset, coords),
  );
  let rows = (data ?? []) as FeaturedRestaurant[];
  if (filters.badge === 'instant') rows = rows.filter((r) => r.booking_service_type === 'instant');
  if (!scoped) return rows;
  const near =
    radiusKm != null
      ? withinRadius(rows, (r) => r.distance_km, true, radiusKm)
      : scopeToRadius(rows, (r) => r.distance_km, true);
  return near.slice(offset, offset + limit);
}


export type PromotionalCollection = {
  id: string;
  title: string;
  subtitle: string | null;
  hasBanner: boolean;
  restaurants: FeaturedRestaurant[];
};

/**
 * CMS promo banners + their mood-matched restaurant rail — app parity:
 * components/Home/PromotionalCards.jsx → loadPromotionalCards(screen):
 * active `promotional_collections` rows for the screen inside their
 * starts_at/ends_at window, each paired with up to 12 restaurants tagged with
 * the collection's linked mood category (via the feed's `in_experience`).
 * The banner itself is served by /api/promo-banner/[id] (rows store it as an
 * inline base64 image, far too large to ship in the page payload).
 */
export async function getPromotionalCollections(
  screen: string,
  coords?: Coords | null,
): Promise<PromotionalCollection[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('promotional_collections')
    .select('id, title, subtitle, starts_at, ends_at, restaurant_mood_categories(title)')
    .eq('is_active', true)
    .contains('screens', [screen])
    .order('sort_order', { ascending: true });

  const now = Date.now();
  const active = (data ?? []).filter((c) => {
    const start = c.starts_at ? Date.parse(c.starts_at) : NaN;
    const end = c.ends_at ? Date.parse(c.ends_at) : NaN;
    return (Number.isNaN(start) || start <= now) && (Number.isNaN(end) || end >= now);
  });
  if (!active.length) return [];

  const { data: withBanner } = await supabase
    .from('promotional_collections')
    .select('id')
    .in('id', active.map((c) => c.id))
    .not('banner_image_url', 'is', null);
  const bannerIds = new Set((withBanner ?? []).map((r) => r.id));

  return Promise.all(
    active.map(async (c) => {
      const rel = c.restaurant_mood_categories as
        | { title: string }
        | { title: string }[]
        | null;
      const moodTitle = Array.isArray(rel) ? rel[0]?.title : rel?.title;
      const restaurants = moodTitle
        ? await getRestaurantFeed({ moodTitle }, 0, 12, coords, { nearbyOnly: true })
        : [];
      return {
        id: c.id as string,
        title: c.title as string,
        subtitle: (c.subtitle as string | null) ?? null,
        hasBanner: bannerIds.has(c.id),
        restaurants,
      };
    }),
  );
}

/** Cuisine options for the filter dialog — app parity: restaurant_cuisine_facets. */
export async function getCuisineFacets(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('restaurant_cuisine_facets');
  return ((data ?? []) as { cuisine: string }[])
    .map((r) => r.cuisine)
    .filter(Boolean);
}

/**
 * Resolves a stored image value to a public URL — app parity:
 * IntheMoodFor.jsx → `resolveSupabasePublicImage`. Handles values that are
 * already absolute URLs, and values that are storage object paths
 * ("bucket/path/to/file.png", optionally prefixed with
 * "storage/v1/object/public/" or "public/") needing `getPublicUrl`.
 */
function resolveSupabasePublicImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:image/')) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;

  let normalized = trimmed.replace(/^\/+/, '');
  normalized = normalized.replace(/^storage\/v1\/object\/public\//, '');
  normalized = normalized.replace(/^public\//, '');

  const segments = normalized.split('/').filter(Boolean);
  if (segments.length < 2) return null;

  const bucket = segments[0];
  const objectPath = segments.slice(1).join('/');
  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return data?.publicUrl || null;
}

type MoodCategoryRow = {
  key: string;
  slug: string;
  title: string;
  sort_order: number | null;
  image_url: string | null;
  image_path: string | null;
  light_theme_image_url: string | null;
  light_theme_image_path: string | null;
  dark_theme_image_url: string | null;
  dark_theme_image_path: string | null;
};

/**
 * "What's on your mind?" mood chips — app parity: IntheMoodFor.jsx →
 * `fetchMoodCategoriesFromSupabase` + `resolveMoodCategoryImageByTheme`
 * (plain table select, no limit; web has no dark mode so always resolves the
 * light-theme image, falling back to the generic image, then dark-theme).
 */
export async function getMoodCategories(): Promise<MoodCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('restaurant_mood_categories')
    .select(
      'key, slug, title, sort_order, image_url, image_path, light_theme_image_url, light_theme_image_path, dark_theme_image_url, dark_theme_image_path',
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return ((data ?? []) as MoodCategoryRow[]).map((row) => {
    const image =
      resolveSupabasePublicImage(supabase, row.light_theme_image_url) ??
      resolveSupabasePublicImage(supabase, row.light_theme_image_path) ??
      resolveSupabasePublicImage(supabase, row.image_url) ??
      resolveSupabasePublicImage(supabase, row.image_path) ??
      resolveSupabasePublicImage(supabase, row.dark_theme_image_url) ??
      resolveSupabasePublicImage(supabase, row.dark_theme_image_path);

    return {
      key: row.key,
      slug: row.slug,
      title: row.title,
      sort_order: row.sort_order,
      image_url: image,
    };
  });
}

export async function getActiveRestaurants(limit = 10): Promise<Restaurant[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('restaurants')
    .select(SELECT_FIELDS)
    .eq('is_active', true)
    .limit(limit);
  return (data ?? []) as Restaurant[];
}

export async function getRestaurantBySlugOrId(
  slugOrId: string,
): Promise<RestaurantDetail> {
  const supabase = await createClient();

  let { data: restaurant } = await supabase
    .from('restaurants')
    .select(SELECT_FIELDS)
    .eq('slug', slugOrId)
    .eq('is_active', true)
    .maybeSingle();

  if (!restaurant) {
    const res = await supabase
      .from('restaurants')
      .select(SELECT_FIELDS)
      .eq('id', slugOrId)
      .eq('is_active', true)
      .maybeSingle();
    restaurant = res.data;
  }

  if (!restaurant) {
    return {
      restaurant: null,
      offers: [],
      tags: [],
      reviews: [],
      reviewSummary: { avg: 0, count: 0 },
      galleryPhotos: [],
      foodPhotos: [],
      ambiencePhotos: [],
      menuImages: [],
      todayHours: null,
      allHours: [],
    };
  }

  const [offersRes, tagsRes, reviewsRes, mediaAssetsRes, reviewPhotosRes, hoursRes] =
    await Promise.allSettled([
      supabase
        .from('restaurant_offers')
        .select(
          'id, title, description, badge_text, offer_type, discount_value, min_spend, start_at, end_at, metadata',
        )
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true)
        .order('created_at'),
      supabase
        .from('restaurant_tags')
        .select('id, tag_type, tag_value')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order'),
      supabase
        .from('restaurant_reviews')
        .select(
          'id, rating, review_text, username_snapshot, liked_tags, photo_urls, food_rating, service_rating, ambience_rating, created_at',
        )
        .eq('restaurant_id', restaurant.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('restaurant_media_assets')
        .select('file_url, sort_order, asset_type')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('restaurant_reviews')
        .select('photo_urls')
        .eq('restaurant_id', restaurant.id)
        .eq('is_approved', true)
        .not('photo_urls', 'eq', '{}'),
      supabase
        .from('restaurant_opening_hours')
        .select('day_of_week, open_time, close_time, is_closed')
        .eq('restaurant_id', restaurant.id)
        .order('day_of_week'),
    ]);

  const offers: DiningOffer[] =
    // app parity: isOfferCurrentlyActive — only offers inside their dates
    offersRes.status === 'fulfilled'
      ? (offersRes.value.data ?? []).filter((o) => {
          const now = Date.now();
          return !(o.start_at && Date.parse(o.start_at) > now) && !(o.end_at && Date.parse(o.end_at) < now);
        })
      : [];
  const tags: RestaurantTag[] =
    tagsRes.status === 'fulfilled' ? (tagsRes.value.data ?? []) : [];
  const reviews: Review[] =
    reviewsRes.status === 'fulfilled' ? (reviewsRes.value.data ?? []) : [];
  const mediaAssets =
    mediaAssetsRes.status === 'fulfilled'
      ? (mediaAssetsRes.value.data ?? [])
      : [];

  const isFoodAsset = (assetType: string | null | undefined) =>
    ['food', 'food_photo', 'food_photos', 'food-photo', 'food-photos'].includes(
      (assetType ?? '').toLowerCase(),
    );

  const isAmbienceAsset = (assetType: string | null | undefined) =>
    [
      'ambience',
      'ambience_photo',
      'ambience_photos',
      'ambience-photo',
      'ambience-photos',
    ].includes((assetType ?? '').toLowerCase());

  const isMenuAsset = (assetType: string | null | undefined) =>
    ['menu', 'menu_photo', 'menu_photos'].includes(
      (assetType ?? '').toLowerCase(),
    );

  const foodPhotos = mediaAssets
    .filter((asset: { file_url?: string; asset_type?: string | null }) =>
      isFoodAsset(asset.asset_type),
    )
    .map((asset: { file_url?: string }) => asset.file_url)
    .filter((url): url is string => Boolean(url));

  const ambiencePhotos = mediaAssets
    .filter((asset: { file_url?: string; asset_type?: string | null }) =>
      isAmbienceAsset(asset.asset_type),
    )
    .map((asset: { file_url?: string }) => asset.file_url)
    .filter((url): url is string => Boolean(url));

  const menuImages: string[] = mediaAssets
    .filter((asset: { file_url?: string; asset_type?: string | null }) =>
      isMenuAsset(asset.asset_type),
    )
    .map((asset: { file_url?: string }) => asset.file_url)
    .filter((url): url is string => Boolean(url));

  const reviewSummary: ReviewSummary =
    reviews.length > 0
      ? {
          avg:
            Math.round(
              (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) /
                reviews.length) *
                10,
            ) / 10,
          count: reviews.length,
        }
      : { avg: 0, count: 0 };

  const reviewPhotos =
    reviewPhotosRes.status === 'fulfilled'
      ? (reviewPhotosRes.value.data ?? [])
          .flatMap((r: { photo_urls?: string[] }) => r.photo_urls ?? [])
          .filter(Boolean)
      : [];

  const seen = new Set<string>();
  const galleryPhotos: string[] = [];
  for (const url of [
    restaurant.cover_image,
    ...foodPhotos,
    ...ambiencePhotos,
    ...reviewPhotos,
  ]) {
    if (url && !seen.has(url)) {
      seen.add(url);
      galleryPhotos.push(url);
    }
  }

  const allHours: RestaurantHours[] =
    hoursRes.status === 'fulfilled' ? (hoursRes.value.data ?? []) : [];
  const todayHours = allHours.find(h => h.day_of_week === new Date().getDay()) ?? null;

  return {
    restaurant: restaurant as Restaurant,
    offers,
    tags,
    reviews,
    reviewSummary,
    galleryPhotos,
    foodPhotos,
    ambiencePhotos,
    menuImages,
    todayHours,
    allHours,
  };
}

/** Menu items and whether they can be ordered — app parity: restaurants.js fetchOrderCollectById. */
export async function getOrderCollect(restaurantId: string): Promise<{ enabled: boolean; items: OrderItem[] }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('restaurants')
    .select('order_collect_enabled, menu_json')
    .eq('id', restaurantId)
    .maybeSingle();
  return { enabled: data?.order_collect_enabled === true, items: orderableItems(data?.menu_json) };
}

const REVIEW_PAGE_SIZE = 1000;

/** Every approved review with its author's current name and photo — app parity: restaurantReviews.js. */
export async function getAllRestaurantReviews(restaurantId: string): Promise<ReviewRow[]> {
  const supabase = await createClient();
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += REVIEW_PAGE_SIZE) {
    const { data } = await supabase
      .from('restaurant_reviews')
      .select('id, user_id, rating, review_text, username_snapshot, avatar_snapshot, liked_tags, created_at')
      .eq('restaurant_id', restaurantId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .range(from, from + REVIEW_PAGE_SIZE - 1);
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < REVIEW_PAGE_SIZE) break;
  }
  const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))] as string[];
  const { data: users } = userIds.length
    ? await supabase.from('users').select('id, full_name, profile_image').in('id', userIds)
    : { data: [] };
  const byId = new Map((users ?? []).map(u => [u.id, u]));
  return rows.map(r => {
    const user = byId.get(r.user_id as string);
    return {
      id: String(r.id),
      rating: Number(r.rating) || 0,
      text: String(r.review_text ?? '').trim(),
      name: user?.full_name || String(r.username_snapshot ?? '').trim() || 'PassPrivé member',
      avatar: user?.profile_image || (r.avatar_snapshot as string | null) || null,
      tags: Array.isArray(r.liked_tags) ? (r.liked_tags as string[]) : [],
      createdAt: (r.created_at as string | null) ?? null,
    };
  });
}
