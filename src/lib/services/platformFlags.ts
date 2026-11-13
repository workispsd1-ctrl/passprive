import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { cachedCatalog } from '@/lib/catalogCache'
import { DEFAULT_PLATFORM_FLAGS, flagsFromRow, setPlatformFlags, type PlatformFlags } from '@/lib/platformFlags'

/** Merchants that override the platform's repeat-rewards switch (`repeat_reward_mode` 'on' / 'off'). */
type RepeatOverrides = { on: string[]; off: string[] }

const getRepeatOverrides = cachedCatalog('repeat-reward-overrides', async (): Promise<RepeatOverrides> => {
  const db = createPublicClient()
  const [r, s] = await Promise.all([
    db.from('restaurants').select('id, repeat_reward_mode').in('repeat_reward_mode', ['on', 'off']),
    db.from('stores').select('id, repeat_reward_mode').in('repeat_reward_mode', ['on', 'off']),
  ])
  if (r.error) throw r.error
  if (s.error) throw s.error
  const rows = [...(r.data ?? []), ...(s.data ?? [])] as { id: string; repeat_reward_mode: string }[]
  return {
    on: rows.filter(x => x.repeat_reward_mode === 'on').map(x => String(x.id)),
    off: rows.filter(x => x.repeat_reward_mode === 'off').map(x => String(x.id)),
  }
}, { on: [], off: [] })

/**
 * Reads the switches and applies them to server-rendered cashback helpers.
 * Once per request (React cache), so pages can ask too without another query.
 */
export const getPlatformFlags = cache(async (): Promise<PlatformFlags> => {
  try {
    const supabase = await createClient()
    const [{ data, error }, overrides] = await Promise.all([
      supabase
        .from('platform_settings')
        .select('cashback_earn_enabled, cashback_burn_enabled, booking_reward_enabled, booking_reward_amount, referral_enabled, referral_reward_amount, referral_referee_amount, repeat_reward_enabled')
        .maybeSingle(),
      getRepeatOverrides(),
    ])
    if (error) return DEFAULT_PLATFORM_FLAGS
    const base = flagsFromRow(data)
    // stamp entry points (menus, profile, deals) stay while any merchant still runs stamps
    const flags = { ...base, stampsVisible: base.repeatRewards || overrides.on.length > 0 }
    setPlatformFlags(flags)
    return flags
  } catch {
    return DEFAULT_PLATFORM_FLAGS
  }
})

/**
 * Whether one merchant's stamps show — app parity: platformFlags.js
 * repeatRewardsOn. The merchant's own 'on' / 'off' wins over the admin switch.
 */
export const getStampGate = cache(async (): Promise<(id: string | null | undefined) => boolean> => {
  const [flags, overrides] = await Promise.all([getPlatformFlags(), getRepeatOverrides()])
  const on = new Set(overrides.on)
  const off = new Set(overrides.off)
  return id => {
    const key = String(id ?? '')
    if (on.has(key)) return true
    if (off.has(key)) return false
    return flags.repeatRewards
  }
})
