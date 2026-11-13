import { describe, expect, it } from 'vitest'
import { giftLabel, numberActivity, rewardText, sheetProgress, sheetStatus, stampColor, stampProgress, stampVisits, storeCollectsStamps } from './stamps'

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

// app parity: CollectStampsScreen / StampDetailScreen `claimed`
describe('claimed rewards', () => {
  it('labels a claimed card and stops calling it complete', () => {
    expect(giftLabel({ visits: 5, target: 5, claimed: true })).toBe('Reward claimed')
    expect(stampProgress({ visits: 5, target: 5, claimed: true }).complete).toBe(false)
    expect(sheetStatus(5, 5, true)).toBe('Reward claimed')
  })

  it('keeps a claimed reward out of unlocked', () => {
    const tiers = [{ visitCount: 3 }]
    expect(sheetProgress({ visitCount: 3, tiers }).unlocked).toBe(true)
    expect(sheetProgress({ visitCount: 3, tiers, claimed: true })).toMatchObject({ unlocked: false, claimed: true })
  })
})

// app parity: StampDetailScreen.jsx — paid bills, one stamp per Mauritius day
describe('stampVisits', () => {
  it('counts the first bill of each Mauritius day, newest first', () => {
    const rows = stampVisits([
      { id: 'a', created_at: '2026-11-01T05:00:00Z' }, // 09:00 MU, 1 Nov
      { id: 'b', created_at: '2026-11-01T15:00:00Z' }, // 19:00 MU, same day
      { id: 'c', created_at: '2026-11-01T21:00:00Z' }, // 01:00 MU, 2 Nov
      { id: 'd', created_at: '2026-11-05T10:00:00Z' },
    ])
    expect(rows.map(r => [r.id, r.stampNumber])).toEqual([['d', 3], ['c', 2], ['a', 1]])
  })
})
