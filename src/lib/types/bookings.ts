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
  proposed_date?: string | null
  proposed_time?: string | null
  proposed_at?: string | null
} & CoverRequestFields & {
  restaurants: {
    id: string
    name: string
    slug: string
    cover_image: string | null
    area: string | null
    full_address: string | null
    cost_for_two: number | null
    merchant_type: 'preferred_partner' | 'verified_pay' | null
    cancellation_available?: boolean | null
    cancellation_cutoff_minutes?: number | null
  } | null
}

/** A merchant's request for a cover charge on a booking — app parity: CoverRequestBox COVER_REQUEST_COLUMNS. */
export type CoverRequestFields = {
  cover_request_status?: string | null
  /** still to pay */
  cover_request_amount?: number | string | null
  /** the whole cover charge asked for */
  cover_request_total?: number | string | null
  cover_request_due_at?: string | null
}

/** A store order / service appointment — app parity: YourBookingsScreen `store_orders` rows. */
export type StoreBooking = CoverRequestFields & {
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
