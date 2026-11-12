import { createPublicClient } from '@/lib/supabase/public';
import { cachedCatalog, unwrap } from '@/lib/catalogCache';
import type { OfferForYouCard } from '@/lib/types/offersForYou';

const COLUMNS =
  'id,image_url,type,link_url,target_kind,target_id,target_route,hero_url,detail_title,detail_body,sort_order,enabled';

/**
 * "Offers for you" cards. Same query as the app's `fetchOffersForYou`
 * (`components/Home/OffersForYou.jsx`): enabled rows from `offers_for_you_cards`,
 * ordered by `sort_order`.
 */
export const getOffersForYou = cachedCatalog('offers-for-you', async (): Promise<OfferForYouCard[]> => {
  const res = await createPublicClient()
    .from('offers_for_you_cards')
    .select(COLUMNS)
    .eq('enabled', true)
    .order('sort_order', { ascending: true });
  return (unwrap(res) ?? []) as OfferForYouCard[];
}, []);
