import type { MembershipPlan, UserMembership } from '@/lib/types/subscription'
import { amountOf, tierOf } from '@/lib/membershipPlans'
import type { PlanTier } from '@/lib/membershipBenefits'

/**
 * Design unit for the membership screens (Figma "Subscription plan" and
 * "Privé benefits", 1920-wide frames): `--u` is 1px at 1920 and proportional
 * on other desktop widths; `--spacing` follows it so `px-172`, `h-64` are
 * design px. Below lg the screens use their `max-lg:` phone sizes at 1px.
 */
export const MEMBER_UNIT = '[--u:1px] lg:[--u:calc(100vw/1920)] [--spacing:var(--u)]'

export const TIERS = ['black', 'plus', 'free'] as const satisfies readonly PlanTier[]
export type Period = 'month' | 'year'
export const TIER_RANK: Record<PlanTier, number> = { free: 0, plus: 1, black: 2 }
export const TIER_LABEL: Record<PlanTier, string> = { black: 'Black', plus: 'Plus', free: 'Free' }

export const mur = (v: number) => `MUR ${Math.round(v).toLocaleString('en-US')}`

/** app parity: periodOf — "month" / "1year" plan types */
export function periodOf(plan: MembershipPlan): Period | null {
  const type = String(plan.type ?? '').toLowerCase()
  if (type === 'month') return 'month'
  if (type === '1year' || type === 'year') return 'year'
  return null
}

/** app parity: hasActiveMembership */
function hasActiveMembership(m: UserMembership | null) {
  if (!m) return false
  const expired = !!m.membership_expiry && Date.parse(m.membership_expiry) <= Date.now()
  const tier = String(m.membership_tier ?? '').trim().toLowerCase()
  return !!tier && !['none', 'inactive', 'free'].includes(tier) && !expired
}

/** The viewer's current tier — free when they have no live membership. */
export function activeTierOf(membership: UserMembership | null, plans: MembershipPlan[]): PlanTier {
  if (!hasActiveMembership(membership)) return 'free'
  const label = String(membership?.membership_tier ?? '').trim().toLowerCase()
  const matched = plans.find(p => p.plan_name.trim().toLowerCase() === label)
  if (matched) {
    const t = tierOf(matched)
    return (TIERS as readonly string[]).includes(t) ? (t as PlanTier) : 'plus'
  }
  if (label.includes('black')) return 'black'
  if (label.includes('plus') || label.includes('premium')) return 'plus'
  return 'free'
}

export type PlanCatalog = {
  byPeriod: Record<Period, Partial<Record<PlanTier, MembershipPlan>>>
  freePlan: MembershipPlan | null
  /** best saving across the paid plans — the toggle's "Save X%" */
  savePercent: number
  hasMonthly: boolean
  hasYearly: boolean
}

export function planCatalog(plans: MembershipPlan[]): PlanCatalog {
  const byPeriod: PlanCatalog['byPeriod'] = { month: {}, year: {} }
  let freePlan: MembershipPlan | null = null
  for (const plan of plans) {
    const tier = tierOf(plan)
    if (tier === 'free') { freePlan = freePlan ?? plan; continue }
    const period = periodOf(plan)
    if (period && (tier === 'black' || tier === 'plus') && !byPeriod[period][tier]) byPeriod[period][tier] = plan
  }
  const save = (period: Period) => Math.max(0, ...Object.values(byPeriod[period]).map(plan => {
    const amount = amountOf(plan?.amount)
    const original = amountOf(plan?.original_amount)
    return original > amount ? Math.round((1 - amount / original) * 100) : 0
  }))
  return {
    byPeriod,
    freePlan,
    savePercent: Math.max(save('month'), save('year')),
    hasMonthly: Object.keys(byPeriod.month).length > 0,
    hasYearly: Object.keys(byPeriod.year).length > 0,
  }
}

export const planFor = (catalog: PlanCatalog, tier: PlanTier, period: Period) =>
  tier === 'free' ? catalog.freePlan : catalog.byPeriod[period][tier] ?? null

/** Cashback rate and its multiple of the Free rate ("3%", 6). */
export function cashbackOf(catalog: PlanCatalog, plan: MembershipPlan | null) {
  const base = Number(catalog.freePlan?.cashback) || 0
  const pct = Number(plan?.cashback) || 0
  return {
    pct,
    label: plan?.cashback_label || (pct ? `${pct}%` : ''),
    multiplier: base > 0 && pct > 0 ? Math.round(pct / base) : 0,
  }
}

/** What the upgrade button does for this plan — app parity: Membership.jsx Continue. */
export function upgradeState(plan: MembershipPlan | null, tier: PlanTier, active: PlanTier, period: Period) {
  const amount = amountOf(plan?.amount)
  const target = TIER_RANK[tier]
  const current = TIER_RANK[active]
  const canContinue = !!plan && amount > 0 && target > 0 && target >= current
  const carry = current > 0 && target === current
    ? ' · adds to your current plan'
    : current > 0 && target > current ? ' · unused days carried over' : ''
  const per = period === 'month' ? '/mo' : '/yr'
  return {
    canContinue,
    label: canContinue ? `Get Privé ${TIER_LABEL[tier]} • ${mur(amount)}${per}` : tier === active ? 'Current Plan' : `Privé ${TIER_LABEL[tier]}`,
    billed: canContinue ? `Billed ${mur(amount)} ${period === 'month' ? 'monthly' : 'yearly'}${carry}` : '',
    checkoutHref: plan ? `/membership/checkout?plan=${encodeURIComponent(plan.id)}` : null,
  }
}
