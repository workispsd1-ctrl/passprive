import { createClient } from '@/lib/supabase/server';
import type { WebsiteBanner, WebsiteBannerSection } from '@/lib/types/websiteBanners';

/**
 * One table per website screen — same shape as the app's banner tables
 * (homeherooffers, dineinhomebanners, ...) but never shared with them.
 * Website creatives use different dimensions than the app, so admins upload
 * separate rows here; nothing here touches the app's tables/buckets.
 */
const TABLE_FOR_SECTION: Record<WebsiteBannerSection, string> = {
  home: 'websitehomebanners',
  dining: 'websitedineinbanners',
  store: 'websitestorebanners',
  wellness: 'websitewellnessbanners',
  tourist: 'websitetouristbanners',
};

const BANNER_COLUMNS =
  'id,title,type,media_url,thumbnail_url,cta_text,cta_link,action,priority,is_active,start_at,end_at';

function isWithinWindow(banner: Pick<WebsiteBanner, 'start_at' | 'end_at'>, now: number) {
  if (banner.start_at && new Date(banner.start_at).getTime() > now) return false;
  if (banner.end_at && new Date(banner.end_at).getTime() < now) return false;
  return true;
}

export async function getWebsiteBanners(section: WebsiteBannerSection): Promise<WebsiteBanner[]> {
  const table = TABLE_FOR_SECTION[section];
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(table)
    .select(BANNER_COLUMNS)
    .eq('is_active', true)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  const now = Date.now();
  return (data as WebsiteBanner[]).filter((banner) => isWithinWindow(banner, now));
}

/**
 * The app's own banner tables — app parity: screens/Home/index.jsx
 * BANNER_TABLE_FOR_CAT. Their creatives are tall phone heroes (the header sits
 * over the top), so the website shows them on small screens only.
 */
const APP_TABLE_FOR_SECTION: Record<WebsiteBannerSection, string> = {
  home: 'homeherooffers',
  dining: 'dineinhomebanners',
  store: 'storeshomebanners',
  wellness: 'wellnesshomebanners',
  tourist: 'touristhomebanners',
};

export async function getAppBanners(section: WebsiteBannerSection): Promise<WebsiteBanner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(APP_TABLE_FOR_SECTION[section])
    .select(BANNER_COLUMNS)
    .eq('is_active', true)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  const now = Date.now();
  return (data as WebsiteBanner[]).filter((banner) => isWithinWindow(banner, now));
}

export type AppBannerSets = Record<WebsiteBannerSection, WebsiteBanner[]>;

export async function getAllAppBanners(): Promise<AppBannerSets> {
  const sections: WebsiteBannerSection[] = ['home', 'dining', 'store', 'wellness', 'tourist'];
  const sets = await Promise.all(sections.map(getAppBanners));
  return Object.fromEntries(sections.map((s, i) => [s, sets[i]])) as AppBannerSets;
}
