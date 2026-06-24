export type Restaurant = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  area: string | null;
  city: string | null;
  full_address: string | null;
  cover_image: string | null;
  cost_for_two: number | null;
  phone: string | null;
  is_pure_veg: boolean;
  booking_enabled: boolean;
  menu_json: MenuJson | null;
  latitude: number | null;
  longitude: number | null;
  is_advertised: boolean;
  ad_priority: number | null;
  merchant_type: 'preferred_partner' | 'verified_pay' | null;
  cover_charge_enabled: boolean;
  cover_charge_amount: number | null;
  max_bookings_per_slot: number | null;
};

export type RestaurantHours = {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

export type MenuJson = {
  sections: MenuSection[];
  full_menu_image_url?: string;
  full_menu_image_urls?: string[];
};

export type MenuSection = {
  id: string;
  name: string;
  description: string | null;
  items: MenuItemJson[];
};

export type MenuItemJson = {
  id: string;
  name: string;
  price: number | null;
  is_veg: boolean;
  image_urls: string[];
  description: string | null;
  is_available: boolean;
  is_bestseller: boolean;
};

export type DiningOffer = {
  id: string;
  title: string;
  description: string | null;
  badge_text: string | null;
  offer_type: string | null;
  discount_value: number | null;
  min_spend: number | null;
};

export type RestaurantTag = {
  id: string;
  tag_type: string;
  tag_value: string;
};

export type Review = {
  id: string;
  rating: number;
  review_text: string | null;
  username_snapshot: string | null;
  liked_tags: string[] | null;
  photo_urls: string[] | null;
  food_rating: number | null;
  service_rating: number | null;
  ambience_rating: number | null;
  created_at: string;
};

export type ReviewSummary = { avg: number; count: number };

export type RestaurantDetail = {
  restaurant: Restaurant | null;
  offers: DiningOffer[];
  tags: RestaurantTag[];
  reviews: Review[];
  reviewSummary: ReviewSummary;
  galleryPhotos: string[];
  foodPhotos: string[];
  ambiencePhotos: string[];
  menuImages: string[];
  todayHours: RestaurantHours | null;
  allHours: RestaurantHours[];
};

export type FeaturedRestaurant = Restaurant & {
  restaurant_offers: Array<{
    id: string;
    badge_text: string | null;
    discount_value: number | null;
  }>;
};
