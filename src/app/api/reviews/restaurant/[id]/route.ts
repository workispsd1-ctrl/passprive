import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/** Delete one of the user's own reviews — app parity: `deleteRestaurantReview`. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('restaurant_reviews')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data?.length) {
    return NextResponse.json({ error: 'Review not found.' }, { status: 404 })
  }

  revalidatePath('/dining/[id]', 'page')
  return NextResponse.json({ ok: true })
}
