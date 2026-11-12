import { createClient } from '@/lib/supabase/server'
import { DEFAULT_PLATFORM_FLAGS, flagsFromRow, setPlatformFlags, type PlatformFlags } from '@/lib/platformFlags'

/** Reads the switches and applies them to server-rendered cashback helpers. */
export async function getPlatformFlags(): Promise<PlatformFlags> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('platform_settings')
      .select('cashback_earn_enabled, cashback_burn_enabled, booking_reward_enabled, booking_reward_amount, referral_enabled, referral_reward_amount, referral_referee_amount')
      .maybeSingle()
    if (error) return DEFAULT_PLATFORM_FLAGS
    const flags = flagsFromRow(data)
    setPlatformFlags(flags)
    return flags
  } catch {
    return DEFAULT_PLATFORM_FLAGS
  }
}
