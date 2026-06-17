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
  } | null
}
