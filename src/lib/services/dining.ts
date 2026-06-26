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
} from '@/lib/types/dining';

const SELECT_FIELDS =
  'id, name, slug, description, area, city, full_address, cover_image, cost_for_two, phone, is_pure_veg, booking_enabled, menu_json, latitude, longitude, is_advertised, ad_priority, merchant_type, cover_charge_enabled, cover_charge_amount, max_bookings_per_slot';

async function fetchNewestRestaurants(
  limit = 8,
): Promise<FeaturedRestaurant[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('restaurants')
    .select(
      'id, name, slug, description, area, city, full_address, cover_image, cost_for_two, phone, is_pure_veg, booking_enabled, menu_json, latitude, longitude, is_advertised, ad_priority, merchant_type, cover_charge_enabled, cover_charge_amount, restaurant_offers(id, badge_text, discount_value)',
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as FeaturedRestaurant[];
}

export async function getNewRestaurants(
  limit = 8,
): Promise<FeaturedRestaurant[]> {
  return fetchNewestRestaurants(limit);
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
