export type TouristPlace = {
  id: string;
  place_name: string;
  phone: string | null;
  area: string | null;
  city: string | null;
  full_address: string | null;
  location_name: string | null;
  slug: string | null;
  cover_image: string | null;
  picture_id: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  is_active: boolean;
  owner_user_id: string | null;
  booking_enabled: boolean;
  advance_booking_days: number;
  modification_available: boolean;
  modification_cutoff_minutes: number | null;
  cancellation_available: boolean;
  cancellation_cutoff_minutes: number | null;
  payment_option: string[];
  price: number;
  rating: number;
  reviews_count: number;
  created_at: string;
  updated_at: string;
  is_advertised: boolean;
  ad_priority: number | null;
  ad_starts_at: string | null;
  ad_ends_at: string | null;
  ad_badge_text: string | null;
  booking_terms: string[];
  google_place_id: string | null;
  place_types: string[] | null;
  tags: string[];
  price_child: number | null;
  price_local_adult: number | null;
  price_local_child: number | null;
  child_age_min: number | null;
  child_age_max: number | null;
  tourist_place_media_assets?: { file_url: string; sort_order: number }[];
};

export type TouristPlaceHours = {
  id: string;
  tourist_place_id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

export type TouristPlaceActivity = {
  id: string;
  tourist_place_id: string;
  activity_type: 'zipline' | 'quad_biking_single' | 'quad_biking_double' | 'horseback_riding' | 'guided_hiking' | 'safari' | 'karting' | 'nepalese_bridge' | 'aviary' | 'petting_feeding' | string;
  price_adult: number;
  price_child: number | null;
  child_age_min: number | null;
  child_age_max: number | null;
  child_special_offer: string | null;
  is_active: boolean;
};

export type TouristPlaceReview = {
  id: string;
  tourist_place_id: string;
  user_id: string | null;
  rating: number;
  review_text: string | null;
  liked_tags: string[];
  photo_urls: string[];
  username_snapshot: string | null;
  avatar_snapshot: string | null;
  is_approved: boolean;
  created_at: string;
  guide_rating: number | null;
  safety_rating: number | null;
  cleanliness_rating: number | null;
  value_rating: number | null;
  crowd_rating: number | null;
  owner_reply_text: string | null;
  owner_reply_at: string | null;
};

export type ReviewSummary = {
  avg: number;
  count: number;
  guideAvg: number | null;
  safetyAvg: number | null;
  cleanlinessAvg: number | null;
  valueAvg: number | null;
  crowdAvg: number | null;
};

export type TouristPlaceDetail = {
  place: TouristPlace | null;
  activities: TouristPlaceActivity[];
  reviews: TouristPlaceReview[];
  reviewSummary: ReviewSummary;
  galleryPhotos: string[];
  todayHours: TouristPlaceHours | null;
  allHours: TouristPlaceHours[];
};

export type FeaturedTouristPlace = TouristPlace;
