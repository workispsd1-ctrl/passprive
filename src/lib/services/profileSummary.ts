import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/services/subscription'
import { getWalletBalance } from '@/lib/services/wallet'
import { getUpcomingDiningBookings, getUserStoreBookings } from '@/lib/services/bookings'
import { getUserVisitRewards } from '@/lib/services/visitRewards'
import { getBillPayments, type BillPayment } from '@/lib/services/billPayments'
import { getCashbackSummary } from '@/lib/services/cashbackSummary'

export type ProfileTier = 'free' | 'plus' | 'black'

export type ProfileBooking = {
  key: string
  href: string
  name: string
  image: string | null
  overline: string
  kind: 'dining' | 'store'
  /** "Fri, 3 Jul" */
  date: string
  /** "11:00 AM" */
  time: string
  /** party size — dining only */
  guests: number | null
  status: string
}

export type ProfileSummary = {
  name: string
  contact: string
  email: string | null
  phone: string | null
  tier: ProfileTier
  validTill: string | null
  credits: number
  stamps: number
  activeBookings: ProfileBooking[]
  /** latest bill payments — app parity: Profile.jsx "Activity → Transactions" */
  recentPayments: BillPayment[]
}

function tierOf(raw: string): ProfileTier {
  const t = raw.toLowerCase()
  if (t.includes('black')) return 'black'
  if (t.includes('plus') || t.includes('premium')) return 'plus'
  return 'free'
}

/** "Fri, 3 Jul" in the given time zone. */
function dayLabel(d: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(d)
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === t)?.value ?? ''
  return `${get('weekday')}, ${get('day')} ${get('month')}`
}

/** "13:05" → "1:05 PM" */
function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  if (!Number.isFinite(h)) return ''
  return `${h % 12 || 12}:${String(m || 0).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

const MU_TIME = new Intl.DateTimeFormat('en-GB', { timeZone: 'Indian/Mauritius', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

const fmtDate = (iso: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Everything the profile drawer shows — app parity: screens/Profile.jsx
 * (users row, membership tier, Privé Credits balance, stamps collected,
 * upcoming dining bookings + store appointments, latest bill payments).
 */
export async function getProfileSummary(): Promise<ProfileSummary | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: row }, membership, wallet, dining, stores, rewards, payments, cashback] = await Promise.all([
    supabase.from('users').select('full_name, phone, email').eq('id', user.id).maybeSingle(),
    getUserMembership(user.id),
    getWalletBalance(user.id),
    getUpcomingDiningBookings(user.id, 10),
    getUserStoreBookings(user.id),
    getUserVisitRewards().catch(() => []),
    getBillPayments(4).catch(() => []),
    getCashbackSummary(),
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
      kind: 'dining' as const,
      date: dayLabel(new Date(`${b.booking_date}T00:00:00Z`), 'UTC'),
      time: to12h(b.booking_time),
      guests: b.party_size,
      status: b.status,
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
        kind: 'store' as const,
        date: dayLabel(new Date(o.slot_start_at!), 'Indian/Mauritius'),
        time: to12h(MU_TIME.format(new Date(o.slot_start_at!))),
        guests: null,
        status: o.status,
      })),
  ].sort((a, b) => a.when - b.when)

  return {
    name: row?.full_name?.trim() || (user.user_metadata?.full_name as string | undefined) || 'PassPrivé member',
    contact: row?.phone || user.phone || row?.email || user.email || '',
    email: row?.email || user.email || null,
    phone: row?.phone || user.phone || null,
    tier: active ? tierOf(tierRaw) : 'free',
    validTill: active ? fmtDate(membership?.membership_expiry ?? null) : null,
    // app parity: Profile.jsx reads the cashback summary (as the header does); the table is the fallback
    credits: Math.round(cashback ? cashback.balance : Number(wallet?.balance ?? 0)),
    // app parity: stamps = paid visits across repeat-reward restaurants
    stamps: rewards.reduce((sum, r) => sum + (r.reward.enabled ? Number(r.reward.visitCount) || 0 : 0), 0),
    activeBookings: bookings.map(b => ({
      key: b.key, href: b.href, name: b.name, image: b.image, overline: b.overline,
      kind: b.kind, date: b.date, time: b.time, guests: b.guests, status: b.status,
    })),
    recentPayments: payments,
  }
}
