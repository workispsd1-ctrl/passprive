import { createClient } from '@/lib/supabase/server'

const PAYMENTS_API = (process.env.PAYMENTS_API_URL ?? 'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '')

export type CashbackTx = {
  id: string
  /** 'credit' = earned; anything else = used */
  type: string
  amount: number
  createdAt: string
  status: string
}

export type CashbackSummary = { balance: number; transactions: CashbackTx[] }

const n = (v: unknown) => {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

/**
 * The member's Privé Credits — app parity: cashbackApi.js fetchCashbackSummary
 * (GET {PAYMENTS_API}/api/cashback/summary), the source the app's Profile and
 * Privé Credits screens read, so the website shows the same balance and
 * history. Holds that were RELEASED are dropped, as in the app. Null when
 * signed out or the service can't be reached.
 */
export async function getCashbackSummary(): Promise<CashbackSummary | null> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  try {
    const res = await fetch(`${PAYMENTS_API}/api/cashback/summary`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const payload = (await res.json()) as { balance?: unknown; transactions?: Record<string, unknown>[] }
    const transactions = (Array.isArray(payload.transactions) ? payload.transactions : [])
      .filter(t => String(t.status ?? '').toUpperCase() !== 'RELEASED')
      .map((t, i) => ({
        id: String(t.id ?? `${t.created_at ?? t.createdAt ?? ''}-${i}`),
        type: String(t.type ?? ''),
        amount: n(t.amount),
        createdAt: String(t.created_at ?? t.createdAt ?? ''),
        status: String(t.status ?? ''),
      }))
    return { balance: n(payload.balance), transactions }
  } catch {
    return null
  }
}
