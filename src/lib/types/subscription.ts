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
    '0.5% reward on every eligible PassPrivé payment',
    'Access to the PassPrivé marketplace',
    'Restaurant & lifestyle discovery',
    'PassPrivé payment access',
    'Access to public merchant offers',
  ],
  premium: [
    'Everything in Privé Free',
    '2% reward at Preferred Partners',
    '0.5% reward at Verified Pay Partners',
    'Access to Premium offers and campaigns',
    'Greater value when choosing Preferred Partners',
    'Selected member-only benefits',
  ],
  black: [
    'Everything in Privé Premium',
    '4% reward at Preferred Partners — our highest rate',
    '0.5% reward at Verified Pay Partners',
    'Access to Black offers, campaigns and experiences',
    'Priority access to premium benefits',
    'Highest standard PassPrivé reward rate',
  ],
}
