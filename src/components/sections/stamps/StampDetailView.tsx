'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Award, Check, ChevronLeft, Lock } from 'lucide-react'
import { DESIGN_UNIT, TYPE_SCALE, t } from '@/components/sections/dining/designUnit'
import type { StampDetail } from '@/lib/services/visitRewards'
import { rewardText, sheetProgress, stampColor } from '@/lib/stamps'
import { cn } from '@/lib/utils'
import { NOTCH_PATH, small } from './stampUi'

const TERMS = [
  'Book a table or check-in to earn 1 stamp per visit.',
  'Stamps expire after 6 months of inactivity.',
  'Reward must be redeemed within 30 days once unlocked.',
]

const card = 'rounded-2xl border border-[#F2F2F2] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.07)]'

function formatDate(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('en-US', { timeZone: 'Indian/Mauritius', month: 'short', day: '2-digit', year: 'numeric' })
}

/** Figma stamp card; every number and rule follows the app's StampDetailScreen. */
export function StampDetailView({ detail }: { detail: StampDetail }) {
  const router = useRouter()
  const [showAll, setShowAll] = useState(false)
  const { goal, total, visits, remaining, unlocked, almostThere } = sheetProgress({ visitCount: detail.visitCount, tiers: detail.tiers })
  const icon = detail.kind === 'restaurant' ? 'dining' : detail.isService ? 'wellness' : 'shopping'
  const title = { fontSize: small(24, 17) }
  const pad = { padding: `max(16px, ${t(28)})` }

  return (
    <main
      className={cn('min-h-screen bg-white pb-28 font-(family-name:--font-dm-sans) max-md:[--t:0.62px] md:mx-[calc(50%-50vw)] md:-mt-9.5 md:w-screen md:pb-16', TYPE_SCALE)}
      style={{ ['--u' as string]: DESIGN_UNIT }}
    >
      <div className='mx-auto max-w-7xl px-4 pt-5 md:px-8 md:pt-8'>
        <div className='flex items-center' style={{ gap: small(16, 10) }}>
          <button
            type='button'
            aria-label='Back'
            onClick={() => (window.history.length > 1 ? router.back() : router.push('/visit-rewards'))}
            className='flex shrink-0 items-center justify-center rounded-full bg-[#F4F4F5] text-[#1A1A1A] hover:bg-gray-200'
            style={{ width: small(44, 34), height: small(44, 34) }}
          >
            <ChevronLeft style={{ width: small(24, 18), height: small(24, 18) }} />
          </button>
          <p className='truncate font-bold text-[#1A1A1A]' style={{ fontSize: small(22, 17) }}>{detail.name}</p>
        </div>

        {!detail.enabled || !detail.tiers.length ? (
          <div className='flex flex-col items-center gap-4 py-24 text-center'>
            <p className='text-sm text-[#6B7280]'>No stamp program is available for this venue yet.</p>
            <Link href={detail.ctaHref} className='flex h-11 items-center rounded-full border border-[#E9561F] px-6 text-sm font-semibold text-[#E9561F] hover:bg-brand-tint'>View {detail.name}</Link>
          </div>
        ) : (
          <div className='mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.64fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-6 lg:gap-y-5 min-[120rem]:gap-x-8'>
            {/* phones read hero → stamps → reward → activity → terms, as the app does */}
            <div className='min-w-0'>
              <div className='relative overflow-hidden rounded-[20px] bg-[#E8E2EE]' style={{ height: small(360, 170) }}>
                {detail.image && <Image src={detail.image} alt={detail.name} fill priority sizes='(min-width: 1024px) 60vw, 100vw' className='object-cover' />}
                <span className='absolute bottom-0 left-0' style={{ width: small(92, 62), height: small(85, 57) }}>
                  <svg viewBox='0 0 62 58' className='absolute inset-0 size-full' aria-hidden='true'><path d={NOTCH_PATH} fill='#fff' /></svg>
                  <Image src={`/assets/stamps/${icon}.webp`} alt='' width={40} height={48} className='absolute object-contain' style={{ left: '12%', top: '38%', width: '44%', height: '58%' }} />
                </span>
              </div>
              <h1 className='font-bold text-[#1A1A1A]' style={{ marginTop: small(28, 16), fontSize: small(34, 22) }}>{detail.name}</h1>
              {detail.subtitle && <p className='text-[#6B7280]' style={{ marginTop: small(8, 4), fontSize: small(16, 13) }}>{detail.subtitle}</p>}
            </div>

            <div className='min-w-0 lg:col-start-1 lg:row-start-2'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 min-[120rem]:gap-6'>
                {detail.activity.length > 0 && (
                  <section className={card} style={pad}>
                    <h2 className='font-bold text-[#1A1A1A]' style={title}>Recent Activity</h2>
                    <ul className='mt-3 divide-y divide-[#EFEFEF]'>
                      {(showAll ? detail.activity : detail.activity.slice(0, 3)).map(row => (
                        <li key={row.id} className='flex items-center justify-between' style={{ padding: `${small(14, 10)} 0`, gap: 12 }}>
                          <span className='font-medium text-[#1A1A1A]' style={{ fontSize: small(15, 13) }}>Stamp #{row.stampNumber} earned</span>
                          <span className='shrink-0 text-[#6B7280]' style={{ fontSize: small(13, 11) }}>{formatDate(row.date)}</span>
                        </li>
                      ))}
                    </ul>
                    {detail.activity.length > 3 && (
                      <button type='button' onClick={() => setShowAll(v => !v)} className='mx-auto mt-2 flex items-center gap-1 font-semibold text-[#E9561F]' style={{ fontSize: small(14, 12) }}>
                        {showAll ? 'Show less' : 'See all activity'} <ArrowRight className='size-3.5' />
                      </button>
                    )}
                  </section>
                )}
                <section className={card} style={pad}>
                  <h2 className='font-bold text-[#1A1A1A]' style={title}>Terms &amp; How It Works</h2>
                  <ul className='mt-3 flex flex-col' style={{ gap: small(14, 10) }}>
                    {TERMS.map(term => (
                      <li key={term} className='flex text-[#5B5A5A]' style={{ gap: small(12, 8), fontSize: small(14, 12), lineHeight: 1.4 }}>
                        <span className='mt-[0.45em] size-1.5 shrink-0 rounded-full bg-[#E9561F]' />
                        {term}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>

            <div className='flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:gap-5 min-[120rem]:gap-6 max-lg:row-start-2'>
              <section className={card} style={pad}>
                <div className='flex items-center justify-between gap-3'>
                  <h2 className='font-bold text-[#1A1A1A]' style={{ fontSize: small(20, 15) }}>{visits} of {total} stamps collected</h2>
                  {almostThere && <span className='shrink-0 rounded-full bg-[#FFE8DD] font-semibold text-[#E9561F]' style={{ fontSize: small(13, 11), padding: `${small(6, 3)} ${small(14, 9)}` }}>Almost there!</span>}
                </div>
                <div className='mx-auto grid w-fit' style={{ gridTemplateColumns: `repeat(${Math.min(total, 5)}, auto)`, marginTop: small(24, 16), gap: small(18, 10) }}>
                  {Array.from({ length: total }).map((_, i) =>
                    i < visits ? (
                      <span key={i} className='flex items-center justify-center rounded-full text-white' style={{ width: small(64, 44), height: small(64, 44), backgroundColor: stampColor(i, total) }} aria-label={`Stamp ${i + 1} collected`}>
                        <Check strokeWidth={3} style={{ width: small(28, 20), height: small(28, 20) }} />
                      </span>
                    ) : (
                      <span key={i} className='flex items-center justify-center rounded-full border border-dashed border-[#BFDDB6] bg-[#FAFBFA] font-medium text-[#8CC47E]' style={{ width: small(64, 44), height: small(64, 44), fontSize: small(20, 14) }}>{i + 1}</span>
                    ),
                  )}
                </div>
                <p className='flex items-center font-medium text-[#1A1A1A]' style={{ marginTop: small(24, 16), gap: small(8, 6), fontSize: small(15, 13) }}>
                  <Image src='/assets/stamps/repeat-reward.webp' alt='' width={88} height={102} className='object-contain' style={{ width: small(20, 16), height: small(24, 19) }} />
                  {visits} / {total} visits
                </p>
                {remaining > 0 && <p className='font-medium text-[#E9561F]' style={{ marginTop: small(12, 8), fontSize: small(14, 12) }}>Only {remaining} more visit{remaining === 1 ? '' : 's'} to unlock your reward!</p>}
              </section>

              {goal && (
                <section className={card} style={pad}>
                  <h2 className='font-bold text-[#1A1A1A]' style={{ fontSize: small(22, 16) }}>{unlocked ? 'Reward unlocked' : 'Pending Reward'}</h2>
                  <div className='flex items-center' style={{ marginTop: small(22, 14), gap: small(16, 10) }}>
                    <span className='flex shrink-0 items-center justify-center rounded-xl bg-[#F6F7F9] text-[#E9561F]' style={{ width: small(64, 46), height: small(64, 46) }}><Award style={{ width: small(26, 20), height: small(26, 20) }} /></span>
                    <span className='min-w-0'>
                      <span className='block truncate font-semibold text-[#1A1A1A]' style={{ fontSize: small(18, 14) }}>{rewardText(goal)}</span>
                      <span className='block text-[#6B7280]' style={{ marginTop: t(4), fontSize: small(14, 12) }}>Valid for 30 days after completion</span>
                    </span>
                  </div>
                  <div className='h-2 overflow-hidden rounded-full bg-[#E5E7EB]' style={{ marginTop: small(24, 14) }}>
                    <div className='h-full rounded-full bg-[#E9561F]' style={{ width: `${total > 0 ? Math.min(100, (visits / total) * 100) : 0}%` }} />
                  </div>
                  <p className='text-[#6B7280]' style={{ marginTop: small(8, 6), fontSize: small(13, 11) }}>{unlocked ? 'Ready to redeem!' : `Complete ${remaining} more stamp${remaining === 1 ? '' : 's'} to unlock`}</p>
                  <div className={cn('flex items-center justify-center rounded-full font-semibold', unlocked ? 'bg-[#E9561F] text-white' : 'bg-[#E2E6EC] text-[#64748B]')} style={{ marginTop: small(16, 12), minHeight: small(50, 42), gap: small(8, 6), fontSize: small(15, 13) }}>
                    {!unlocked && <Lock className='size-4' />}
                    {unlocked ? 'Show this at the venue to redeem' : 'Complete Stamps to Unlock'}
                  </div>
                </section>
              )}

              <Link href={detail.ctaHref} className='flex items-center justify-center rounded-full bg-[#E9561F] font-semibold text-white hover:bg-brand-dark max-lg:fixed max-lg:inset-x-4 max-lg:bottom-4 max-lg:z-30' style={{ minHeight: small(54, 46), fontSize: small(16, 14) }}>
                {detail.kind === 'store' ? 'Book a service to earn stamp' : 'Book a table to earn stamp'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
