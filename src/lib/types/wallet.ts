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
  cashback_rate: number
  membership_tier: string
}
