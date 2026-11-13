import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getProfileDetails } from '@/lib/services/profileDetails'
import { PROFILE_UNIT } from '@/components/sections/profile/units'
import { ProfileBackLink } from '@/components/sections/profile/ProfileBackLink'
import { ProfileDetailsClient } from './ProfileDetailsClient'

export const metadata: Metadata = {
  title: 'Profile details | PassPrivé',
  robots: { index: false },
}

/** Profile details — app parity: screens/ProfileDetailsScreen.jsx (opened from the profile card's "View details"). */
export default async function ProfileDetailsPage() {
  const details = await getProfileDetails()
  if (!details) redirect('/')

  return (
    <main className={`min-h-screen bg-white px-16 pt-16 pb-120 font-(family-name:--font-dm-sans) lg:px-172 lg:pt-76 ${PROFILE_UNIT}`}>
      <ProfileBackLink />
      <h1 className='mt-16 text-[calc(32*var(--u))] leading-42 font-bold text-[#1D1B20] max-lg:text-[24px] max-lg:leading-8'>Profile details</h1>
      <ProfileDetailsClient initial={details} />
    </main>
  )
}
