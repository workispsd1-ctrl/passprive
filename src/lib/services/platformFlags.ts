import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { cachedCatalog } from '@/lib/catalogCache'
import { DEFAULT_PLATFORM_FLAGS, flagsFromRow, setPlatformFlags, type PlatformFlags } from '@/lib/platformFlags'

/** Merchants that turned their repeat rewards off (`repeat_reward_mode` 'off'). */
type RepeatOverrides = { off: string[] }

const getRepeatOverrides = cachedCatalog('repeat-reward-overrides', async (): Promise<RepeatOverrides> => {
  const db = createPublicClient()
  const [r, s] = await Promise.all([
    db.from('restaurants').select('id').eq('repeat_reward_mode', 'off'),
    db.from('stores').select('id').eq('repeat_reward_mode', 'off'),
  ])
  if (r.error) throw r.error
  if (s.error) throw s.error
  return { off: [...(r.data ?? []), ...(s.data ?? [])].map(x => String(x.id)) }
}, { off: [] })

/**
 * Reads the switches and applies them to server-rendered cashback helpers.
 * Once per request (React cache), so pages can ask too without another query.
 */
export const getPlatformFlags = cache(async (): Promise<PlatformFlags> => {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('platform_settings')
      .select('cashback_earn_enabled, cashback_burn_enabled, booking_reward_enabled, booking_reward_amount, referral_enabled, referral_reward_amount, referral_referee_amount, repeat_reward_enabled, order_collect_enabled')
      .maybeSingle()
    if (error) return DEFAULT_PLATFORM_FLAGS
    const base = flagsFromRow(data)
    setPlatformFlags(base)
    return base
  } catch {
    return DEFAULT_PLATFORM_FLAGS
  }
})

/**
 * Whether one merchant's stamps show — app parity: platformFlags.js
 * repeatRewardsOn. The admin switch off hides every merchant's (app b2ff80a);
 * while it's on, a merchant's own 'off' hides theirs.
 */
export const getStampGate = cache(async (): Promise<(id: string | null | undefined) => boolean> => {
  const [flags, overrides] = await Promise.all([getPlatformFlags(), getRepeatOverrides()])
  const off = new Set(overrides.off)
  return id => flags.repeatRewards && !off.has(String(id ?? ''))
})
