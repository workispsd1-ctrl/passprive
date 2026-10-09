import type { MembershipPlan, UserMembership } from '@/lib/types/subscription'

/* ─── Per-tier visuals — app parity: Membership.jsx PLAN_VISUAL ──────────── */
type Visual = {
  bg: string | null
  badge: string | null
  baseColor: string
  borderColor: string
  shadowColor: string
  textColor: string
  mutedColor: string
  checkColor: string
  ctaBg: string | null
  ctaColor: string | null
  ctaLabel: string | null
}

const PLAN_VISUAL: Record<string, Visual> = {
  black: {
    bg: '/membership/hero-black.webp', badge: '/membership/BlackBadge.webp',
    baseColor: '#0B0B0C', borderColor: 'rgba(230,100,0,0.55)', shadowColor: '#FF5500',
    textColor: '#FFFFFF', mutedColor: 'rgba(255,255,255,0.62)', checkColor: '#FFD060',
    ctaBg: '#FF5200', ctaColor: '#FFFFFF', ctaLabel: 'Upgrade to Black',
  },
  plus: {
    bg: '/membership/hero-plus.webp', badge: '/membership/PlusBadge.webp',
    baseColor: '#0C1A3A', borderColor: 'rgba(59,130,246,0.22)', shadowColor: '#1E40AF',
    textColor: '#FFFFFF', mutedColor: 'rgba(255,255,255,0.58)', checkColor: '#93C5FD',
    ctaBg: '#1E40AF', ctaColor: '#FFFFFF', ctaLabel: 'Upgrade to Plus',
  },
  free: {
    bg: null, badge: '/membership/FreeBadge.webp',
    baseColor: '#FFFFFF', borderColor: 'rgba(76,175,80,0.45)', shadowColor: '#000000',
    textColor: '#1A1A1A', mutedColor: '#888888', checkColor: '#4CAF50',
    ctaBg: null, ctaColor: null, ctaLabel: null,
  },
}
// app parity: CUSTOM_TIER_VISUAL — tiers configured only in the CMS (e.g. CIM)
const CUSTOM_VISUAL: Visual = {
  bg: null, badge: null,
  baseColor: '#1F2430', borderColor: 'rgba(255,255,255,0.16)', shadowColor: '#000000',
  textColor: '#FFFFFF', mutedColor: 'rgba(255,255,255,0.6)', checkColor: '#FFFFFF',
  ctaBg: '#FF5200', ctaColor: '#FFFFFF', ctaLabel: null,
}

export const amountOf = (v: unknown) => {
  const n = Number(String(v ?? '').replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** app parity: planPresentation.resolvePlanTier */
export function tierOf(plan: MembershipPlan): string {
  const explicit = String(plan.tier ?? '').trim().toLowerCase()
  if (explicit) return explicit
  const name = plan.plan_name.toLowerCase()
  if (name.includes('black')) return 'black'
  if (name.includes('plus') || name.includes('premium')) return 'plus'
  if (amountOf(plan.amount) === 0 || name.includes('free')) return 'free'
  return 'plus'
}

/** app parity: planPresentation.dealsPoint */
export function dealsPoint(plan: MembershipPlan) {
  const monthly = plan.deals_per_month == null ? 'Unlimited deal redemptions/month' : `${plan.deals_per_month} deal redemptions/month`
  return plan.deals_per_restaurant_per_month == null ? monthly : `${monthly} · up to ${plan.deals_per_restaurant_per_month} per restaurant`
}

/** app parity: Membership.jsx resolveVisual — CMS fields override the tier defaults. */
export function visualOf(plan: MembershipPlan) {
  const tier = tierOf(plan)
  const base = PLAN_VISUAL[tier] ?? CUSTOM_VISUAL
  const t = plan.theme ?? {}
  const pick = (v: string | undefined, fallback: string | null) => (v && v.trim()) || fallback
  return {
    tier,
    bg: plan.card_bg_url?.trim() || base.bg,
    badge: plan.badge_url?.trim() || base.badge,
    baseColor: pick(t.baseColor, base.baseColor)!,
    borderColor: pick(t.borderColor, base.borderColor)!,
    shadowColor: pick(t.shadowColor, base.shadowColor)!,
    textColor: pick(t.textColor, base.textColor)!,
    mutedColor: pick(t.mutedColor, base.mutedColor)!,
    checkColor: pick(t.accentColor, base.checkColor)!,
    ctaBg: pick(t.ctaBg, base.ctaBg),
    ctaColor: pick(t.ctaColor, base.ctaColor),
    ctaLabel: plan.cta_label?.trim() || base.ctaLabel,
    tags: plan.tags,
    benefits: [...plan.benefits, dealsPoint(plan)],
    originalAmount: amountOf(plan.original_amount) || null,
  }
}

/**
 * The member's current plan — app parity: Membership.jsx hasActiveMembership +
 * activeTier. Returns null for Free / no active membership.
 */
export function currentPlanOf(plans: MembershipPlan[], membership: UserMembership | null): MembershipPlan | null {
  const raw = (membership?.membership_tier ?? 'none').trim().toLowerCase()
  if (raw === 'none' || raw === 'inactive' || raw === 'free') return null
  const byName = plans.find(p => p.plan_name.trim().toLowerCase() === raw)
  if (byName) return byName
  const tier = raw.includes('black') ? 'black' : raw.includes('plus') || raw.includes('premium') ? 'plus' : null
  return tier ? plans.find(p => tierOf(p) === tier) ?? null : null
}

/** Plans rank by yearly price (Free 0 < Plus < CIM < Black); only higher plans are upgrades. */
export function canUpgradeTo(plan: MembershipPlan, current: MembershipPlan | null) {
  return amountOf(plan.amount) > (current ? amountOf(current.amount) : 0)
}
