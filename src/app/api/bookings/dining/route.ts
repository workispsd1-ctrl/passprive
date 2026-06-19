import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateBookingCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = 'PP'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await request.json() as {
    restaurant_id: string
    booking_date: string
    booking_time: string
    party_size: number
    customer_name: string
    customer_phone: string
    special_request?: string | null
  }

  const { restaurant_id, booking_date, booking_time, party_size, customer_name, customer_phone, special_request } = body

  if (!restaurant_id || !booking_date || !booking_time || !party_size || !customer_name || !customer_phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const booking_code = generateBookingCode()

  const { data: restaurantData } = await supabase
    .from('restaurants')
    .select('cover_charge_enabled, cover_charge_amount')
    .eq('id', restaurant_id)
    .single()

  const coverChargeEnabled = restaurantData?.cover_charge_enabled ?? false
  const coverChargeAmount = restaurantData?.cover_charge_amount ?? null

  const { data, error } = await supabase
    .from('restaurant_bookings')
    .insert({
      restaurant_id,
      customer_user_id: user?.id ?? null,
      customer_name,
      customer_phone,
      customer_email: user?.email ?? null,
      booking_date,
      booking_time,
      party_size,
      special_request: special_request ?? null,
      booking_code,
      status: 'pending',
      ...(coverChargeEnabled && coverChargeAmount != null ? {
        payment_required: true,
        payment_amount: coverChargeAmount * party_size,
        payment_status: 'pending',
      } : {}),
    })
    .select('id, booking_code')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    booking_code: data.booking_code,
    id: data.id,
    cover_charge_required: coverChargeEnabled && coverChargeAmount != null,
    cover_charge_amount: coverChargeEnabled ? (coverChargeAmount ?? 0) * party_size : 0,
  })
}
