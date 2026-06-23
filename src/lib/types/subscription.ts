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

import { PREFERRED_PARTNER_RATES, VERIFIED_PAY_RATE } from '@/lib/constants/cashback'

// Maps subscription product_id → canonical tier name used throughout the app
export const PLAN_TIER: Record<string, string> = {
  BasePlan_1: 'premium',
  black_tier: 'black',
  'Privé Black': 'black',
  'Privé Premium': 'premium',
}

export const TIER_PERKS: Record<string, string[]> = {
  none: [
    `${PREFERRED_PARTNER_RATES.none}% reward on every eligible PassPrivé payment`,
    'Access to the PassPrivé marketplace',
    'Restaurant & lifestyle discovery',
    'PassPrivé payment access',
    'Access to public merchant offers',
  ],
  premium: [
    'Everything in Privé Free',
    `${PREFERRED_PARTNER_RATES.premium}% reward at Preferred Partners`,
    `${VERIFIED_PAY_RATE}% reward at Verified Pay Partners`,
    'Access to Premium offers and campaigns',
    'Greater value when choosing Preferred Partners',
    'Selected member-only benefits',
  ],
  black: [
    'Everything in Privé Premium',
    `${PREFERRED_PARTNER_RATES.black}% reward at Preferred Partners — our highest rate`,
    `${VERIFIED_PAY_RATE}% reward at Verified Pay Partners`,
    'Access to Black offers, campaigns and experiences',
    'Priority access to premium benefits',
    'Highest standard PassPrivé reward rate',
  ],
}
