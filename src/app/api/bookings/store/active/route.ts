import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ACTIVE_STATUSES = ['NEW', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY']

/**
 * The signed-in user's upcoming appointments at a store — app parity:
 * ServiceBookSlotScreen.jsx `onProceed` existing-booking check (unpaid
 * online orders don't count; pay-at-store ones do).
 */
export async function GET(request: Request) {
  const storeId = new URL(request.url).searchParams.get('store_id')
  if (!storeId) return NextResponse.json({ error: 'store_id is required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in to continue.' }, { status: 401 })

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('store_orders')
    .select('id, slot_start_at, slot_end_at, status, payment_status, payment_method')
    .eq('store_id', storeId)
    .eq('customer_user_id', user.id)
    .eq('service_type', 'APPOINTMENT')
    .not('status', 'in', '("CANCELLED","REJECTED","DELIVERED")')
    .gte('slot_start_at', todayStart.toISOString())
    .order('slot_start_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const bookings = (data ?? []).filter(o => {
    if (!ACTIVE_STATUSES.includes(String(o.status ?? '').toUpperCase())) return false
    if (o.payment_method === 'COD') return true
    return String(o.payment_status ?? '').toUpperCase() === 'PAID'
  })

  return NextResponse.json({ bookings })
}
