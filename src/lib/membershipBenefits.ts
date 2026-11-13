/**
 * Privé benefit catalog — Figma "Subscription plan" / "Privé benefits"
 * (Desktop 1920). Which plan gets which benefit, the copy and the order all
 * come from that design; the `subscription` table only carries prices,
 * cashback and deal-reveal counts, so those parts are filled in from the plan
 * at render time (see `benefitSub`).
 */

export type PlanTier = 'black' | 'plus' | 'free'

export type BenefitKey =
  | 'free-meals'
  | 'mocktails'
  | 'takeaway'
  | 'birthday'
  | 'deal-reveals'
  | 'top-deals'
  | 'retail-cashback'
  | 'table-cashback'
  | 'priority-support'
  | 'events'

export type Benefit = {
  key: BenefitKey
  section: 'DINING' | 'DEALS & CASHBACK' | 'MEMBERSHIP'
  title: string
  /** orange line under the title — overridden per plan for data-backed benefits */
  sub: string
  description: string
  tiers: PlanTier[]
  /** shown with a "SOON" chip */
  soon?: boolean
  /** "How it works" steps */
  steps?: string[]
}

/** Monthly meal credit on Privé Black (Figma: "MUR 500 in free meals"). */
export const FREE_MEALS_MUR = 500

export const BENEFITS: Benefit[] = [
  {
    key: 'free-meals',
    section: 'DINING',
    title: 'Free meals',
    sub: `MUR ${FREE_MEALS_MUR} every month`,
    description: `MUR ${FREE_MEALS_MUR} of meal credit at partner restaurant every month. Credit resets on the 1st and doesn’t roll over.`,
    tiers: ['black'],
  },
  {
    key: 'mocktails',
    section: 'DINING',
    title: 'Bottomless mocktails',
    sub: 'At peninsula',
    description: 'Unlimited mocktails with your meal at peninsula restaurant. Show your Black membership when you order',
    tiers: ['black'],
  },
  {
    key: 'takeaway',
    section: 'DINING',
    title: 'Order takeway',
    sub: 'Straight from the app',
    description: 'Order takeaway from partner restaurants straight from the app.',
    tiers: ['free', 'plus', 'black'],
  },
  {
    key: 'birthday',
    section: 'DINING',
    title: 'Birthday treat',
    sub: 'Birthday month',
    description: 'A treat from partner restaurants during your birthday month.',
    tiers: ['plus', 'black'],
  },
  {
    key: 'deal-reveals',
    section: 'DEALS & CASHBACK',
    title: 'Deal reveals',
    sub: 'Unlimited, every month',
    description: 'See the full discount on any deal before you go.',
    tiers: ['free', 'plus', 'black'],
  },
  {
    key: 'top-deals',
    section: 'DEALS & CASHBACK',
    title: 'Top % deals',
    sub: 'Biggest discount first',
    description: 'The biggest % discounts open to Black members first.',
    tiers: ['black'],
  },
  {
    key: 'retail-cashback',
    section: 'DEALS & CASHBACK',
    title: 'Cashback on retail',
    sub: 'Cashback',
    description: 'Earn cashback at retail outlets in Mauritius listed on the app. Upload your receipt to claim.',
    tiers: ['free', 'plus', 'black'],
    steps: ['Shop at any outlet listed on the app', 'Snap your receipt in the Cashback tab', 'Cashback is added once it’s approved'],
  },
  {
    key: 'table-cashback',
    section: 'DEALS & CASHBACK',
    title: 'Table cashback',
    sub: 'On every booking',
    description: 'Book a table anywhere in Mauritius and get cashback on every booking.',
    tiers: ['plus', 'black'],
    soon: true,
  },
  {
    key: 'priority-support',
    section: 'MEMBERSHIP',
    title: 'Priority support',
    sub: 'Priority',
    description: 'Reach a real person faster when you need help with a booking or claim.',
    tiers: ['black'],
  },
  {
    key: 'events',
    section: 'MEMBERSHIP',
    title: 'Members-only events',
    sub: 'Invites only',
    description: 'Invites to tastings and launches at partner venues.',
    tiers: ['black'],
  },
]

export const BENEFIT_SECTIONS = ['DINING', 'DEALS & CASHBACK', 'MEMBERSHIP'] as const

export const benefitIncluded = (key: BenefitKey, tier: PlanTier) =>
  BENEFITS.find(b => b.key === key)?.tiers.includes(tier) ?? false

/** "Unlimited, every month" / "50 every month" — the plan's `deals_per_month`. */
export const dealsLine = (dealsPerMonth: number | null | undefined) =>
  dealsPerMonth == null ? 'Unlimited, every month' : `${dealsPerMonth} every month`
