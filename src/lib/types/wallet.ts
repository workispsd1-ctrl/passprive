export type WalletBalance = {
  balance: number
  updated_at: string
}

export type WalletTransaction = {
  id: string
  amount: number
  type: string
  created_at: string
  restaurant_id: string | null
  store_id: string | null
  restaurant_name?: string | null
}

export type UserCashbackInfo = {
  applicable: boolean                          // true if cashback > 0
  cashback_rate: number                        // 0 | 0.5 | 1.5 | 3
  membership_tier: 'free' | 'premium' | 'black'
  tier_label: string                           // 'Free' | 'Privé Premium' | 'Privé Black'
  merchant_type: 'preferred' | 'verified' | null
}
