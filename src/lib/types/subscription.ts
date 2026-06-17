export type SubscriptionPlan = {
  id: string
  plan_name: string
  amount: string
  type: string
  cashback: number
  sort_order: number
  product_id: string
  price_id: string
}

export type UserMembership = {
  membership_tier: string
  membership_started: string | null
  membership_expiry: string | null
  cashback_rate: number
}

export const TIER_PERKS: Record<string, string[]> = {
  none: [
    '0.5% cashback on every bill',
    'Access to dining offers',
    'Restaurant discovery',
  ],
  premium: [
    '2% cashback on every bill',
    'Exclusive dining discounts up to 50% off',
    'Complimentary dishes at select restaurants',
    'Priority table reservations',
    'Bank offer stacking',
  ],
  black: [
    '4% cashback on every bill',
    'All Privé Premium benefits',
    'VIP dining experiences',
    'Curated event invitations',
    'Personal concierge access',
    'Early access to new venues',
  ],
}
