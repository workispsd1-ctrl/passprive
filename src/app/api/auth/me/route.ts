import { createClient } from '@/lib/supabase/server'
import { PREFERRED_PARTNER_RATES, DEFAULT_RATE } from '@/lib/constants/cashback'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ user: null }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, membership_tier, cashback, membership_expiry')
    .eq('id', user.id)
    .single()

  const isExpired = profile?.membership_expiry != null && new Date(profile.membership_expiry) < new Date()
  const tier = isExpired ? 'none' : (profile?.membership_tier ?? 'none')
  const storedRate = typeof profile?.cashback === 'number' && profile.cashback > 0 ? profile.cashback : null
  const cashback_rate = storedRate ?? PREFERRED_PARTNER_RATES[tier] ?? DEFAULT_RATE

  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      name: profile?.full_name ?? user.user_metadata?.full_name ?? null,
      membership_tier: tier,
      cashback_rate,
      membership_expiry: profile?.membership_expiry ?? null,
    },
  })
}
