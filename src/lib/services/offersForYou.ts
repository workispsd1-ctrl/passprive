import { createClient } from '@/lib/supabase/server';
import type { OfferForYouCard } from '@/lib/types/offersForYou';

const COLUMNS =
  'id,image_url,type,link_url,target_kind,target_id,target_route,hero_url,detail_title,detail_body,sort_order,enabled';

/**
 * "Offers for you" cards. Same query as the app's `fetchOffersForYou`
 * (`components/Home/OffersForYou.jsx`): enabled rows from `offers_for_you_cards`,
 * ordered by `sort_order`.
 */
export async function getOffersForYou(): Promise<OfferForYouCard[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('offers_for_you_cards')
    .select(COLUMNS)
    .eq('enabled', true)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data as OfferForYouCard[];
}
