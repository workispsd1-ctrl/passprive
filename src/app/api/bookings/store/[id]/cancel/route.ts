import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** app parity: ServiceBookSlotScreen.jsx `handleCancelExistingBooking`. */
export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in to continue.' }, { status: 401 })

  const { error } = await supabase
    .from('store_orders')
    .update({ status: 'CANCELLED' })
    .eq('id', id)
    .eq('customer_user_id', user.id)
    .not('status', 'in', '("CANCELLED","REJECTED","DELIVERED")')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
