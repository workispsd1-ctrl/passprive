import { getPlatformFlags } from '@/lib/services/platformFlags'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { HuntSpot } from '@/components/hunt/HuntSpot'
import { getCollectStamps, getStampSheets } from '@/lib/services/visitRewards'
import { CollectStamps } from '@/components/sections/stamps/CollectStamps'
import { StampSheets } from '@/components/sections/stamps/StampSheets'

export const metadata: Metadata = {
  title: 'Collect stamps | PassPrivé',
  description:
    'Track your repeat-visit rewards across PassPrivé restaurants and unlock exclusive benefits.',
  alternates: { canonical: '/visit-rewards' },
}

/** Collect stamps; `?mode=sheets` is the member's own sheets — app parity: CollectStampsScreen's two modes. */
export default async function VisitRewardsPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams
  // admin switched repeat rewards off (and no merchant forces them on) — no stamp pages
  if (!(await getPlatformFlags()).stampsVisible) notFound()
  if (mode === 'sheets') return <StampSheets data={await getStampSheets()} />
  return (
    <div className='relative'>
      <HuntSpot slot='stamps' />
      <CollectStamps data={await getCollectStamps()} />
    </div>
  )
}
