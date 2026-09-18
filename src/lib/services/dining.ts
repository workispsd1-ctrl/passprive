import { createClient } from '@/lib/supabase/server';
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
  OfferForYouCard,
} from '@/lib/types/dining';

const SELECT_FIELDS =
  'id, name, slug, description, area, city, full_address, cover_image, cost_for_two, phone, is_pure_veg, booking_enabled, menu_json, latitude, longitude, is_advertised, ad_priority, merchant_type, merchant_plan, pay_bill_enabled, service_level, on_boarded, cover_charge_enabled, cover_charge_amount, max_bookings_per_slot';

/**
 * Newest restaurants via the `restaurant_feed` RPC — app parity:
 * services/restaurants.ts → fetchRestaurantFeedPage/mapFeedRowToRestaurant.
 * Used over the plain `restaurants` table select because it's the only
 * public source for the pre-aggregated rating and mood tags the cards need.
 */
export async function getNewRestaurants(
  limit = 8,
): Promise<FeaturedRestaurant[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('restaurant_feed', {
    in_lat: null,
    in_lng: null,
    in_limit: limit,
    in_offset: 0,
    in_sort: 'newest',
  });
  return (data ?? []) as FeaturedRestaurant[];
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

/**
 * "Bank offers" cards — app parity: OffersForYou.jsx →
 * `fetchOffersForYou` (dinein screen passes `title="Bank Offer"`).
 */
export async function getOffersForYouCards(): Promise<OfferForYouCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('offers_for_you_cards')
    .select('id, image_url, title, type, link_url, detail_title, detail_body, hero_url')
    .eq('enabled', true)
    .order('sort_order', { ascending: true });
  return (data ?? []) as OfferForYouCard[];
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
          'id, title, description, badge_text, offer_type, discount_value, min_spend',
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
    offersRes.status === 'fulfilled' ? (offersRes.value.data ?? []) : [];
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
