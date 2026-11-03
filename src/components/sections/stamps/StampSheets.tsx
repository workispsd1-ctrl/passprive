import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Award, Check, ChevronDown, ChevronRight, CircleHelp, Gift } from 'lucide-react'
import { DESIGN_UNIT, TYPE_SCALE, t } from '@/components/sections/dining/designUnit'
import type { StampSheet, StampSheetsData } from '@/lib/services/visitRewards'
import { rewardText, sheetStatus, stampColor } from '@/lib/stamps'
import { cn } from '@/lib/utils'
import { StampCard } from './CollectStamps'
import { STAMP_ASSETS, small } from './stampUi'

const REWARD_GRADIENTS = ['linear-gradient(100deg, #5CBF8B 0%, #1F5A40 100%)', 'linear-gradient(100deg, #E8722E 0%, #8C3A1A 100%)']
const HOW_IT_WORKS = [
  'Book a table or check-in to earn 1 stamp per visit.',
  'Stamps expire after 6 months of inactivity.',
  'Reward must be redeemed within 30 days once unlocked.',
]

const heading = 'text-[19px] font-bold text-[#0D141C] md:text-[20px] xl:text-[22px] 2xl:text-[26px] min-[120rem]:text-[32px]'
const grid = 'mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:max-w-[83%] md:grid-cols-3 lg:gap-4 min-[120rem]:gap-6'

function SheetCard({ sheet }: { sheet: StampSheet }) {
  const status = sheetStatus(sheet.visits, sheet.total)
  return (
    <Link href={sheet.href} className='flex rounded-2xl border border-[#F0F0F0] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:bg-gray-50' style={{ gap: small(18, 12), padding: small(16, 10) }}>
      <span className='relative shrink-0 overflow-hidden rounded-xl bg-gray-100' style={{ width: small(140, 84), height: small(140, 84) }}>
        <Image src={sheet.image} alt='' fill sizes='140px' className='object-cover' />
      </span>
      <span className='min-w-0 flex-1'>
        <span className='block truncate font-semibold text-[#1A1A1A]' style={{ fontSize: small(18, 14) }}>{sheet.name}</span>
        <span className='block truncate text-[#7A7A7A]' style={{ marginTop: t(2), fontSize: small(14, 12) }}>{sheet.location}</span>
        <span className='flex flex-wrap' style={{ marginTop: small(10, 6), gap: small(4, 3) }}>
          {Array.from({ length: sheet.total }).map((_, i) =>
            i < sheet.visits ? (
              <span key={i} className='flex items-center justify-center rounded-full text-white' style={{ width: small(18, 14), height: small(18, 14), backgroundColor: stampColor(i, sheet.total) }}>
                <Check strokeWidth={3.4} style={{ width: small(11, 9), height: small(11, 9) }} />
              </span>
            ) : (
              <span key={i} className='rounded-full border border-[#D9D9D9]' style={{ width: small(18, 14), height: small(18, 14) }} />
            ),
          )}
        </span>
        <span className='flex flex-wrap items-center' style={{ marginTop: small(10, 6), gap: small(6, 5) }}>
          <Image src={`${STAMP_ASSETS}/repeat-reward.webp`} alt='' width={88} height={102} className='object-contain' style={{ width: small(16, 13), height: small(19, 15) }} />
          <span className='font-medium text-[#2C2D32]' style={{ fontSize: small(13, 11) }}>{sheet.visits} / {sheet.total} visits</span>
          {status && <span className='rounded-full bg-[#E9561F] font-semibold text-white' style={{ fontSize: small(12, 10), padding: `${small(2, 2)} ${small(10, 7)}` }}>{status}</span>}
        </span>
      </span>
    </Link>
  )
}

function RewardCard({ sheet, index }: { sheet: StampSheet; index: number }) {
  return (
    <Link href={sheet.href} className='flex flex-col justify-between rounded-2xl text-white hover:opacity-95' style={{ minHeight: small(240, 150), padding: small(22, 14), background: REWARD_GRADIENTS[index % REWARD_GRADIENTS.length] }}>
      <span>
        <span className='block truncate font-semibold' style={{ fontSize: small(20, 15) }}>{sheet.name}</span>
        <span className='block text-white/75' style={{ marginTop: t(6), fontSize: small(14, 12) }}>{rewardText(sheet.rewardGoal)}</span>
      </span>
      <span className='inline-flex items-center self-start rounded-full bg-[#E9561F] font-semibold' style={{ gap: small(6, 4), fontSize: small(13, 11), padding: `${small(6, 4)} ${small(14, 9)}` }}>
        <Gift style={{ width: small(14, 12), height: small(14, 12) }} /> Redeem now
      </span>
    </Link>
  )
}

/**
 * Figma "Collect Stamps" for a member with stamps — sheets, rewards ready to
 * use and more places. Which place is a sheet and where it leads follow the
 * app's CollectStampsScreen `mode: "sheets"`.
 */
export function StampSheets({ data }: { data: StampSheetsData }) {
  const { sheets, explore } = data
  const rewards = sheets.filter(sheet => sheet.unlocked && sheet.rewardGoal)
  return (
    <main
      className={cn('min-h-screen bg-white pb-16 font-(family-name:--font-dm-sans) max-md:[--t:0.62px] md:mx-[calc(50%-50vw)] md:-mt-9.5 md:w-screen', TYPE_SCALE)}
      style={{ ['--u' as string]: DESIGN_UNIT }}
    >
      <div className='mx-auto max-w-7xl px-4 pt-5 md:px-8 md:pt-8'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center' style={{ gap: small(16, 10) }}>
            <Link href='/visit-rewards' aria-label='Back' className='flex shrink-0 items-center justify-center rounded-full border border-[#E5E5E5] bg-white text-[#1A1A1A] hover:bg-gray-50' style={{ width: small(44, 34), height: small(44, 34) }}>
              <ArrowLeft style={{ width: small(20, 16), height: small(20, 16) }} />
            </Link>
            <h1 className='font-bold text-[#1A1A1A]' style={{ fontSize: small(36, 22) }}>Collect Stamps</h1>
          </div>
          {rewards.length > 0 && (
            <Link href={rewards[0].href} className='flex shrink-0 items-center justify-center rounded-full bg-[#E9561F] font-semibold text-white hover:bg-brand-dark' style={{ height: small(54, 38), padding: `0 ${small(48, 16)}`, fontSize: small(16, 13) }}>
              Redeem Reward
            </Link>
          )}
        </div>

        {sheets.length > 0 && (
          <>
            <a href='#my-sheets' className='mt-6 flex items-center justify-between rounded-xl bg-[#FFF1EB] hover:bg-brand-tint-strong' style={{ padding: `${small(22, 13)} ${small(24, 14)}` }}>
              <span className='flex items-center font-semibold text-[#1A1A1A]' style={{ gap: small(12, 8), fontSize: small(16, 13) }}>
                <Award className='text-[#F2620F]' style={{ width: small(24, 18), height: small(24, 18) }} />
                You have {sheets.length} active stamp {sheets.length === 1 ? 'sheet' : 'sheets'}
              </span>
              <ChevronRight className='text-[#F2620F]' style={{ width: small(22, 16), height: small(22, 16) }} />
            </a>

            <section id='my-sheets' className='mt-8 scroll-mt-24'>
              <h2 className={heading}>My Stamp Sheets</h2>
              <div className={grid}>{sheets.map(sheet => <SheetCard key={sheet.id} sheet={sheet} />)}</div>
              <Link href='/dining' className='mt-4 flex items-center justify-between rounded-full border border-[#D9D9D9] bg-white text-[#2C2D32] hover:bg-gray-50' style={{ width: small(340, 240), padding: `${small(12, 9)} ${small(20, 14)}`, fontSize: small(15, 13) }}>
                See all <ChevronRight className='text-[#6B7280]' style={{ width: small(20, 16), height: small(20, 16) }} />
              </Link>
            </section>
          </>
        )}

        {rewards.length > 0 && (
          <section className='mt-8'>
            <h2 className={heading}>My Rewards</h2>
            <div className={grid}>{rewards.map((sheet, i) => <RewardCard key={sheet.id} sheet={sheet} index={i} />)}</div>
          </section>
        )}

        {explore.length > 0 && (
          <section className='mt-8'>
            <h2 className={heading}>Explore more places</h2>
            <div className={grid}>{explore.map((card, i) => <StampCard key={card.id} card={card} priority={!sheets.length && i < 3} />)}</div>
          </section>
        )}

        <details className='group mt-8 rounded-xl bg-[#F8F9FB]'>
          <summary className='flex cursor-pointer list-none items-center justify-between text-[#2C2D32] [&::-webkit-details-marker]:hidden' style={{ padding: `${small(20, 13)} ${small(22, 14)}`, fontSize: small(15, 13) }}>
            <span className='flex items-center' style={{ gap: small(12, 8) }}>
              <CircleHelp className='text-[#64748B]' style={{ width: small(20, 16), height: small(20, 16) }} /> How does stamp collecting work?
            </span>
            <ChevronDown className='text-[#64748B] transition-transform group-open:rotate-180' style={{ width: small(20, 16), height: small(20, 16) }} />
          </summary>
          <ul className='list-disc text-[#5B5A5A]' style={{ padding: `0 ${small(22, 14)} ${small(20, 14)} ${small(54, 34)}`, fontSize: small(14, 12), lineHeight: 1.7 }}>
            {HOW_IT_WORKS.map(item => <li key={item}>{item}</li>)}
          </ul>
        </details>
      </div>
    </main>
  )
}
