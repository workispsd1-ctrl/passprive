export type GiftEvent = {
  id: string
  title: string
  image_url: string | null
  is_active: boolean
  created_at: string
}

export type GiftBrand = {
  id: string
  name: string
  type: 'store' | 'restaurant'
  discount_percentage: number | null
  gifting_card_image_url: string | null
  image: string | null
}

export type GiftDiscount = {
  id: string
  title: string
  description: string | null
  min_purchase_amount: number | null
  discount_percentage: number | null
  discount_amount: number | null
}

export type GiftCode = {
  id: string
  code: string
  amount: number
  status: 'active' | 'redeemed' | 'cancelled'
  created_at: string
}

export type GiftTransaction = {
  id: string
  amount: number
  type: 'redemption' | 'spend'
  gift_code_id: string | null
  created_at: string
}

export type GiftSummary = {
  balance: number
  transactions: GiftTransaction[]
}

export type RedeemResult = {
  success: boolean
  message: string
  amount: number
  new_balance: number
}

export type GiftPurchasePayload = {
  amount: number
  original_amount: number
  discount_amount: number
  gift_discount_id?: string
  store_id?: string
  restaurant_id?: string
  recipient_name?: string
  gift_title?: string
  gift_message?: string
  event_image_url?: string
}
