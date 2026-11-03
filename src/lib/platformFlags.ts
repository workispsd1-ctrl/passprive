/**
 * Superadmin cashback switches — app parity: utils/platformFlags.js. Only an
 * explicit false turns one off, so a failed read leaves everything on.
 */
export type PlatformFlags = { earn: boolean; burn: boolean; bookingRewardAmount: number }

export const DEFAULT_PLATFORM_FLAGS: PlatformFlags = { earn: true, burn: true, bookingRewardAmount: 0 }

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
} | null | undefined): PlatformFlags {
  if (!row) return DEFAULT_PLATFORM_FLAGS
  const earn = row.cashback_earn_enabled !== false
  return {
    earn,
    burn: row.cashback_burn_enabled !== false,
    bookingRewardAmount: earn && row.booking_reward_enabled ? Number(row.booking_reward_amount || 0) : 0,
  }
}
