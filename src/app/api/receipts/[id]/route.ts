import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isPendingStatus, type ReceiptClaim } from '@/lib/receipts'
import { getClaimWithMerchant, parseClaimFields, readReceiptPhoto, storeReceiptPhoto } from '@/lib/services/receipts'

type Ctx = { params: Promise<{ id: string }> }

/** One claim + its merchant, polled by the status page while it's under review. */
export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params
  const result = await getClaimWithMerchant(id)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
}

/**
 * Edit a claim still under review — app parity: EditClaimScreen.save. The
 * amount and date are the member's (`amount_source: 'user'`); a replacement
 * photo is stored and re-hashed.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to edit your claim' }, { status: 401 })

  const { data: existing } = await supabase.from('receipt_claims').select('id, status, purchase_date').eq('id', id).maybeSingle()
  const claim = existing as Pick<ReceiptClaim, 'id' | 'status' | 'purchase_date'> | null
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isPendingStatus(claim.status)) {
    return NextResponse.json({ error: 'This claim has already been reviewed.' }, { status: 409 })
  }

  const form = await request.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  const fields = parseClaimFields(form)
  if ('error' in fields) return NextResponse.json({ error: fields.error }, { status: 400 })

  const file = form.get('file')
  const patch: Record<string, unknown> = {
    bill_amount: fields.billAmount,
    amount_source: 'user',
  }

  if (file instanceof File && file.size) {
    const photo = await readReceiptPhoto(file)
    if ('error' in photo) return NextResponse.json({ error: photo.error }, { status: 400 })
    const stored = await storeReceiptPhoto(supabase, user.id, photo)
    if ('error' in stored) return NextResponse.json({ error: stored.error }, { status: 502 })
    patch.image_path = stored.path
    patch.image_hash = photo.hash
    patch.purchased_at = null
    patch.purchase_date = fields.purchaseDate
  } else if (!claim.purchase_date) {
    // app parity: a date read off the original photo is locked unless the photo changes
    patch.purchase_date = fields.purchaseDate
  }

  const { data, error } = await supabase.from('receipt_claims').update(patch).eq('id', id).select('*').single()
  if (error) {
    const message = error.code === '23505'
      ? 'This receipt has already been claimed. Upload a different bill.'
      : 'Could not save your changes. Please try again.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
  return NextResponse.json({ claim: data })
}
