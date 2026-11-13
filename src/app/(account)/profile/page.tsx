import type { Metadata } from 'next'
import { HuntSpot } from '@/components/hunt/HuntSpot'
import { redirect } from 'next/navigation'
import { getProfileSummary } from '@/lib/services/profileSummary'
import { getPointsLedger } from '@/lib/services/wallet'
import { PROFILE_UNIT } from '@/components/sections/profile/units'
import { ProfileBackLink } from '@/components/sections/profile/ProfileBackLink'
import { ProfileOverview } from '@/components/sections/profile/ProfileOverview'
import { ProfileStatCards } from '@/components/sections/profile/ProfileStatCards'
import { ProfileMenu } from '@/components/sections/profile/ProfileMenu'
import { ProfileActiveBookings } from '@/components/sections/profile/ProfileActiveBookings'
import { ProfileBookingCategories } from '@/components/sections/profile/ProfileBookingCategories'
import { ProfileRecentActivity } from '@/components/sections/profile/ProfileRecentActivity'
import { ReferBadge } from '@/components/sections/profile/ReferBadge'
import { getPlatformFlags } from '@/lib/services/platformFlags'

export const metadata: Metadata = {
  title: 'Profile | PassPrivé',
  robots: { index: false },
}

/**
 * Profile — Figma "Profile Page — Desktop 1920". Every length is written in
 * design px (see PROFILE_UNIT): 1:1 on a 1920 screen, proportional on any
 * other desktop width. Below `lg` it stacks into one column at 1 design px = 1px.
 */
export default async function ProfilePage() {
  const [summary, ledger, flags] = await Promise.all([getProfileSummary(), getPointsLedger(40), getPlatformFlags()])
  if (!summary) redirect('/')

  return (
    <main className={`relative min-h-screen bg-white px-16 pt-16 pb-76 font-(family-name:--font-dm-sans) lg:px-172 lg:pt-76 ${PROFILE_UNIT}`}>
      <HuntSpot slot='profile' />
      <ProfileBackLink />
      <ProfileOverview summary={summary} className='mt-16 lg:mt-24' />
      <ProfileStatCards credits={summary.credits} stamps={summary.stamps} showStamps={flags.stampsVisible} className='mt-24 lg:mt-32' />

      <div className='mt-32 flex flex-col gap-40 lg:mt-48 lg:flex-row lg:items-start'>
        {/* the menu sits on the left on desktop, after everything else on phones */}
        <ProfileMenu className='order-last lg:order-first lg:w-356 lg:shrink-0' />
        <div className='min-w-0 flex-1'>
          <ProfileActiveBookings bookings={summary.activeBookings} />
          <ProfileBookingCategories className='mt-38' />
          <ProfileRecentActivity ledger={ledger ?? []} className='mt-53' />
        </div>
      </div>
      {flags.referralEnabled && <ReferBadge amount={flags.referralAmount} />}
    </main>
  )
}
