import { createClient } from '@/lib/supabase/server'

export type BillPayment = {
  id: string
  kind: 'restaurant' | 'store'
  merchantId: string | null
  name: string
  location: string
  image: string | null
  /** 'dining' for restaurants; the store's category otherwise */
  category: string
  /** what the member paid */
  amount: number
  billTotal: number | null
  discount: number | null
  credits: number | null
  orderId: string
  createdAt: string
  /** false for a session that never completed (abandoned / declined) */
  paid: boolean
  status: string
}

type SessionRow = {
  id: string
  restaurant_id: string | null
  store_id: string | null
  amount_major: number | string | null
  original_amount: number | string | null
  discount_amount: number | string | null
  cashback_amount: number | string | null
  tracking_id: string | null
  merchant_trace: string | null
  status: string | null
  created_at: string
}

// app parity: PriveCreditsScreen SUCCESS_STATUSES (+ VERIFIED_SUCCESS, which the app's payment poller treats as paid)
export const PAID_STATUSES = ['FINALIZED', 'SUCCESS', 'SUCCESSFUL', 'COMPLETED', 'PAID', 'CAPTURED', 'VERIFIED_SUCCESS']
const pos = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * The member's bill payments — app parity: TransactionsScreen / Profile.jsx
 * "Activity": `payment_sessions` (BILL_PAYMENT), newest first, resolved
 * against restaurants and stores.
 */
export async function getBillPayments(limit = 50): Promise<BillPayment[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('payment_sessions')
    .select('id, restaurant_id, store_id, amount_major, original_amount, discount_amount, cashback_amount, tracking_id, merchant_trace, status, created_at')
    .eq('user_id', user.id)
    .eq('payment_context', 'BILL_PAYMENT')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !data?.length) return []
  const rows = data as SessionRow[]

  const restaurantIds = [...new Set(rows.map(r => r.restaurant_id).filter((v): v is string => !!v))]
  const storeIds = [...new Set(rows.map(r => r.store_id).filter((v): v is string => !!v))]
  const [restaurants, stores] = await Promise.all([
    restaurantIds.length
      ? supabase.from('restaurants').select('id, name, area, city, cover_image').in('id', restaurantIds)
      : Promise.resolve({ data: [] }),
    storeIds.length
      ? supabase.from('stores').select('id, name, location_name, city, category, cover_image').in('id', storeIds)
      : Promise.resolve({ data: [] }),
  ])
  const rMap = new Map(((restaurants.data ?? []) as { id: string; name: string; area: string | null; city: string | null; cover_image: string | null }[]).map(r => [r.id, r]))
  const sMap = new Map(((stores.data ?? []) as { id: string; name: string; location_name: string | null; city: string | null; category: string | null; cover_image: string | null }[]).map(s => [s.id, s]))

  return rows.map(row => {
    const status = String(row.status ?? '').toUpperCase()
    const base = {
      id: row.id,
      amount: Number(row.amount_major) || 0,
      billTotal: pos(row.original_amount),
      discount: pos(row.discount_amount),
      credits: pos(row.cashback_amount) != null ? Math.round(Number(row.cashback_amount)) || null : null,
      orderId: row.tracking_id || row.merchant_trace || '',
      createdAt: row.created_at,
      paid: PAID_STATUSES.includes(status),
      status,
    }
    if (row.restaurant_id || !row.store_id) {
      const r = row.restaurant_id ? rMap.get(row.restaurant_id) : undefined
      return {
        ...base,
        kind: 'restaurant' as const,
        merchantId: row.restaurant_id,
        name: r?.name ?? 'Restaurant',
        location: [r?.area, r?.city].filter(Boolean).join(', '),
        image: r?.cover_image ?? null,
        category: 'dining',
      }
    }
    const s = sMap.get(row.store_id)
    return {
      ...base,
      kind: 'store' as const,
      merchantId: row.store_id,
      name: s?.name ?? 'Store',
      location: s?.location_name || s?.city || '',
      image: s?.cover_image ?? null,
      category: String(s?.category ?? 'shopping').trim().toLowerCase() || 'shopping',
    }
  })
}
