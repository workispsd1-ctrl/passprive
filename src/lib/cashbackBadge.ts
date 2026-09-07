/**
 * Cashback / membership badge art, ported from the app's `PLAN_BADGES`
 * (`utils/cashbackBadge.js`). Assets copied from the app live in
 * `public/membership/`.
 */

export type MembershipPlan = 'free' | 'premiere' | 'black';

/** "Privé Free / Plus / Black" pill art (308×132). */
export const MEMBERSHIP_BADGE: Record<MembershipPlan, string> = {
  free: '/membership/FreeBadge.webp',
  premiere: '/membership/PlusBadge.webp',
  black: '/membership/BlackBadge.webp',
};

/** Cashback badge art by plan × merchant tier (≈490×172), coin included. */
const CASHBACK_BADGE: Record<
  MembershipPlan,
  { verified: string; preferred: string }
> = {
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

/**
 * The cashback badge for a merchant, or null when it doesn't qualify.
 * The web has no membership context, so `plan` defaults to 'free' (0.5%).
 */
export function getCashbackBadgeArt(
  merchantType: string | null | undefined,
  plan: MembershipPlan = 'free',
): string | null {
  const m = String(merchantType ?? '').trim().toLowerCase();
  if (m !== 'preferred' && m !== 'verified') return null;
  return CASHBACK_BADGE[plan][m];
}
