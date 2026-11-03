import { describe, expect, it } from 'vitest'
import {
  applyOffers,
  billOffers,
  billTotals,
  couponState,
  offerHeadline,
  primaryOffer,
  selectedCoupon,
  shareOffer,
  type BillOffer,
  type OffersTableRow,
  type RestaurantOfferRow,
} from './payBill'

const HERE = 'restaurant-1'

const offer = (over: Partial<BillOffer> = {}): BillOffer => ({
  id: 'o1',
  source: 'MERCHANT',
  title: 'Offer',
  sub: '',
  badgeText: '',
  sponsorName: '',
  logo: null,
  benefitType: 'percent',
  value: 20,
  minBillAmount: 0,
  maxBillAmount: 0,
  priority: 100,
  fromOffersTable: false,
  ...over,
})

const own = (over: Partial<RestaurantOfferRow> = {}): RestaurantOfferRow => ({
  id: 'r1',
  title: 'Flat 20% OFF',
  description: null,
  badge_text: null,
  offer_type: 'percentage',
  discount_value: 20,
  min_spend: null,
  ...over,
})

const row = (over: Partial<OffersTableRow> = {}): OffersTableRow => ({
  id: 't1',
  source_type: 'MERCHANT',
  owner_entity_type: 'RESTAURANT',
  owner_entity_id: HERE,
  module: 'DINING',
  payment_flow: 'ANY',
  title: 'MUR 500 off',
  subtitle: null,
  description: null,
  badge_text: null,
  logo_url: null,
  offer_type: 'FLAT_DISCOUNT',
  benefit_value: 500,
  benefit_percent: null,
  max_discount_amount: null,
  min_bill_amount: null,
  max_bill_amount: null,
  priority: null,
  starts_at: null,
  ends_at: null,
  sponsor_name: null,
  ...over,
})

describe('applyOffers', () => {
  it('takes a percentage off the bill', () => {
    const r = applyOffers(1000, [offer({ value: 20 })])
    expect(r.discount).toBe(200)
    expect(r.finalAmount).toBe(800)
  })

  it('takes a flat amount off the bill', () => {
    expect(applyOffers(1000, [offer({ benefitType: 'flat', value: 100 })]).finalAmount).toBe(900)
  })

  it('caps a percentage at the maximum discount', () => {
    expect(applyOffers(10000, [offer({ value: 50, maxDiscount: 300 })]).discount).toBe(300)
  })

  it('never discounts more than the bill', () => {
    const r = applyOffers(100, [offer({ benefitType: 'flat', value: 500 })])
    expect(r.discount).toBe(100)
    expect(r.finalAmount).toBe(0)
  })

  it('skips an offer below its minimum or above its maximum bill', () => {
    expect(applyOffers(999, [offer({ minBillAmount: 1000 })]).discount).toBe(0)
    expect(applyOffers(1000, [offer({ minBillAmount: 1000 })]).discount).toBe(200)
    expect(applyOffers(2001, [offer({ maxBillAmount: 2000 })]).discount).toBe(0)
  })

  it('counts cashback separately — it does not lower the amount paid', () => {
    const r = applyOffers(1000, [offer({ benefitType: 'cashback', value: 5, maxDiscount: 40 })])
    expect(r.cashback).toBe(40)
    expect(r.discount).toBe(0)
    expect(r.finalAmount).toBe(1000)
  })

  it('applies offers in priority order, each on what is left', () => {
    const r = applyOffers(1000, [
      offer({ id: 'b', priority: 2, value: 10 }),
      offer({ id: 'a', priority: 1, benefitType: 'flat', value: 500 }),
    ])
    expect(r.discount).toBe(550)
  })

  it('handles an empty bill', () => {
    expect(applyOffers(0, [offer()]).finalAmount).toBe(0)
  })
})

describe('shareOffer — a member keeps their tier share of a merchant discount', () => {
  it('reduces a merchant offer to the share', () => {
    expect(shareOffer(offer({ value: 20 }), 50).value).toBe(10)
  })

  it('gives the real Banditos case: 20% of 1,250 for a Free member saves MUR 125', () => {
    expect(applyOffers(1250, [shareOffer(offer({ value: 20 }), 50)]).discount).toBe(125)
  })

  it('leaves 100% share, platform-funded offers and cashback untouched', () => {
    expect(shareOffer(offer({ value: 20 }), 100).value).toBe(20)
    expect(shareOffer(offer({ source: 'PLATFORM', value: 500 }), 50).value).toBe(500)
    expect(shareOffer(offer({ benefitType: 'cashback', value: 5 }), 50).value).toBe(5)
  })
})

describe('primaryOffer — the amount screen card', () => {
  it('is the first merchant offer, else the first of any kind', () => {
    const bank = offer({ id: 'bank', source: 'BANK' })
    const merchant = offer({ id: 'merchant' })
    expect(primaryOffer([bank, merchant])?.id).toBe('merchant')
    expect(primaryOffer([bank])?.id).toBe('bank')
    expect(primaryOffer([])).toBeNull()
  })
})

describe('couponState — the Bill summary coupons', () => {
  it('lets a merchant offer in range apply', () => {
    expect(couponState(offer(), 1000)).toEqual({ state: 'apply', note: '' })
  })

  it('locks a merchant offer out of range, with why', () => {
    expect(couponState(offer({ minBillAmount: 1000 }), 800)).toEqual({ state: 'locked', note: 'Min bill MUR 1,000' })
    expect(couponState(offer({ maxBillAmount: 2000 }), 2500)).toEqual({ state: 'locked', note: 'Up to MUR 2,000' })
  })

  it('never lets bank or platform offers be picked', () => {
    expect(couponState(offer({ source: 'BANK' }), 1000).note).toBe('Applied at payment')
    expect(couponState(offer({ source: 'PLATFORM' }), 1000).state).toBe('locked')
  })
})

describe('selectedCoupon', () => {
  const a = offer({ id: 'a' })
  const b = offer({ id: 'b' })

  it('with no choice yet, picks only when exactly one can apply', () => {
    expect(selectedCoupon([a], 1000, undefined)?.id).toBe('a')
    expect(selectedCoupon([a, b], 1000, undefined)).toBeNull()
  })

  it('follows the choice, and null means none', () => {
    expect(selectedCoupon([a, b], 1000, 'b')?.id).toBe('b')
    expect(selectedCoupon([a], 1000, null)).toBeNull()
  })

  it('drops a choice that is no longer in range', () => {
    expect(selectedCoupon([offer({ id: 'a', minBillAmount: 5000 })], 1000, 'a')).toBeNull()
  })
})

describe('offerHeadline', () => {
  it('prefers the badge, else describes the benefit', () => {
    expect(offerHeadline(offer({ badgeText: 'LUNCH20' }))).toBe('LUNCH20')
    expect(offerHeadline(offer({ value: 20 }))).toBe('20% OFF')
    expect(offerHeadline(offer({ benefitType: 'flat', value: 1000 }))).toBe('MUR 1,000 OFF')
    expect(offerHeadline(offer({ benefitType: 'cashback', value: 5 }))).toBe('5% CASHBACK')
  })
})

describe('billOffers', () => {
  const ids = (list: BillOffer[]) => list.map(o => o.id)

  it('keeps the restaurant own offers and reads their minimum spend', () => {
    const [o] = billOffers(HERE, [own({ min_spend: 1000 })], [])
    expect(o).toMatchObject({ source: 'MERCHANT', benefitType: 'percent', value: 20, minBillAmount: 1000, fromOffersTable: false })
  })

  it('accepts the app modules for a restaurant', () => {
    expect(ids(billOffers(HERE, [], [row({ module: 'DINING' })]))).toEqual(['t1'])
    expect(ids(billOffers(HERE, [], [row({ module: 'ANY' })]))).toEqual(['t1'])
  })

  it('rejects other modules — as the app does, including DINEIN — and a non-bill flow', () => {
    expect(billOffers(HERE, [], [row({ module: 'STORE' })])).toEqual([])
    expect(billOffers(HERE, [], [row({ module: 'DINEIN' })])).toEqual([])
    expect(billOffers(HERE, [], [row({ payment_flow: 'BOOKING' })])).toEqual([])
  })

  it('rejects another restaurant merchant offer', () => {
    expect(billOffers(HERE, [], [row({ owner_entity_id: 'someone-else' })])).toEqual([])
  })

  it('drops offers outside their dates', () => {
    const now = Date.parse('2026-11-02T12:00:00Z')
    expect(billOffers(HERE, [], [row({ ends_at: '2026-11-01T00:00:00Z' })], now)).toEqual([])
    expect(billOffers(HERE, [], [row({ starts_at: '2026-11-03T00:00:00Z' })], now)).toEqual([])
    expect(billOffers(HERE, [], [row({ starts_at: '2026-11-01T00:00:00Z', ends_at: '2026-11-03T00:00:00Z' })], now)).toHaveLength(1)
  })

  it('collapses the same offer saved many times', () => {
    const copies = ['a', 'b', 'c'].map(id => row({ id }))
    expect(billOffers(HERE, [], copies)).toHaveLength(1)
  })

  it('drops offers with no value', () => {
    expect(billOffers(HERE, [own({ title: 'Free Coke', offer_type: 'custom', discount_value: null })], [])).toEqual([])
  })
})

describe('billTotals', () => {
  const base = { amount: 1000, discount: 0, balance: 0, burnCap: 0, useCredits: false }

  it('charges the bill minus the discount', () => {
    expect(billTotals({ ...base, discount: 125 }).toPay).toBe(875)
  })

  it('applies credits only when switched on', () => {
    expect(billTotals({ ...base, balance: 50, burnCap: 50 }).toPay).toBe(1000)
    expect(billTotals({ ...base, balance: 50, burnCap: 50, useCredits: true })).toMatchObject({ creditsApplied: 50, toPay: 950 })
  })

  it('uses the lowest of balance and burn limit', () => {
    expect(billTotals({ ...base, balance: 500, burnCap: 100, useCredits: true }).creditsApplied).toBe(100)
    expect(billTotals({ ...base, balance: 80, burnCap: 100, useCredits: true }).creditsApplied).toBe(80)
  })

  it('always leaves at least MUR 1 for the card', () => {
    expect(billTotals({ ...base, amount: 100, balance: 5000, burnCap: 5000, useCredits: true })).toMatchObject({ creditsApplied: 99, toPay: 1 })
  })

  it('cannot use credits when blocked, empty, or on a bill of MUR 1', () => {
    expect(billTotals({ ...base, balance: 50, burnCap: 0, useCredits: true })).toMatchObject({ creditsUsable: false, creditsApplied: 0 })
    expect(billTotals({ ...base, burnCap: 50, useCredits: true })).toMatchObject({ creditsUsable: false, creditsApplied: 0 })
    expect(billTotals({ ...base, amount: 1, balance: 50, burnCap: 50, useCredits: true }).creditsUsable).toBe(false)
  })

  it('never goes below zero when the discount covers the bill', () => {
    expect(billTotals({ ...base, amount: 100, discount: 500 }).toPay).toBe(0)
  })

  it('adds a membership upgrade to what is paid', () => {
    expect(billTotals({ ...base, upgradeAmount: 4000 }).toPay).toBe(5000)
  })

  it('keeps cents exact', () => {
    expect(billTotals({ ...base, amount: 100.1, discount: 0.2, balance: 10.05, burnCap: 10.05, useCredits: true }).toPay).toBe(89.85)
  })
})
