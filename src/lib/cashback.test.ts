import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_PLATFORM_FLAGS, flagsFromRow, setPlatformFlags } from './platformFlags'
import { canBook, canPayBill, getCardBadge, getCashbackPct, hasBillCashback, type MerchantCapabilityFields } from './cashback'

const preferred: MerchantCapabilityFields = { merchant_type: 'Preferred', merchant_plan: 'paid', pay_bill_enabled: true, on_boarded: true }
const verified: MerchantCapabilityFields = { ...preferred, merchant_type: 'Verified' }

describe('getCashbackPct — the app rate matrix', () => {
  it('pays preferred merchants 0.5 / 1.5 / 3 by plan', () => {
    expect(getCashbackPct(preferred, 'free')).toBe(0.5)
    expect(getCashbackPct(preferred, 'premiere')).toBe(1.5)
    expect(getCashbackPct(preferred, 'black')).toBe(3)
  })

  it('pays verified merchants a flat 0.5', () => {
    expect(getCashbackPct(verified, 'free')).toBe(0.5)
    expect(getCashbackPct(verified, 'black')).toBe(0.5)
  })

  it('pays nothing when cashback is off, bill pay is off, or the merchant is free', () => {
    expect(getCashbackPct({ ...preferred, cashback_enabled: false }, 'black')).toBe(0)
    expect(getCashbackPct({ ...preferred, pay_bill_enabled: false }, 'black')).toBe(0)
    expect(getCashbackPct({ ...preferred, merchant_plan: 'free' }, 'black')).toBe(0)
  })

  it('only an explicit false switches cashback off', () => {
    expect(hasBillCashback({ ...preferred, cashback_enabled: null })).toBe(true)
  })
})

describe('canPayBill', () => {
  it('needs a paid, onboarded merchant with bill pay on', () => {
    expect(canPayBill(preferred)).toBe(true)
    expect(canPayBill({ ...preferred, on_boarded: false })).toBe(false)
    expect(canPayBill({ ...preferred, pay_bill_enabled: false })).toBe(false)
    expect(canPayBill({ ...preferred, merchant_plan: 'free' })).toBe(false)
  })

  it('falls back to the service level when the switch is unset', () => {
    const base = { merchant_plan: 'paid', pay_bill_enabled: null }
    expect(canPayBill({ ...base, service_level: 'payments' })).toBe(true)
    expect(canPayBill({ ...base, service_level: 'booking' })).toBe(false)
    expect(canPayBill({ ...base, service_level: null })).toBe(false)
  })
})

describe('canBook', () => {
  it('follows the switch, and refuses free or un-onboarded merchants', () => {
    expect(canBook({ merchant_plan: 'paid', booking_enabled: true })).toBe(true)
    expect(canBook({ merchant_plan: 'paid', booking_enabled: false })).toBe(false)
    expect(canBook({ merchant_plan: 'paid', booking_enabled: true, on_boarded: false })).toBe(false)
    expect(canBook({ merchant_plan: 'free', booking_enabled: true })).toBe(false)
  })

  it('accepts booking and payments service levels', () => {
    expect(canBook({ merchant_plan: 'paid', service_level: 'booking' })).toBe(true)
    expect(canBook({ merchant_plan: 'paid', service_level: 'payments' })).toBe(true)
    expect(canBook({ merchant_plan: 'paid', service_level: 'discoverable' })).toBe(false)
  })
})

describe('platform earn / burn switches', () => {
  afterEach(() => setPlatformFlags(DEFAULT_PLATFORM_FLAGS))

  it('earn off: no rate and no earn art, the use-credits art stays', () => {
    setPlatformFlags({ ...DEFAULT_PLATFORM_FLAGS, earn: false })
    expect(getCashbackPct(preferred, 'black')).toBe(0)
    expect(getCardBadge(preferred, 'black')?.arts).toEqual(['/assets/cashback/Use-Cashback-OnPayment.webp'])
  })

  it('burn off: only the earn art', () => {
    setPlatformFlags({ ...DEFAULT_PLATFORM_FLAGS, burn: false })
    expect(getCardBadge(preferred, 'black')?.arts).toEqual(['/assets/cashback/Lite_Theme_Black_3.webp'])
  })

  it('both off: cashback is off everywhere', () => {
    setPlatformFlags({ ...DEFAULT_PLATFORM_FLAGS, earn: false, burn: false })
    expect(hasBillCashback(preferred)).toBe(false)
    expect(getCardBadge(preferred, 'black')).toBeNull()
  })

  it('reads a row: only an explicit false is off, and the reward needs earn on', () => {
    expect(flagsFromRow(null)).toEqual(DEFAULT_PLATFORM_FLAGS)
    expect(flagsFromRow({ booking_reward_enabled: true, booking_reward_amount: '50.00' }).bookingRewardAmount).toBe(50)
    expect(flagsFromRow({ cashback_earn_enabled: false, booking_reward_enabled: true, booking_reward_amount: 50 }).bookingRewardAmount).toBe(0)
  })
})
