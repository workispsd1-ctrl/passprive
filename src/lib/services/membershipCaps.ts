import { createPublicClient } from '@/lib/supabase/public'
import { cachedCatalog, unwrap } from '@/lib/catalogCache'

/** Share of a merchant's upfront discount each tier keeps — app parity: cashbackBadge.js UPFRONT_DISCOUNT_SHARE_PCT. */
export type DiscountCaps = { free: number; premiere: number; black: number }

const FALLBACK: DiscountCaps = { free: 50, premiere: 75, black: 100 }

/**
 * `membership_discount_caps` (superadmin-configurable), falling back to the
 * app's defaults so a failed read never grants a bigger share than configured.
 */
export const getDiscountCaps = cachedCatalog('membership-discount-caps', async (): Promise<DiscountCaps> => {
  const data = unwrap(await createPublicClient().from('membership_discount_caps').select('tier, upfront_share_pct'))
  const caps = { ...FALLBACK }
  for (const row of (data ?? []) as { tier: string; upfront_share_pct: number | string }[]) {
    const tier = String(row.tier).toLowerCase() as keyof DiscountCaps
    const pct = Number(row.upfront_share_pct)
    if (tier in caps && Number.isFinite(pct)) caps[tier] = pct
  }
  return caps
}, FALLBACK)
