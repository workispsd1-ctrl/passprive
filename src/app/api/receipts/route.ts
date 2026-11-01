import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RECEIPT_STATUS, type ReceiptClaim } from '@/lib/receipts'
import { parseClaimFields, readReceiptPhoto, storeReceiptPhoto } from '@/lib/services/receipts'

/**
 * Submit a receipt claim — app parity: ReviewReceiptScreen.submit
 * (precheckReceipt → uploadReceiptImage → createReceiptClaim). The precheck
 * RPC runs before the upload so a duplicate or wrong bill never stores a photo.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to submit a receipt' }, { status: 401 })

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!form || !(file instanceof File) || !file.size) {
    return NextResponse.json({ error: 'Choose a photo of your receipt.' }, { status: 400 })
  }
  const storeId = String(form.get('storeId') ?? '') || null
  const restaurantId = storeId ? null : String(form.get('restaurantId') ?? '') || null
  if (!storeId && !restaurantId) return NextResponse.json({ error: 'Missing merchant' }, { status: 400 })
  const dealId = String(form.get('dealId') ?? '') || null

  const fields = parseClaimFields(form)
  if ('error' in fields) return NextResponse.json({ error: fields.error }, { status: 400 })
  const photo = await readReceiptPhoto(file)
  if ('error' in photo) return NextResponse.json({ error: photo.error }, { status: 400 })

  // A non-null result is the reason this bill can't be claimed (duplicate, wrong merchant, …).
  const { data: rejection } = await supabase.rpc('receipt_precheck', {
    p_restaurant_id: restaurantId,
    p_store_id: storeId,
    p_ocr_text: null,
    p_ocr_ran: false,
    p_bill_amount: fields.billAmount,
    p_purchase_date: fields.purchaseDate,
    p_purchased_at: null,
    p_image_hash: photo.hash,
    p_receipt_number: null,
  })
  if (rejection) return NextResponse.json({ rejection: String(rejection) }, { status: 422 })

  const stored = await storeReceiptPhoto(supabase, user.id, photo)
  if ('error' in stored) return NextResponse.json({ error: stored.error }, { status: 502 })

  const { data, error } = await supabase
    .from('receipt_claims')
    .insert({
      user_id: user.id,
      restaurant_id: restaurantId,
      store_id: storeId,
      deal_id: dealId,
      image_path: stored.path,
      bill_amount: fields.billAmount,
      purchase_date: fields.purchaseDate,
      purchased_at: null,
      amount_source: fields.billAmount == null ? null : 'user',
      ocr_text: null,
      image_hash: photo.hash,
      receipt_number: null,
      ocr_ran: false,
      status: RECEIPT_STATUS.SUBMITTED,
    })
    .select('*')
    .single()

  if (error) {
    // 23505: one of the uniqueness guards fired — this bill is already claimed.
    const message = error.code === '23505'
      ? 'This receipt has already been claimed. Upload a different bill.'
      : 'Could not submit the receipt. Please try again.'
    return NextResponse.json({ error: message }, { status: error.code === '23505' ? 409 : 500 })
  }
  const claim = data as ReceiptClaim
  // The insert trigger can reject outright (e.g. not a receipt at all).
  if (claim.status === RECEIPT_STATUS.REJECTED) {
    return NextResponse.json(
      { rejection: claim.rejection_reason || 'This does not look like a valid receipt. Please upload the printed bill.' },
      { status: 422 },
    )
  }
  return NextResponse.json({ claim })
}
