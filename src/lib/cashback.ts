/**
 * Cashback-badge eligibility, ported from the app
 * (`utils/merchantCapabilities.js` + `utils/cashbackBadge.js`).
 *
 * Bill cashback (`hasBillCashback`) needs a merchant that `canPayBill`, is
 * `isPaidMerchant` and hasn't switched cashback off. The card badge is wider
 * than that — receipt-upload cashback works anywhere cashback is on — and
 * picks its art by membership plan (free → 0.5%, premiere → verified 0.5% /
 * preferred 1.5%, black → verified 0.5% / preferred 3%) — see `getCardBadge`.
 */

import { burnOn, earnOn } from '@/lib/platformFlags';

export type CashbackPlan = 'free' | 'premiere' | 'black';

// App parity: utils/cashbackBadge.js PLAN_BADGES
const PLAN_BADGES: Record<CashbackPlan, { verified: string; preferred: string }> = {
  free: {
    verified: '/assets/cashback/Lite_theme_free_0.5.webp',
    preferred: '/assets/cashback/Lite_theme_free_0.5.webp',
  },
  premiere: {
    verified: '/assets/cashback/Lite_Theme_Plus_0.5.webp',
    preferred: '/assets/cashback/Lite_Theme_Plus_1.5.webp',
  },
  black: {
    verified: '/assets/cashback/Lite_Theme_Black_0.5.webp',
    preferred: '/assets/cashback/Lite_Theme_Black_3.webp',
  },
};

// App parity: cashbackBadge.js USE_CASHBACK_BADGE / DISCOVERABLE_CHIP
const USE_CASHBACK_BADGE = '/assets/cashback/Use-Cashback-OnPayment.webp';
export const PROMOTED_CHIP = '/assets/cashback/PassPrive-Promoted.webp';

export type MerchantCapabilityFields = {
  merchant_type?: string | null;
  merchant_plan?: string | null;
  pay_bill_enabled?: boolean | null;
  service_level?: string | null;
  on_boarded?: boolean | null;
  booking_enabled?: boolean | null;
  /** superadmin switch — false turns every cashback surface off for the merchant */
  cashback_enabled?: boolean | null;
  is_promoted?: boolean | null;
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

/** App parity: cashbackBadge.js isCashbackEnabled — only an explicit false switches it off. */
export function isCashbackEnabled(e: MerchantCapabilityFields): boolean {
  if (!earnOn() && !burnOn()) return false;
  return e.cashback_enabled !== false;
}

export function isPromoted(e: MerchantCapabilityFields): boolean {
  return e.is_promoted === true;
}

/** App parity: cashbackBadge.js hasBillCashback — cashback earned by paying the bill in-app. */
export function hasBillCashback(e: MerchantCapabilityFields): boolean {
  return isCashbackEnabled(e) && canPayBill(e) && isPaidMerchant(e);
}

function merchantTierOf(e: MerchantCapabilityFields): 'preferred' | 'verified' | null {
  if (!hasBillCashback(e)) return null;
  const type = String(e.merchant_type ?? '').trim().toLowerCase();
  return type === 'preferred' || type === 'verified' ? type : null;
}

/** Whether the merchant earns bill cashback (the Offers block's cashback row). */
export function showsCashbackBadge(e: MerchantCapabilityFields): boolean {
  return merchantTierOf(e) !== null;
}

export type CardBadge = {
  /** earn badge first, then "use cashback on payment" for merchants that take bill payments */
  arts: string[];
  /** PassPrivé Promoted — a corner tag beside the cashback badge, or the promoted chip alone */
  promoted: boolean;
};

/**
 * App parity: CashbackBadge.jsx + getEntityCashbackBadges — the badge a card
 * shows for this merchant and the viewer's plan, null for none. Booking-only
 * merchants get no cashback art.
 */
export function getCardBadge(e: MerchantCapabilityFields, plan: CashbackPlan): CardBadge | null {
  const promoted = isPromoted(e);
  const arts: string[] = [];
  if (isCashbackEnabled(e)) {
    const type = String(e.merchant_type ?? '').trim().toLowerCase();
    const earn = earnOn() ? PLAN_BADGES[plan][type === 'verified' ? 'verified' : 'preferred'] : null;
    const use = burnOn() ? USE_CASHBACK_BADGE : null;
    if (canPayBill(e)) arts.push(...[earn, use].filter((art): art is string => !!art));
    else if (!canBook(e) && earn) arts.push(earn);
  }
  return arts.length || promoted ? { arts, promoted } : null;
}

/** App parity: merchantCapabilities.js `canBook` (booking needs service level ≥ booking). */
export function canBook(e: MerchantCapabilityFields): boolean {
  if (isFreeMerchant(e)) return false

  if (typeof e.booking_enabled === 'boolean') {
    return e.booking_enabled && !notOnboarded(e)
  }

  const level = levelOf(e)
  if (level === null) return false
  return level >= SERVICE_LEVELS.booking && !notOnboarded(e)
}

/** App parity: cashbackBadge.js `getEntityCashbackPct` — the % rate itself, 0 when not eligible. */
export function getCashbackPct(e: MerchantCapabilityFields, plan: CashbackPlan): number {
  if (!earnOn()) return 0
  const tier = merchantTierOf(e)
  if (tier === 'preferred') return plan === 'black' ? 3 : plan === 'premiere' ? 1.5 : 0.5
  if (tier === 'verified') return 0.5
  return 0
}
