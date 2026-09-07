export type WebsiteBannerType = 'image' | 'video' | 'lottie';

export type WebsiteBannerAction = {
  type: string;
  params: Record<string, unknown>;
} | null;

export type WebsiteBanner = {
  id: number;
  title: string | null;
  type: WebsiteBannerType;
  media_url: string;
  thumbnail_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  action: WebsiteBannerAction;
  priority: number | null;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
};

/** Website home screens that carry their own banner set (separate creatives/tables from the app). */
export type WebsiteBannerSection = 'home' | 'dining' | 'store' | 'wellness' | 'tourist';
