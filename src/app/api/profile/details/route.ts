import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GENDER_OPTIONS, type ProfileDetails } from '@/lib/profileDetails'
import { getProfileDetails } from '@/lib/services/profileDetails'

/**
 * Profile details — app parity: screens/ProfileDetailsScreen.jsx (users row:
 * full_name, phone, default_address, gender, date of birth; email from auth).
 *
 * Date of birth lives in `users.dob` (a `date`). The app writes a
 * `date_of_birth` column that doesn't exist, so its gender + DOB update always
 * fails silently; here both go to the real columns.
 */
export async function GET() {
  const details = await getProfileDetails()
  if (!details) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })
  return NextResponse.json(details, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PATCH(request: Request) {
  const input = (await request.json().catch(() => ({}))) as Partial<ProfileDetails>
  const fullName = String(input.fullName ?? '').trim()
  const address = String(input.address ?? '').trim()
  const gender = String(input.gender ?? '').trim()
  const dob = String(input.dob ?? '').trim()

  if (!fullName) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
  if (fullName.length > 120 || address.length > 300) {
    return NextResponse.json({ error: 'That’s too long — please shorten it.' }, { status: 400 })
  }
  if (gender && !(GENDER_OPTIONS as readonly string[]).includes(gender)) {
    return NextResponse.json({ error: 'Please pick a gender from the list.' }, { status: 400 })
  }
  if (dob) {
    const d = new Date(`${dob}T00:00:00Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(d.getTime()) || d > new Date() || d.getUTCFullYear() < 1900) {
      return NextResponse.json({ error: 'Please enter a valid date of birth.' }, { status: 400 })
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Your session has expired. Please log in again.' }, { status: 401 })

  const { error } = await supabase
    .from('users')
    .update({
      full_name: fullName,
      default_address: address || null,
      gender: gender || null,
      dob: dob || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
  if (error) {
    console.error('[profile/details]', error.message)
    return NextResponse.json({ error: 'Failed to save changes. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
