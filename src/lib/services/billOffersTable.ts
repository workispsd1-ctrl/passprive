import { createPublicClient } from '@/lib/supabase/public'
import { cachedCatalog, unwrap } from '@/lib/catalogCache'
import type { OffersTableRow } from '@/lib/payBill'

/**
 * Live `offers` rows for bill payments — the same select pay-bill uses (filtered
 * per restaurant, and by their dates, in `billOffers`). The same public rows for
 * every visitor, so shared for CATALOG_TTL.
 */
export const getOffersTableRows = cachedCatalog('bill-offers-table', async (): Promise<OffersTableRow[]> => {
  const data = unwrap(await createPublicClient()
    .from('offers')
    .select('id, source_type, owner_entity_type, owner_entity_id, module, payment_flow, title, subtitle, description, badge_text, logo_url, offer_type, benefit_value, benefit_percent, max_discount_amount, min_bill_amount, max_bill_amount, priority, starts_at, ends_at, sponsor_name')
    .eq('is_active', true)
    .order('priority', { ascending: true }))
  return (data ?? []) as OffersTableRow[]
}, [])
