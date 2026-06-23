// Single source of truth for all cashback rates.
// wallet.ts, auth/me, TIER_PERKS, and cashback_quote.sql must all reflect these values.
// To change a rate: update here, then also update supabase/migrations/cashback_quote.sql.

export const PREFERRED_PARTNER_RATES: Record<string, number> = {
  none: 0.5,
  premium: 2,
  black: 4,
}

export const VERIFIED_PAY_RATE = 0.5
export const DEFAULT_RATE = 0.5
