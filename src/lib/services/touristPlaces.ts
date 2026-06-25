import { createClient } from '@/lib/supabase/server';
import type {
  TouristPlace,
  TouristPlaceHours,
  TouristPlaceActivity,
  TouristPlaceReview,
  ReviewSummary,
  TouristPlaceDetail,
} from '@/lib/types/touristPlaces';

const SELECT_FIELDS =
  'id, place_name, phone, area, city, full_address, location_name, slug, cover_image, picture_id, latitude, longitude, description, is_active, owner_user_id, booking_enabled, advance_booking_days, modification_available, modification_cutoff_minutes, cancellation_available, cancellation_cutoff_minutes, payment_option, price, rating, reviews_count, created_at, updated_at, is_advertised, ad_priority, ad_starts_at, ad_ends_at, ad_badge_text, booking_terms, google_place_id, place_types, tags, price_child, price_local_adult, price_local_child, child_age_min, child_age_max';

export async function getNewTouristPlaces(limit = 8): Promise<TouristPlace[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tourist_places')
    .select(`${SELECT_FIELDS}, tourist_place_media_assets(file_url, sort_order)`)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as TouristPlace[];
}

export async function getActiveTouristPlaces(limit = 50): Promise<TouristPlace[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tourist_places')
    .select(`${SELECT_FIELDS}, tourist_place_media_assets(file_url, sort_order)`)
    .eq('is_active', true)
    .limit(limit);
  return (data ?? []) as TouristPlace[];
}

export async function getTouristPlaceBySlugOrId(
  slugOrId: string,
): Promise<TouristPlaceDetail> {
  const supabase = await createClient();

  let { data: place } = await supabase
    .from('tourist_places')
    .select(SELECT_FIELDS)
    .eq('slug', slugOrId)
    .eq('is_active', true)
    .maybeSingle();

  if (!place) {
    const res = await supabase
      .from('tourist_places')
      .select(SELECT_FIELDS)
      .eq('id', slugOrId)
      .eq('is_active', true)
      .maybeSingle();
    place = res.data;
  }

  if (!place) {
    return {
      place: null,
      activities: [],
      reviews: [],
      reviewSummary: {
        avg: 0,
        count: 0,
        guideAvg: 0,
        safetyAvg: 0,
        cleanlinessAvg: 0,
        valueAvg: 0,
        crowdAvg: 0,
      },
      galleryPhotos: [],
      todayHours: null,
      allHours: [],
    };
  }

  const [activitiesRes, reviewsRes, mediaAssetsRes, hoursRes] =
    await Promise.allSettled([
      supabase
        .from('tourist_place_activities')
        .select('id, tourist_place_id, activity_type, price_adult, price_child, child_age_min, child_age_max, child_special_offer, is_active')
        .eq('tourist_place_id', place.id)
        .eq('is_active', true)
        .order('created_at'),
      supabase
        .from('tourist_place_reviews')
        .select(
          'id, tourist_place_id, user_id, rating, review_text, liked_tags, photo_urls, username_snapshot, avatar_snapshot, is_approved, created_at, guide_rating, safety_rating, cleanliness_rating, value_rating, crowd_rating, owner_reply_text, owner_reply_at',
        )
        .eq('tourist_place_id', place.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('tourist_place_media_assets')
        .select('file_url, sort_order, asset_type')
        .eq('tourist_place_id', place.id)
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('tourist_place_opening_hours')
        .select('id, tourist_place_id, day_of_week, open_time, close_time, is_closed')
        .eq('tourist_place_id', place.id)
        .order('day_of_week'),
    ]);

  const activities: TouristPlaceActivity[] =
    activitiesRes.status === 'fulfilled' ? (activitiesRes.value.data ?? []) : [];
  const reviews: TouristPlaceReview[] =
    reviewsRes.status === 'fulfilled' ? (reviewsRes.value.data ?? []) : [];
  const mediaAssets =
    mediaAssetsRes.status === 'fulfilled'
      ? (mediaAssetsRes.value.data ?? [])
      : [];

  const reviewPhotos = reviews
    .flatMap(r => r.photo_urls ?? [])
    .filter(Boolean);

  const seen = new Set<string>();
  const galleryPhotos: string[] = [];
  
  if (place.cover_image && !seen.has(place.cover_image)) {
    seen.add(place.cover_image);
    galleryPhotos.push(place.cover_image);
  }

  for (const asset of mediaAssets) {
    if (asset.file_url && !seen.has(asset.file_url)) {
      seen.add(asset.file_url);
      galleryPhotos.push(asset.file_url);
    }
  }

  for (const url of reviewPhotos) {
    if (url && !seen.has(url)) {
      seen.add(url);
      galleryPhotos.push(url);
    }
  }

  const reviewSummary: ReviewSummary = {
    avg: 0,
    count: 0,
    guideAvg: null,
    safetyAvg: null,
    cleanlinessAvg: null,
    valueAvg: null,
    crowdAvg: null,
  };

  if (reviews.length > 0) {
    reviewSummary.count = reviews.length;
    reviewSummary.avg =
      Math.round(
        (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length) * 10,
      ) / 10;

    const calcSubRating = (key: keyof TouristPlaceReview) => {
      const ratedReviews = reviews.filter(r => r[key] !== null && r[key] !== undefined);
      if (ratedReviews.length === 0) return null;
      return (
        Math.round(
          (ratedReviews.reduce((s, r) => s + Number(r[key] ?? 0), 0) /
            ratedReviews.length) * 10,
        ) / 10
      );
    };

    reviewSummary.guideAvg = calcSubRating('guide_rating');
    reviewSummary.safetyAvg = calcSubRating('safety_rating');
    reviewSummary.cleanlinessAvg = calcSubRating('cleanliness_rating');
    reviewSummary.valueAvg = calcSubRating('value_rating');
    reviewSummary.crowdAvg = calcSubRating('crowd_rating');
  }

  const allHours: TouristPlaceHours[] =
    hoursRes.status === 'fulfilled' ? (hoursRes.value.data ?? []) : [];
  const todayHours = allHours.find(h => h.day_of_week === new Date().getDay()) ?? null;

  return {
    place: place as TouristPlace,
    activities,
    reviews,
    reviewSummary,
    galleryPhotos,
    todayHours,
    allHours,
  };
}
