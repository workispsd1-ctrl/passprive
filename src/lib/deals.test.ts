import { describe, expect, it } from 'vitest'
import {
  bestFirst,
  dealItem,
  dealTierCaps,
  formatPercent,
  isQuotaExhausted,
  isRepeatRewardOffer,
  offerItem,
  offerTierCaps,
  pickDealsForTier,
  planTierSlug,
  quotaFraction,
  quotaText,
  revealDisplay,
  unlocksLeftLabel,
  type DealQuota,
  type RestaurantDeal,
} from './deals'

const quota = (used: number, limit: number | null) => ({ monthly_used: used, monthly_limit: limit }) as DealQuota

describe('monthly unlock quota', () => {
  it('is exhausted only at the limit', () => {
    expect(isQuotaExhausted(quota(4, 5))).toBe(false)
    expect(isQuotaExhausted(quota(5, 5))).toBe(true)
    expect(isQuotaExhausted(quota(6, 5))).toBe(true)
  })

  it('is never exhausted when unlimited or unknown', () => {
    expect(isQuotaExhausted(quota(99, null))).toBe(false)
    expect(isQuotaExhausted(null)).toBe(false)
  })

  it('describes what is left', () => {
    expect(quotaText(quota(2, 5))).toBe('2/5')
    expect(unlocksLeftLabel(quota(4, 5))).toBe('1 unlock left this month')
    expect(unlocksLeftLabel(quota(3, 5))).toBe('2 unlocks left this month')
    expect(unlocksLeftLabel(quota(5, 5))).toBe('No unlocks left')
    expect(unlocksLeftLabel(quota(7, 5))).toBe('No unlocks left')
  })

  it('keeps the progress bar between 0 and 1', () => {
    expect(quotaFraction(quota(1, 4))).toBe(0.25)
    expect(quotaFraction(quota(9, 4))).toBe(1)
    expect(quotaFraction(quota(1, 0))).toBe(0)
  })
})

describe('stamp-card offers are not deals', () => {
  it('recognises them by kind or by a custom "on Nth visit" title', () => {
    expect(isRepeatRewardOffer({ metadata: { offerKind: 'VISIT' }, offer_type: 'flat', title: 'x' })).toBe(true)
    expect(isRepeatRewardOffer({ metadata: null, offer_type: 'custom', title: 'Free Coke on 3rd visit' })).toBe(true)
    expect(isRepeatRewardOffer({ metadata: null, offer_type: 'flat', title: 'Flat 100 off' })).toBe(false)
  })

  it('are left out of the reveal list', () => {
    const base = { id: '1', badge_text: null, discount_value: null }
    expect(offerItem({ ...base, title: 'Free Coke on 3rd visit', offer_type: 'custom' }, 'restaurant_offer')).toBeNull()
  })

  it('leave out expired offers too', () => {
    const live = { id: '2', title: 'Flat 100', badge_text: null, offer_type: 'flat', discount_value: 100 }
    expect(offerItem({ ...live, end_at: '2020-01-01T00:00:00Z' }, 'restaurant_offer')).toBeNull()
    expect(offerItem(live, 'restaurant_offer')?.score).toBe(100)
  })
})

describe('pickDealsForTier', () => {
  const deal = (over: Partial<RestaurantDeal> = {}): RestaurantDeal => ({
    id: 'd1',
    title: 'Deal',
    description: null,
    badge_text: null,
    deal_type: 'percent',
    currency_code: 'MUR',
    priority: 1,
    restaurant_deal_tiers: [{ tier: 'black', is_active: true }, { tier: 'free', is_active: false }] as RestaurantDeal['restaurant_deal_tiers'],
    ...over,
  })

  it('gives a member only the deals of their own tier, ignoring case', () => {
    expect(pickDealsForTier([deal()], 'BLACK')).toHaveLength(1)
    expect(pickDealsForTier([deal()], 'plus')).toEqual([])
  })

  it('skips switched-off tier rows, expired deals and an unknown tier', () => {
    expect(pickDealsForTier([deal()], 'free')).toEqual([])
    expect(pickDealsForTier([deal({ ends_at: '2020-01-01T00:00:00Z' })], 'black')).toEqual([])
    expect(pickDealsForTier([deal()], null)).toEqual([])
  })
})

describe('bestFirst', () => {
  it('sorts by saving and keeps ties in order', () => {
    const items = [{ id: 'a', score: 10 }, { id: 'b', score: 50 }, { id: 'c', score: 10 }]
    expect(bestFirst(items).map(i => i.id)).toEqual(['b', 'a', 'c'])
  })
})

// app parity: utils/dealReveals.js dealTierCaps / planTierSlug, DealRevealCard benefit + upTo
describe('deal reveal tiers', () => {
  const tierRow = (tier: string, pct: number | null, active = true) =>
    ({ tier, benefit_percent: pct, benefit_amount: null, deal_price: null, buy_quantity: null, get_quantity: null, free_item_label: null, is_active: active })

  it('caps a deal at each active tier\'s percent', () => {
    const deal = { restaurant_deal_tiers: [tierRow('Free', 2), tierRow('plus', 5), tierRow('black', 10, false), tierRow('x', 0)] } as RestaurantDeal
    expect(dealTierCaps(deal)).toEqual({ free: 2, plus: 5 })
  })

  it('caps an offer from metadata.tier_percents when set', () => {
    expect(offerTierCaps({ discount_value: 20, metadata: { tier_percents: { free: 3, plus: 0, black: 150 } } })).toEqual({ free: 3 })
  })

  it('splits an offer\'s discount a quarter / half / all by plan', () => {
    expect(offerTierCaps({ discount_value: 10, metadata: null })).toEqual({ free: 2.5, plus: 5, black: 10 })
    expect(offerTierCaps({ discount_value: 0, metadata: null })).toEqual({})
  })

  it('maps the Plus plan key', () => {
    expect(planTierSlug('premiere')).toBe('plus')
    expect(planTierSlug(' Black ')).toBe('black')
    expect(planTierSlug('')).toBeNull()
  })

  it('formats percents like the app', () => {
    expect(formatPercent(7.5)).toBe('7.5%')
    expect(formatPercent(3.333)).toBe('3.33%')
  })

  const item = offerItem({ id: 'o1', title: 'Sale', badge_text: null, offer_type: 'percentage', discount_value: 20, is_active: true }, 'store_offer')!

  it('marks percentage offers for the server reveal', () => {
    expect(item.percent).toBe(true)
    expect(offerItem({ id: 'o2', title: 'Flat', badge_text: null, offer_type: 'flat', discount_value: 100, is_active: true }, 'store_offer')!.percent).toBe(false)
  })

  it('shows the plan cap until revealed, then the revealed percent', () => {
    expect(revealDisplay(item, 'free', undefined)).toEqual({ benefit: '5% OFF', upTo: '5%' })
    expect(revealDisplay(item, 'black', null)).toEqual({ benefit: '20% OFF', upTo: '20%' })
    expect(revealDisplay(item, 'free', 3.5)).toEqual({ benefit: '3.5% OFF', upTo: '5%' })
  })

  it('falls back to the item\'s own benefit without a cap', () => {
    const deal = dealItem({ id: 'd1', title: null, description: null, badge_text: null, deal_type: 'flat', currency_code: 'MUR', priority: 0, tierRow: { ...tierRow('free', null), benefit_amount: 200 } } as RestaurantDeal)!
    expect(revealDisplay(deal, 'free', undefined)).toEqual({ benefit: 'MUR 200 OFF', upTo: '' })
  })
})
