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
  /** app parity: repeat_reward_enabled — stamp sheets / visit rewards, unless a merchant overrides it */
  repeatRewards: boolean
  /** stamp pages and menu entries show — the switch is on, or some merchant has its stamps forced on */
  stampsVisible: boolean
}

export const DEFAULT_PLATFORM_FLAGS: PlatformFlags = {
  earn: true,
  burn: true,
  bookingRewardAmount: 0,
  referralEnabled: false,
  referralAmount: 0,
  referralRefereeAmount: 0,
  repeatRewards: false,
  stampsVisible: false,
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

/**
 * Whether a merchant's repeat rewards (stamp sheet, visit offers) show — app
 * parity: platformFlags.js repeatRewardsOn. The merchant's `repeat_reward_mode`
 * ('on' / 'off') wins; 'inherit' (the default) follows the platform switch.
 */
export function repeatRewardsOn(merchant?: { repeat_reward_mode?: string | null } | null) {
  const mode = String(merchant?.repeat_reward_mode ?? 'inherit').toLowerCase()
  if (mode === 'on') return true
  if (mode === 'off') return false
  return flags.repeatRewards
}

export function flagsFromRow(row: {
  cashback_earn_enabled?: boolean | null
  cashback_burn_enabled?: boolean | null
  booking_reward_enabled?: boolean | null
  booking_reward_amount?: number | string | null
  referral_enabled?: boolean | null
  referral_reward_amount?: number | string | null
  referral_referee_amount?: number | string | null
  repeat_reward_enabled?: boolean | null
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
    repeatRewards: row.repeat_reward_enabled !== false,
    stampsVisible: row.repeat_reward_enabled !== false,
  }
}
