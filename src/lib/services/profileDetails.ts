import { createClient } from '@/lib/supabase/server'
import type { ProfileDetails } from '@/lib/profileDetails'

/** The signed-in user's editable details, null when signed out — app parity: ProfileDetailsScreen load(). */
export async function getProfileDetails(): Promise<ProfileDetails | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // date of birth is `users.dob` (the app reads a missing `date_of_birth` column)
  const { data: row } = await supabase
    .from('users')
    .select('full_name, phone, email, default_address, gender, dob')
    .eq('id', user.id)
    .maybeSingle()

  return {
    fullName: row?.full_name ?? '',
    phone: row?.phone ?? user.phone ?? '',
    email: user.email || row?.email || '',
    address: row?.default_address ?? '',
    gender: row?.gender ?? '',
    dob: row?.dob ?? '',
  }
}
