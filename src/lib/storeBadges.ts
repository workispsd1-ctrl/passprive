import type { MerchantCardTag } from '@/components/sections/home/MerchantCard'

type Subscription = { status: string | null; pickup_premium_enabled?: boolean | null; repeat_rewards_enabled?: boolean | null }
type WithSubscriptions = { store_subscriptions?: Subscription[] | null }

/** app parity: storesApi.js normalizeStoreRow — the store's subscriptions whose status is "active". */
function activeSubscriptions(store: WithSubscriptions): Subscription[] {
  return (store.store_subscriptions ?? []).filter(s => String(s?.status ?? '').toLowerCase() === 'active')
}

/** app parity: storesApi.js `subscribed` — the store has an active subscription. */
export function isSubscribed(store: WithSubscriptions): boolean {
  return activeSubscriptions(store).length > 0
}

/** app parity: storesApi.js `pickup_premium_enabled` — read from the store's primary (first active) subscription. */
export function isPickupPremium(store: WithSubscriptions): boolean {
  return activeSubscriptions(store)[0]?.pickup_premium_enabled === true
}

/**
 * The store runs a stamp sheet — an active subscription with repeat rewards
 * on (app parity: storesApi.js `repeat_rewards_enabled`). The detail page
 * shows the stamp card for exactly these stores.
 */
export function hasStampSheet(store: WithSubscriptions): boolean {
  return activeSubscriptions(store).some(s => s.repeat_rewards_enabled === true)
}

/**
 * Card tags — StoresCard.jsx getTags: "Stamp sheet" then "Exclusive". Unlike
 * the app (which tags every subscribed store "Stamp sheet"), "Stamp sheet"
 * needs a real stamp program, so a card never promises stamps the detail page
 * doesn't have. "Exclusive" is the app's rule: a subscribed store; the detail
 * page shows the same tag. The app's "Trending" tag reads `isAdvertised`,
 * which store rows never carry, so store cards never show it.
 */
export function storeCardTags(store: WithSubscriptions): MerchantCardTag[] {
  const tags: MerchantCardTag[] = []
  if (hasStampSheet(store)) tags.push({ label: 'Stamp sheet', icon: 'stamp' })
  if (isSubscribed(store)) tags.push({ label: 'Exclusive', icon: 'exclusive' })
  return tags
}
