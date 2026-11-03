import { describe, expect, it } from 'vitest'
import { giftLabel, numberActivity, rewardText, sheetProgress, sheetStatus, stampColor, stampProgress, storeCollectsStamps } from './stamps'

describe('giftLabel', () => {
  it('follows the visits', () => {
    expect(giftLabel({ visits: 0, target: 5 })).toBe('Reveal gift after a visit')
    expect(giftLabel({ visits: 1, target: 5 })).toBe('Reveal gift now')
    expect(giftLabel({ visits: 5, target: 5 })).toBe('Reward ready!')
  })
})

describe('stampProgress', () => {
  it('falls back to 7 visits', () => {
    expect(stampProgress({ visits: 2 })).toEqual({ visits: 2, total: 7, complete: false })
  })
})

describe('storeCollectsStamps', () => {
  const NOW = Date.parse('2026-11-03T00:00:00Z')
  const live = { status: 'active', repeat_rewards_enabled: true }
  it('needs a live subscription with stamps on', () => {
    expect(storeCollectsStamps({ store_subscriptions: [live] }, NOW)).toBe(true)
    expect(storeCollectsStamps({ store_subscriptions: [{ ...live, status: 'cancelled' }] }, NOW)).toBe(false)
    expect(storeCollectsStamps({ store_subscriptions: [{ ...live, expires_at: '2026-01-01' }] }, NOW)).toBe(false)
    expect(storeCollectsStamps({ store_subscriptions: [{ ...live, repeat_rewards_enabled: false }] }, NOW)).toBe(false)
    expect(storeCollectsStamps({ store_subscriptions: null }, NOW)).toBe(false)
  })
})

describe('rewardText', () => {
  it('reads each reward type', () => {
    expect(rewardText({ rewardType: 'FREE_ITEM', rewardLabel: 'Free Cappuccino' })).toBe('Free Cappuccino')
    expect(rewardText({ rewardType: 'FLAT', rewardValue: 200 })).toBe('MUR 200 off')
    expect(rewardText({ rewardType: 'PERCENT', rewardValue: 20 })).toBe('20% off')
    expect(rewardText({ rewardType: 'PERCENT' })).toBe('a discount')
    expect(rewardText(null)).toBe('a reward')
  })
})

describe('sheetProgress', () => {
  const tiers = [{ visitCount: 10, rewardLabel: 'Big' }, { visitCount: 5, rewardLabel: 'Small' }]
  it('aims for the highest tier', () => {
    expect(sheetProgress({ visitCount: 7, tiers })).toMatchObject({ total: 10, visits: 7, remaining: 3, unlocked: false, almostThere: true })
    expect(sheetProgress({ visitCount: 7, tiers }).goal?.rewardLabel).toBe('Big')
  })
  it('stops at the goal and unlocks', () => {
    expect(sheetProgress({ visitCount: 14, tiers })).toMatchObject({ visits: 10, remaining: 0, unlocked: true, almostThere: false })
  })
  it('has nothing to unlock with no tiers', () => {
    expect(sheetProgress({ visitCount: 2, tiers: [] })).toMatchObject({ goal: null, total: 0, unlocked: false })
  })
})

describe('sheet details', () => {
  it('labels the sheet', () => {
    expect(sheetStatus(10, 10)).toBe('Reward ready!')
    expect(sheetStatus(7, 10)).toBe('Almost there!')
    expect(sheetStatus(2, 10)).toBe('')
  })
  it('runs gold to green', () => {
    expect(stampColor(0, 10)).toBe('rgb(255, 197, 61)')
    expect(stampColor(9, 10)).toBe('rgb(58, 164, 86)')
  })
  it('numbers activity oldest first and lists newest first', () => {
    expect(numberActivity([{ id: 'a' }, { id: 'b' }]).map(r => [r.id, r.stampNumber])).toEqual([['b', 2], ['a', 1]])
  })
})
