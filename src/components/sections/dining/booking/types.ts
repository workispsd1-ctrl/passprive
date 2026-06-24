export type MealPeriod = 'lunch' | 'dinner'

export interface BookingResult {
  bookingCode: string
  bookingId: string
  date: string
  time: string
  guests: number
  name: string
  phone: string
  coverChargeRequired: boolean
  coverChargeTotal: number
}

export interface DateOption {
  label: string
  value: string
  isClosed: boolean
}

export interface SlotOption {
  label: string
  value: string
}
