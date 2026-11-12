/**
 * Superadmin cashback switches — app parity: utils/platformFlags.js. Only an
 * explicit false turns one off, so a failed read leaves everything on.
 */
export type PlatformFlags = {
  earn: boolean
  burn: boolean
  bookingRewardAmount: number
  /** app parity: referral_enabled — on only with earn on and a positive reward */
  referralEnabled: boolean
  referralAmount: number
  referralRefereeAmount: number
}

export const DEFAULT_PLATFORM_FLAGS: PlatformFlags = {
  earn: true,
  burn: true,
  bookingRewardAmount: 0,
  referralEnabled: false,
  referralAmount: 0,
  referralRefereeAmount: 0,
}

let flags = DEFAULT_PLATFORM_FLAGS

export function setPlatformFlags(next: PlatformFlags) {
  flags = next
}
export function earnOn() {
  return flags.earn
}
export function burnOn() {
  return flags.burn
}

export function flagsFromRow(row: {
  cashback_earn_enabled?: boolean | null
  cashback_burn_enabled?: boolean | null
  booking_reward_enabled?: boolean | null
  booking_reward_amount?: number | string | null
  referral_enabled?: boolean | null
  referral_reward_amount?: number | string | null
  referral_referee_amount?: number | string | null
} | null | undefined): PlatformFlags {
  if (!row) return DEFAULT_PLATFORM_FLAGS
  const earn = row.cashback_earn_enabled !== false
  return {
    earn,
    burn: row.cashback_burn_enabled !== false,
    bookingRewardAmount: earn && row.booking_reward_enabled ? Number(row.booking_reward_amount || 0) : 0,
    referralEnabled: earn && !!row.referral_enabled && Number(row.referral_reward_amount) > 0,
    referralAmount: Number(row.referral_reward_amount || 0),
    referralRefereeAmount: Number(row.referral_referee_amount || 0),
  }
}
