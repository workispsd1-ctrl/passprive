import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { REVIEW_CONFIG, isReviewKind } from '@/lib/reviews'

/** Delete one of the user's own reviews — app parity: `deleteRestaurantReview`. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params
  if (!isReviewKind(kind)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  const config = REVIEW_CONFIG[kind]

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from(config.table)
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

  revalidatePath(config.path, 'page')
  if (kind === 'store') revalidatePath('/wellness/[id]', 'page')
  return NextResponse.json({ ok: true })
}
