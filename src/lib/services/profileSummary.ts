import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/services/subscription'
import { getWalletBalance } from '@/lib/services/wallet'
import { getUpcomingDiningBookings, getUserStoreBookings } from '@/lib/services/bookings'
import { getUserVisitRewards } from '@/lib/services/visitRewards'

export type ProfileTier = 'free' | 'plus' | 'black'

export type ProfileSummary = {
  name: string
  contact: string
  tier: ProfileTier
  validTill: string | null
  credits: number
  stamps: number
  activeBookings: { key: string; href: string; name: string; image: string | null; overline: string }[]
}

function tierOf(raw: string): ProfileTier {
  const t = raw.toLowerCase()
  if (t.includes('black')) return 'black'
  if (t.includes('plus') || t.includes('premium')) return 'plus'
  return 'free'
}

const fmtDate = (iso: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Everything the profile drawer shows — app parity: screens/Profile.jsx
 * (users row, membership tier, Privé Credits balance, stamps collected,
 * upcoming dining bookings + store appointments).
 */
export async function getProfileSummary(): Promise<ProfileSummary | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: row }, membership, wallet, dining, stores, rewards] = await Promise.all([
    supabase.from('users').select('full_name, phone, email').eq('id', user.id).maybeSingle(),
    getUserMembership(user.id),
    getWalletBalance(user.id),
    getUpcomingDiningBookings(user.id, 10),
    getUserStoreBookings(user.id),
    getUserVisitRewards().catch(() => []),
  ])

  const tierRaw = (membership?.membership_tier ?? 'none').trim()
  const active = !!tierRaw && tierRaw.toLowerCase() !== 'none'
  const now = Date.now()

  const bookings = [
    ...dining.map(b => ({
      key: `d-${b.id}`,
      href: `/bookings/${b.id}`,
      name: b.restaurants?.name ?? 'Restaurant',
      image: b.restaurants?.cover_image ?? null,
      overline: `${new Date(`${b.booking_date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ${b.booking_time.slice(0, 5)} · ${b.party_size} guest${b.party_size === 1 ? '' : 's'}`,
      when: new Date(`${b.booking_date}T${b.booking_time.slice(0, 5)}`).getTime(),
    })),
    ...stores
      .filter(o => (o.service_type ?? '').toUpperCase() === 'APPOINTMENT' && o.slot_start_at && Date.parse(o.slot_start_at) >= now)
      .filter(o => !['CANCELLED', 'REJECTED', 'DELIVERED'].includes(o.status.toUpperCase()))
      .map(o => ({
        key: `s-${o.id}`,
        href: '/bookings',
        name: o.store?.name ?? 'Store',
        image: o.store?.cover_image ?? null,
        overline: new Date(o.slot_start_at!).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }),
        when: Date.parse(o.slot_start_at!),
      })),
  ].sort((a, b) => a.when - b.when)

  return {
    name: row?.full_name?.trim() || (user.user_metadata?.full_name as string | undefined) || 'PassPrivé member',
    contact: row?.phone || user.phone || row?.email || user.email || '',
    tier: active ? tierOf(tierRaw) : 'free',
    validTill: active ? fmtDate(membership?.membership_expiry ?? null) : null,
    credits: Math.round(Number(wallet?.balance ?? 0)),
    // app parity: stamps = paid visits across repeat-reward restaurants
    stamps: rewards.reduce((sum, r) => sum + (r.reward.enabled ? Number(r.reward.visitCount) || 0 : 0), 0),
    activeBookings: bookings.map(b => ({ key: b.key, href: b.href, name: b.name, image: b.image, overline: b.overline })),
  }
}
