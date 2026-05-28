export type DiningBooking = {
  id: string
  restaurant_id: string
  booking_date: string
  booking_time: string
  party_size: number
  status: string
  booking_code: string
  restaurants: {
    id: string
    name: string
    slug: string
    cover_image: string | null
    area: string | null
    full_address: string | null
  } | null
}
