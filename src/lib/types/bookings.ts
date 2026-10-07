export type DiningBooking = {
  id: string
  restaurant_id: string
  booking_date: string
  booking_time: string
  party_size: number
  status: string
  booking_code: string
  source: string | null
  customer_name: string | null
  special_request: string | null
  restaurants: {
    id: string
    name: string
    slug: string
    cover_image: string | null
    area: string | null
    full_address: string | null
    cost_for_two: number | null
    merchant_type: 'preferred_partner' | 'verified_pay' | null
  } | null
}

/** A store order / service appointment — app parity: YourBookingsScreen `store_orders` rows. */
export type StoreBooking = {
  id: string
  store_id: string
  status: string
  service_type: string | null
  total_amount: number | null
  slot_start_at: string | null
  created_at: string
  store: {
    id: string
    name: string
    slug: string | null
    cover_image: string | null
    category: string | null
    location_name: string | null
    city: string | null
  } | null
}
