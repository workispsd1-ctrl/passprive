/**
 * Client-side read of the user's cashback / Privé-credits balance.
 * Mirrors the app's `fetchCashbackBalance` (utils/cashbackApi.js) — the actual
 * upstream call + auth happens in /api/cashback/balance.
 */
export async function fetchCashbackBalance(): Promise<number> {
  try {
    const res = await fetch('/api/cashback/balance', { cache: 'no-store' })
    if (!res.ok) return 0
    const data = (await res.json()) as { balance?: unknown }
    const n = Number(data?.balance)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}
