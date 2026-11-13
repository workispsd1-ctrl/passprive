/** Collect stamps rules — app parity: screens/CollectStampsScreen.jsx + utils/storesApi.js. */
export type StampCardData = {
  id: string
  name: string
  location: string
  image: string
  href: string
  visits: number
  target?: number
  /** the member already redeemed this place's reward (repeat_reward_progress / *_repeat_reward `claimed`) */
  claimed?: boolean
}

export type StampSubscription = {
  status?: string | null
  repeat_rewards_enabled?: boolean | null
  starts_at?: string | null
  expires_at?: string | null
}

const FALLBACK_TARGET = 7

/** app parity: CollectStampsScreen StampCard — a claimed reward is no longer "complete". */
export function stampProgress(card: Pick<StampCardData, 'visits' | 'target' | 'claimed'>) {
  const visits = Number(card.visits) || 0
  const total = Number(card.target) || FALLBACK_TARGET
  return { visits, total, complete: visits >= total && !card.claimed }
}

export function giftLabel(card: Pick<StampCardData, 'visits' | 'target' | 'claimed'>) {
  if (card.claimed) return 'Reward claimed'
  const { visits, complete } = stampProgress(card)
  if (complete) return 'Reward ready!'
  return visits > 0 ? 'Reveal gift now' : 'Reveal gift after a visit'
}

function subscriptionIsLive(s: StampSubscription, now: number) {
  if (String(s.status ?? '').toLowerCase() !== 'active') return false
  if (s.starts_at && Date.parse(s.starts_at) > now) return false
  return !(s.expires_at && Date.parse(s.expires_at) <= now)
}

export function storeCollectsStamps(
  store: { store_subscriptions?: StampSubscription[] | null },
  now = Date.now(),
) {
  return (store.store_subscriptions ?? []).some(s => subscriptionIsLive(s, now) && s.repeat_rewards_enabled === true)
}

export type StampTier = { rewardType?: string | null; visitCount?: number | null; rewardLabel?: string | null; rewardValue?: number | string | null }

export function rewardText(tier: StampTier | null | undefined) {
  const v = tier?.rewardValue
  switch (tier?.rewardType) {
    case 'FREE_ITEM':
      return tier?.rewardLabel || 'a free item'
    case 'FLAT':
      return v ? `MUR ${v} off` : 'a discount'
    case 'PERCENT':
      return v ? `${v}% off` : 'a discount'
    default:
      return tier?.rewardLabel || 'a reward'
  }
}

const STAMP_START = [255, 197, 61]
const STAMP_END = [58, 164, 86]

/** Gold on the first stamp, green on the last. */
export function stampColor(index: number, total: number) {
  const f = total <= 1 ? 0 : index / (total - 1)
  const [r, g, b] = STAMP_START.map((s, k) => Math.round(s + (STAMP_END[k] - s) * f))
  return `rgb(${r}, ${g}, ${b})`
}

export function sheetStatus(visits: number, total: number, claimed = false) {
  if (claimed) return 'Reward claimed'
  if (visits >= total) return 'Reward ready!'
  return total - visits <= 3 ? 'Almost there!' : ''
}

/** The goal is the highest tier; visits stop counting there. */
export function sheetProgress(reward: { visitCount?: number | null; tiers?: StampTier[] | null; claimed?: boolean | null }) {
  const tiers = [...(reward.tiers ?? [])].sort((a, b) => (a.visitCount || 0) - (b.visitCount || 0))
  const goal = tiers[tiers.length - 1] ?? null
  const total = goal?.visitCount || 0
  const visits = Math.min(Number(reward.visitCount) || 0, total)
  const remaining = Math.max(0, total - visits)
  const claimed = !!reward.claimed
  // app parity: StampDetailScreen — a claimed reward isn't "unlocked" again
  return { goal, total, visits, remaining, claimed, unlocked: total > 0 && remaining === 0 && !claimed, almostThere: remaining > 0 && remaining <= 3 }
}

const mauritiusDay = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Indian/Mauritius' })

/**
 * Stamp activity from paid bills — app parity: StampDetailScreen.jsx. Bills
 * come oldest first; only the first bill of each Mauritius calendar day earns
 * a stamp. Returned newest first, numbered in the order they were earned.
 */
export function stampVisits(bills: { id: string; created_at: string }[]) {
  const seenDays = new Set<string>()
  const rows: { id: string; date: string }[] = []
  for (const bill of bills) {
    const day = mauritiusDay(bill.created_at)
    if (seenDays.has(day)) continue
    seenDays.add(day)
    rows.push({ id: String(bill.id), date: bill.created_at })
  }
  return numberActivity(rows)
}

/** Newest first, each numbered by when it happened. */
export function numberActivity<T>(rows: T[]) {
  return rows.map((row, i) => ({ ...row, stampNumber: i + 1 })).reverse()
}
