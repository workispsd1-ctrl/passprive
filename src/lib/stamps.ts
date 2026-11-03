/** Collect stamps rules — app parity: screens/CollectStampsScreen.jsx + utils/storesApi.js. */
export type StampCardData = {
  id: string
  name: string
  location: string
  image: string
  href: string
  visits: number
  target?: number
}

export type StampSubscription = {
  status?: string | null
  repeat_rewards_enabled?: boolean | null
  starts_at?: string | null
  expires_at?: string | null
}

const FALLBACK_TARGET = 7

export function stampProgress(card: Pick<StampCardData, 'visits' | 'target'>) {
  const visits = Number(card.visits) || 0
  const total = Number(card.target) || FALLBACK_TARGET
  return { visits, total, complete: visits >= total }
}

export function giftLabel(card: Pick<StampCardData, 'visits' | 'target'>) {
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

export function sheetStatus(visits: number, total: number) {
  if (visits >= total) return 'Reward ready!'
  return total - visits <= 3 ? 'Almost there!' : ''
}

/** The goal is the highest tier; visits stop counting there. */
export function sheetProgress(reward: { visitCount?: number | null; tiers?: StampTier[] | null }) {
  const tiers = [...(reward.tiers ?? [])].sort((a, b) => (a.visitCount || 0) - (b.visitCount || 0))
  const goal = tiers[tiers.length - 1] ?? null
  const total = goal?.visitCount || 0
  const visits = Math.min(Number(reward.visitCount) || 0, total)
  const remaining = Math.max(0, total - visits)
  return { goal, total, visits, remaining, unlocked: total > 0 && remaining === 0, almostThere: remaining > 0 && remaining <= 3 }
}

const CANCELLED = ['cancelled', 'canceled', 'rejected', 'declined']
export const isCancelledStatus = (status: unknown) => CANCELLED.includes(String(status ?? '').toLowerCase())

/** Newest first, each numbered by when it happened. */
export function numberActivity<T>(rows: T[]) {
  return rows.map((row, i) => ({ ...row, stampNumber: i + 1 })).reverse()
}
