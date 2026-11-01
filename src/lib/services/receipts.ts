import { createClient } from '@/lib/supabase/server'
import {
  RECEIPT_MAX_BYTES,
  RECEIPT_STATUS,
  RECEIPT_TYPES,
  type BlackPlan,
  type ReceiptClaim,
  type ReceiptMerchant,
  type ReceiptQuote,
} from '@/lib/receipts'

export const RECEIPT_BUCKET = 'receipts'

const CLAIM_SUMMARY =
  'id, status, bill_amount, reward_amount, submitted_at, rejection_reason, restaurant_id, store_id'

export type ReceiptMerchantState = {
  loggedIn: boolean
  quote: ReceiptQuote | null
  latestClaim: ReceiptClaim | null
  blackPlan: BlackPlan | null
}

/**
 * Everything the "upload your receipt" banner on a merchant page needs —
 * app parity: ReceiptCashbackBanner.jsx (fetchReceiptRewardQuote +
 * fetchLatestClaimForRestaurant + fetchBlackPlan). The quote RPC needs a
 * signed-in viewer; signed out, the banner still shows the free rate.
 */
export async function getReceiptMerchantState({
  restaurantId,
  storeId,
}: {
  restaurantId?: string | null
  storeId?: string | null
}): Promise<ReceiptMerchantState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [quoteRes, claimRes, planRes] = await Promise.all([
    user
      ? supabase.rpc('receipt_reward_quote', {
          in_restaurant_id: storeId ? null : restaurantId || null,
          in_store_id: storeId || null,
        })
      : Promise.resolve({ data: null, error: null }),
    user
      ? supabase
          .from('receipt_claims')
          .select(CLAIM_SUMMARY)
          .eq('user_id', user.id)
          .eq(storeId ? 'store_id' : 'restaurant_id', storeId || restaurantId || '')
          .order('submitted_at', { ascending: false })
          .limit(1)
      : Promise.resolve({ data: null }),
    supabase
      .from('subscription')
      .select('plan_name, amount, original_amount, type')
      .eq('tier', 'black')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle(),
  ])

  const row = (quoteRes.data as { tier?: string; reward_percent?: number; black_percent?: number }[] | null)?.[0]
  const quote: ReceiptQuote | null = row
    ? { tier: row.tier || 'free', pct: Number(row.reward_percent) || 0, blackPct: Number(row.black_percent) || 0 }
    : null

  return {
    loggedIn: !!user,
    quote,
    latestClaim: ((claimRes.data as ReceiptClaim[] | null) ?? [])[0] ?? null,
    blackPlan: (planRes.data as BlackPlan | null) ?? null,
  }
}

/** One claim with the merchant it was filed against — app parity: fetchClaimWithMerchant. */
export async function getClaimWithMerchant(
  claimId: string,
): Promise<{ claim: ReceiptClaim; merchant: ReceiptMerchant | null } | null> {
  const supabase = await createClient()
  const { data: claim } = await supabase.from('receipt_claims').select('*').eq('id', claimId).maybeSingle()
  if (!claim) return null
  const c = claim as ReceiptClaim

  if (c.store_id) {
    const { data } = await supabase
      .from('stores')
      .select('id, name, cover_image, logo_url, category')
      .eq('id', c.store_id)
      .maybeSingle()
    const s = data as { id: string; name: string; cover_image: string | null; logo_url: string | null; category: string | null } | null
    return {
      claim: c,
      merchant: s
        ? { id: s.id, name: s.name, cover_image: s.cover_image || s.logo_url, cuisines: s.category ? [s.category] : [], kind: 'store' }
        : null,
    }
  }
  if (!c.restaurant_id) return { claim: c, merchant: null }
  const { data } = await supabase
    .from('restaurants')
    .select('id, name, cover_image, cuisines')
    .eq('id', c.restaurant_id)
    .maybeSingle()
  const r = data as { id: string; name: string; cover_image: string | null; cuisines: string[] | null } | null
  return {
    claim: c,
    merchant: r ? { id: r.id, name: r.name, cover_image: r.cover_image, cuisines: r.cuisines ?? [], kind: 'restaurant' } : null,
  }
}

export type ReceiptListRow = ReceiptClaim & {
  restaurant: { name: string; cover_image: string | null } | null
  store: { name: string; cover_image: string | null; logo_url: string | null } | null
}

/** "Your receipts" — app parity: fetchMyReceiptClaims (rejected claims are hidden). */
export async function getMyReceiptClaims(userId: string): Promise<ReceiptListRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('receipt_claims')
    .select(`${CLAIM_SUMMARY}, restaurant:restaurants(name, cover_image), store:stores(name, cover_image, logo_url)`)
    .eq('user_id', userId)
    .neq('status', RECEIPT_STATUS.REJECTED)
    .order('submitted_at', { ascending: false })
    .limit(100)
  return (data ?? []) as unknown as ReceiptListRow[]
}

/** Short-lived link to the private receipt photo. */
export async function receiptImageUrl(imagePath: string | null | undefined, expiresIn = 3600): Promise<string> {
  if (!imagePath) return ''
  const supabase = await createClient()
  const { data } = await supabase.storage.from(RECEIPT_BUCKET).createSignedUrl(imagePath, expiresIn)
  return data?.signedUrl ?? ''
}

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

/** sha256 of the photo — the claim's duplicate guard (app parity: hashReceiptImage). */
export async function hashReceipt(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
}

export type ReceiptPhoto = { ext: string; bytes: ArrayBuffer; hash: string }

/** Type/size check + hash, before anything is stored — app parity: extensionFor + uploadErrorMessage. */
export async function readReceiptPhoto(file: File): Promise<ReceiptPhoto | { error: string }> {
  const name = file.name.toLowerCase().split('?')[0]
  const fromName = name.includes('.') ? name.split('.').pop() ?? '' : ''
  const fromType = Object.keys(RECEIPT_TYPES).find(ext => file.type.toLowerCase().endsWith(`/${ext}`))
  const ext = RECEIPT_TYPES[fromName] ? fromName : fromType
  if (!ext) return { error: 'This file type is not supported. Please upload a JPG, PNG or HEIC photo of your receipt.' }
  if (file.size > RECEIPT_MAX_BYTES) return { error: 'This photo is too large. Please upload a photo under 10 MB.' }
  const bytes = await file.arrayBuffer()
  return { ext, bytes, hash: await hashReceipt(bytes) }
}

/** Stores the photo under `<user>/<timestamp>.<ext>` — app parity: uploadReceiptImage. */
export async function storeReceiptPhoto(
  supabase: ServerSupabase,
  userId: string,
  photo: ReceiptPhoto,
): Promise<{ path: string } | { error: string }> {
  const path = `${userId}/${Date.now()}.${photo.ext}`
  const { error } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .upload(path, photo.bytes, { contentType: RECEIPT_TYPES[photo.ext], upsert: false })
  return error ? { error: 'We could not upload your receipt. Please try again.' } : { path }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Bill amount + purchase date typed by the member (the web has no on-device OCR). */
export function parseClaimFields(form: FormData): { billAmount: number | null; purchaseDate: string | null } | { error: string } {
  const rawAmount = String(form.get('billAmount') ?? '').trim()
  const rawDate = String(form.get('purchaseDate') ?? '').trim()
  const billAmount = rawAmount ? Number(rawAmount.replace(/[^\d.]/g, '')) : null
  if (billAmount !== null && !(Number.isFinite(billAmount) && billAmount > 0)) {
    return { error: 'Enter the bill total in numbers, for example 2000.' }
  }
  if (rawDate && (!ISO_DATE.test(rawDate) || Number.isNaN(Date.parse(rawDate)))) {
    return { error: 'Enter the date of purchase, for example 2026-08-12.' }
  }
  if (rawDate && Date.parse(rawDate) > Date.now()) return { error: 'The date of purchase can’t be in the future.' }
  return { billAmount, purchaseDate: rawDate || null }
}
