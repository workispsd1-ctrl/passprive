/**
 * Cashback-badge eligibility, ported from the app
 * (`utils/merchantCapabilities.js` + `utils/cashbackBadge.js`).
 *
 * The app shows the cashback badge only for a merchant that `canPayBill` and
 * `isPaidMerchant`, then picks the art by membership plan (free → 0.5%,
 * premiere → 1.5%, black → 3%). The web has no membership context, so it is
 * always the free-plan 0.5% case — `showsCashbackBadge` returns whether to show
 * `/0.5Cashback.png`.
 */

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

/** Free-plan web: show the 0.5% cashback badge when the merchant qualifies. */
export function showsCashbackBadge(e: MerchantCapabilityFields): boolean {
  if (!canPayBill(e) || !isPaidMerchant(e)) return false;
  const type = String(e.merchant_type ?? '').trim().toLowerCase();
  return type === 'preferred' || type === 'verified';
}
