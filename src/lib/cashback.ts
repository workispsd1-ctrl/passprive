/**
 * Cashback-badge eligibility, ported from the app
 * (`utils/merchantCapabilities.js` + `utils/cashbackBadge.js`).
 *
 * The app shows the cashback badge only for a merchant that `canPayBill` and
 * `isPaidMerchant`, then picks the art by membership plan (free → 0.5%,
 * premiere → verified 0.5% / preferred 1.5%, black → verified 0.5% / preferred
 * 3%) — see `getCashbackBadgeArt`. `showsCashbackBadge` is the plain
 * eligibility check kept for callers that only need a boolean.
 */

export type CashbackPlan = 'free' | 'premiere' | 'black';

// App parity: utils/cashbackBadge.js PLAN_BADGES
const PLAN_BADGES: Record<CashbackPlan, { verified: string; preferred: string }> = {
  free: {
    verified: '/membership/Lite_theme_free_0.5.webp',
    preferred: '/membership/Lite_theme_free_0.5.webp',
  },
  premiere: {
    verified: '/membership/Lite_Theme_Plus_0.5.webp',
    preferred: '/membership/Lite_Theme_Plus_1.5.webp',
  },
  black: {
    verified: '/membership/Lite_Theme_Black_0.5.webp',
    preferred: '/membership/Lite_Theme_Black_3.webp',
  },
};

export type MerchantCapabilityFields = {
  merchant_type?: string | null;
  merchant_plan?: string | null;
  pay_bill_enabled?: boolean | null;
  service_level?: string | null;
  on_boarded?: boolean | null;
};

const SERVICE_LEVELS: Record<string, number> = {
  discoverable: 0,
  booking: 1,
  payments: 2,
};

function notOnboarded(e: MerchantCapabilityFields): boolean {
  return e.on_boarded === false;
}

function levelOf(e: MerchantCapabilityFields): number | null {
  const raw = String(e.service_level ?? '').trim().toLowerCase();
  return raw in SERVICE_LEVELS ? SERVICE_LEVELS[raw] : null;
}

export function isFreeMerchant(e: MerchantCapabilityFields): boolean {
  const plan = String(e.merchant_plan ?? '').trim().toLowerCase();
  if (plan) return plan !== 'paid';

  const type = String(e.merchant_type ?? '').trim().toLowerCase();
  if (type) return !(type === 'preferred' || type === 'verified');

  return false;
}

export function isPaidMerchant(e: MerchantCapabilityFields): boolean {
  const plan = String(e.merchant_plan ?? '').trim().toLowerCase();
  if (plan) return plan === 'paid';

  const type = String(e.merchant_type ?? '').trim().toLowerCase();
  return type === 'preferred' || type === 'verified';
}

export function canPayBill(e: MerchantCapabilityFields): boolean {
  if (isFreeMerchant(e)) return false;

  if (typeof e.pay_bill_enabled === 'boolean') {
    return e.pay_bill_enabled && !notOnboarded(e);
  }

  const level = levelOf(e);
  if (level === null) return false;
  return level >= SERVICE_LEVELS.payments && !notOnboarded(e);
}

function merchantTierOf(e: MerchantCapabilityFields): 'preferred' | 'verified' | null {
  if (!canPayBill(e) || !isPaidMerchant(e)) return null;
  const type = String(e.merchant_type ?? '').trim().toLowerCase();
  return type === 'preferred' || type === 'verified' ? type : null;
}

/** Whether the cashback badge should show at all, regardless of which art. */
export function showsCashbackBadge(e: MerchantCapabilityFields): boolean {
  return merchantTierOf(e) !== null;
}

/** App parity: getEntityCashbackBadge — the actual badge art for this merchant + the viewer's plan. */
export function getCashbackBadgeArt(
  e: MerchantCapabilityFields,
  plan: CashbackPlan,
): string | null {
  const tier = merchantTierOf(e);
  return tier ? PLAN_BADGES[plan][tier] : null;
}
