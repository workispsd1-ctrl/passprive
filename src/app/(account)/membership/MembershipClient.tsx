'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Headphones, Gift, Star } from 'lucide-react'
import type { MembershipPlan, UserMembership } from '@/lib/types/subscription'
import { amountOf } from '@/lib/membershipPlans'
import { BENEFITS, FREE_MEALS_MUR, benefitIncluded, dealsLine, type BenefitKey, type PlanTier } from '@/lib/membershipBenefits'
import { BENEFIT_ICON, Radio, TierPill, UpgradeAction } from '@/components/membership/shared'
import {
  MEMBER_UNIT,
  TIERS,
  activeTierOf,
  cashbackOf,
  mur,
  planCatalog,
  planFor,
  upgradeState,
  type PlanCatalog,
  type Period,
} from '@/components/membership/plans'
import { cn } from '@/lib/utils'

// Figma "Privé Black / Plus / Free plan": corner label and the price's gradient text
const CARD: Record<PlanTier, { label?: string; labelColor?: string; price: string }> = {
  black: { label: 'POPULAR', labelColor: 'text-[#FF4E08]', price: 'bg-[linear-gradient(180deg,#FF4800_-29.78%,#611B00_112.06%)]' },
  plus: { label: 'OFFER', labelColor: 'text-[#2247FF]', price: 'bg-[linear-gradient(103.59deg,#2C2842_19.85%,#008CDD_139.46%)]' },
  free: { price: 'bg-[linear-gradient(126.76deg,#1D6E45_28.62%,#61B078_109.83%)]' },
}

const PRICE_TEXT = 'bg-clip-text text-[calc(22.4*var(--u))] leading-[calc(29*var(--u))] font-bold tracking-[calc(1.6*var(--u))] text-transparent max-lg:text-[17px] max-lg:leading-24 max-lg:tracking-[0.5px]'
const MUTED_19 = 'text-[calc(19.2*var(--u))] leading-[calc(25*var(--u))] font-medium text-[#909090] max-lg:text-[12px] max-lg:leading-16'

function PlanCard({ tier, plan, period, selected, isCurrent, onSelect }: {
  tier: PlanTier
  plan: MembershipPlan
  period: Period
  selected: boolean
  isCurrent: boolean
  onSelect: () => void
}) {
  const look = CARD[tier]
  const amount = amountOf(plan.amount)
  const original = amountOf(plan.original_amount)
  return (
    <button
      type='button'
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex h-162 min-w-0 flex-col rounded-[calc(32*var(--u))] bg-white p-20 pr-23 text-left transition-shadow max-lg:h-auto max-lg:rounded-2xl max-lg:p-14',
        selected
          ? 'border-[calc(1.6*var(--u))] border-[#FF4E08] shadow-[calc(-3.2*var(--u))_calc(3.2*var(--u))_calc(19.2*var(--u))_rgba(255,78,8,0.25)] max-lg:border-[1.5px]'
          : 'border-[calc(0.8*var(--u))] border-[#DCDCDC] hover:border-[#C4C4C4] max-lg:border',
      )}
    >
      <span className='flex h-32 items-center justify-between max-lg:h-20'>
        <span className={cn('text-[calc(16*var(--u))] leading-[calc(21*var(--u))] font-semibold tracking-[calc(0.8*var(--u))] max-lg:text-[11px]', look.labelColor)}>{look.label ?? ''}</span>
        <Radio on={selected} />
      </span>
      <span className='mt-32 flex items-start justify-between max-lg:mt-12 max-lg:items-center'>
        <TierPill tier={tier} />
        <span className='flex flex-col items-end gap-2 max-lg:gap-0'>
          {tier === 'free' ? (
            <span className={cn(PRICE_TEXT, look.price)}>FREE</span>
          ) : (
            <span className='flex items-baseline gap-[calc(2.8*var(--u))]'>
              <span className={cn(PRICE_TEXT, look.price)}>{mur(amount)}</span>
              <span className='text-[calc(16*var(--u))] leading-[calc(21*var(--u))] font-medium text-[#909090] max-lg:text-[11px]'>{period === 'month' ? '/mo' : '/yr'}</span>
            </span>
          )}
          {isCurrent ? (
            <span className={MUTED_19}>Current Plan</span>
          ) : original > amount ? (
            <span className={cn(MUTED_19, 'line-through')}>{mur(original)}</span>
          ) : (
            <span className={MUTED_19}>&nbsp;</span>
          )}
        </span>
      </span>
    </button>
  )
}

/** Monthly / Yearly — Figma "Billing period": a dark 275×50 pill with the saving beside Yearly. */
function PeriodToggle({ period, onChange, savePercent }: { period: Period; onChange: (p: Period) => void; savePercent: number }) {
  const tab = (key: Period, label: string, pad: string) => (
    <button
      type='button'
      onClick={() => onChange(key)}
      aria-pressed={period === key}
      className={cn(
        'flex h-41 items-center justify-center rounded-full text-[calc(16*var(--u))] leading-[calc(21*var(--u))] transition-colors max-lg:h-32 max-lg:text-[13px]',
        pad,
        period === key ? 'bg-white font-semibold text-[#1A1A1A]' : 'font-medium text-[#FFC53D] [text-shadow:0_5.6px_5.6px_rgba(0,0,0,0.1)]',
      )}
    >
      {label}
    </button>
  )
  return (
    <div className='flex h-50 items-center rounded-[calc(150*var(--u))] bg-[#0E0C18] pr-[calc(7.5*var(--u))] pl-[calc(3.75*var(--u))] shadow-[0_calc(5*var(--u))_calc(18.75*var(--u))_rgba(115,49,11,0.21)] max-lg:h-40 max-lg:pr-6 max-lg:pl-4'>
      {tab('month', 'Monthly', 'w-104 max-lg:w-80')}
      {tab('year', 'Yearly', 'px-12 max-lg:px-12')}
      {savePercent > 0 && (
        <span className='ml-[calc(3.5*var(--u))] flex h-35 items-center rounded-[calc(40*var(--u))] bg-[linear-gradient(138.06deg,#FF4800_23.66%,#FFAA7C_125.97%)] px-[calc(8.75*var(--u))] text-[calc(15*var(--u))] leading-[calc(20*var(--u))] font-semibold whitespace-nowrap text-white max-lg:h-28 max-lg:px-8 max-lg:text-[12px]'>
          Save {savePercent}%
        </span>
      )}
    </div>
  )
}

const TILE = 'relative overflow-hidden rounded-[calc(24*var(--u))] max-lg:rounded-2xl'
const TILE_TITLE = 'text-[calc(24*var(--u))] leading-[calc(25*var(--u))] font-bold text-[#1A1A1A] max-lg:text-[16px] max-lg:leading-20'
const TILE_SUB = 'text-[calc(20*var(--u))] leading-[calc(26*var(--u))] font-medium text-[#666666] max-lg:text-[13px] max-lg:leading-18'
/** a benefit the chosen plan doesn't include — still shown, faded */
const OFF = 'opacity-40 grayscale'

/** Deal reveals, Top % deals, Table cashback, Order takeaway — Figma 376×200 / 190 cream tiles. */
function SmallTile({ benefit, sub, included, soon }: { benefit: BenefitKey; sub: string; included: boolean; soon?: boolean }) {
  const Icon = BENEFIT_ICON[benefit]
  const title = BENEFITS.find(b => b.key === benefit)?.title ?? ''
  return (
    <div className={cn(TILE, 'bg-[#FFF7EE] max-lg:min-h-144', !included && OFF)}>
      <span className='absolute top-[calc(22.4*var(--u))] left-[calc(22.4*var(--u))] flex size-[calc(50.4*var(--u))] items-center justify-center rounded-full bg-white max-lg:top-12 max-lg:left-12 max-lg:size-40'>
        <Icon className='size-[calc(33.6*var(--u))] text-[#FF4E08] max-lg:size-22' strokeWidth={2} />
      </span>
      {soon && (
        <span className='absolute top-20 right-[calc(26.2*var(--u))] flex h-[calc(23.6*var(--u))] items-center rounded-full bg-white px-[calc(8.4*var(--u))] text-[calc(14*var(--u))] leading-[calc(18*var(--u))] font-bold text-[#666666] max-lg:top-12 max-lg:right-12 max-lg:h-20 max-lg:text-[10px]'>
          SOON
        </span>
      )}
      <div className='absolute right-24 bottom-[calc(24.4*var(--u))] left-24 flex flex-col gap-[calc(5.6*var(--u))] max-lg:right-12 max-lg:bottom-12 max-lg:left-12'>
        <p className={TILE_TITLE}>{title}</p>
        <p className={TILE_SUB}>{sub}</p>
      </div>
    </div>
  )
}

/** Figma "EVERY MONTH": the orange meal-credit card with the plate, fork and knife. */
function MealsTile({ included }: { included: boolean }) {
  return (
    <div className={cn(TILE, 'col-span-2 bg-[linear-gradient(271.81deg,#FA5011_2.6%,#701E06_93.84%)] max-lg:min-h-144', !included && OFF)}>
      <div className='absolute top-32 left-[calc(38.4*var(--u))] flex flex-col gap-6 max-lg:top-16 max-lg:left-16'>
        <p className='text-[calc(20*var(--u))] leading-[calc(26*var(--u))] font-semibold tracking-[calc(0.8*var(--u))] text-[#FFD1BF] max-lg:text-[12px] max-lg:leading-16'>EVERY MONTH</p>
        <div className='flex flex-col gap-2'>
          <p className='text-[calc(56*var(--u))] leading-[calc(73*var(--u))] font-black tracking-[calc(-1.6*var(--u))] text-white max-lg:text-[32px] max-lg:leading-40'>MUR {FREE_MEALS_MUR}</p>
          <p className='text-[calc(24*var(--u))] leading-[calc(31*var(--u))] font-semibold text-white max-lg:text-[15px] max-lg:leading-20'>in free meals</p>
        </div>
      </div>
      <svg aria-hidden viewBox='0 0 172 136' className='absolute top-32 left-572 h-136 w-172 max-lg:top-auto max-lg:right-12 max-lg:bottom-12 max-lg:left-auto max-lg:h-80 max-lg:w-100'>
        <circle cx='86' cy='68' r='64' fill='rgba(255,255,255,0.21)' />
        <circle cx='86' cy='68' r='43' fill='rgba(255,255,255,0.29)' stroke='rgba(255,255,255,0.47)' strokeWidth='2' />
        <g stroke='rgba(255,255,255,0.96)' strokeLinecap='round' fill='none'>
          <path d='M2 22v18M6 22v18M10 22v18' strokeWidth='2.4' />
          <path d='M2 40c0 5 8 5 8 0' strokeWidth='2.4' />
          <path d='M6 45v68' strokeWidth='4' />
        </g>
        <path d='M164 22c7 8 8 30 5 46h-5z' fill='rgba(255,255,255,0.96)' />
        <path d='M166.5 66v47' stroke='rgba(255,255,255,0.96)' strokeWidth='4' strokeLinecap='round' />
      </svg>
    </div>
  )
}

/** Figma "Frame 2147225236": the tall cocktail card. */
function MocktailsTile({ included }: { included: boolean }) {
  return (
    <div className={cn(TILE, 'row-span-2 rounded-[calc(32.09*var(--u))] max-lg:col-span-2 max-lg:row-span-1 max-lg:h-208', !included && OFF)}>
      <svg aria-hidden viewBox='0 0 376 424' preserveAspectRatio='xMidYMin slice' className='absolute inset-0 size-full'>
        <defs>
          <linearGradient id='mk-top' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0' stopColor='#FF9441' />
            <stop offset='0.45' stopColor='#FF5A65' />
          </linearGradient>
          <linearGradient id='mk-bottom' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0' stopColor='#BB3C57' />
            <stop offset='1' stopColor='#310B20' />
          </linearGradient>
        </defs>
        <rect width='376' height='424' fill='url(#mk-top)' />
        <rect y='180' width='376' height='244' fill='url(#mk-bottom)' />
        <line x1='0' y1='188' x2='376' y2='188' stroke='#FFC376' strokeWidth='1.6' />
        <circle cx='294.04' cy='132.39' r='44.13' fill='#FFC376' />
        <path d='M219.31 24.07L235.3 100.9' stroke='#FFFFFF' strokeWidth='7' strokeLinecap='round' />
        <path d='M150 53.25H286.81L218.4 157.22Z' fill='#FFF1EE' stroke='#FFF1EE' strokeWidth='1.6' strokeLinejoin='round' />
        <path d='M162.77 67.85H274.04L218.4 149.93Z' fill='#FF8FA6' />
        <rect x='212.93' y='155' width='10.94' height='75' fill='#FFF1EE' />
        <rect x='188.31' y='226.54' width='62.02' height='10.94' rx='5.47' fill='#FFF1EE' />
        <circle cx='272.22' cy='78.78' r='18.24' fill='#B9E36D' stroke='#FFFFFF' strokeWidth='2.4' />
      </svg>
      <div className='absolute top-303 left-32 flex w-[calc(173.3*var(--u))] flex-col gap-6 max-lg:top-auto max-lg:bottom-16 max-lg:left-16 max-lg:w-160'>
        <p className='text-[calc(28*var(--u))] leading-[calc(29*var(--u))] font-bold text-white max-lg:text-[18px] max-lg:leading-20'>Bottomless mocktails</p>
        <p className='text-[calc(20*var(--u))] leading-[calc(26*var(--u))] font-medium text-[#FF9341] max-lg:text-[13px] max-lg:leading-16'>at Peninsula</p>
      </div>
    </div>
  )
}

/** Figma "Cashback on retail": the plan's rate, its multiple of Free, and the copy. */
function CashbackTile({ label, multiplier }: { label: string; multiplier: number }) {
  return (
    <div className={cn(TILE, 'col-span-2 bg-[#FFF7EE] max-lg:min-h-144')}>
      <div className='absolute top-25 left-32 flex items-center gap-[calc(4.6*var(--u))] max-lg:top-12 max-lg:left-16 max-lg:gap-6'>
        <span className='text-[calc(60*var(--u))] leading-[calc(78*var(--u))] font-black text-[#FF4E08] max-lg:text-[36px] max-lg:leading-48'>{label}</span>
        {multiplier > 1 && (
          <span className='flex h-[calc(37.4*var(--u))] items-center rounded-full bg-[#FF4E08] px-[calc(9.6*var(--u))] text-[calc(24*var(--u))] leading-[calc(31*var(--u))] font-bold text-white max-lg:h-24 max-lg:px-8 max-lg:text-[14px]'>
            {multiplier}x
          </span>
        )}
      </div>
      <div className='absolute top-112 left-32 flex flex-col gap-6 max-lg:top-auto max-lg:bottom-16 max-lg:left-16'>
        <p className='text-[calc(24*var(--u))] leading-[calc(29*var(--u))] font-bold text-[#1A1A1A] max-lg:text-[16px] max-lg:leading-20'>Cashback on retail</p>
        <p className={TILE_SUB}>Upload any receipt from outlets on the app</p>
      </div>
    </div>
  )
}

/** Figma "View all 10 benefits": three icon bubbles, the copy and the orange arrow. */
function ViewAllTile({ href }: { href: string }) {
  const bubble = 'flex size-[calc(50.4*var(--u))] items-center justify-center rounded-full bg-[#FFF0E9] max-lg:size-40'
  const icon = 'size-[calc(33.6*var(--u))] text-[#FF4E08] max-lg:size-20'
  return (
    <Link
      href={href}
      className={cn(TILE, 'group col-span-2 border-[calc(1.4*var(--u))] border-[#DCDCDC] bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] max-lg:min-h-144 max-lg:border')}
    >
      <span className='absolute top-24 left-32 flex max-lg:top-12 max-lg:left-16'>
        <span className={bubble}><Gift className={icon} strokeWidth={1.6} /></span>
        <span className={cn(bubble, '-ml-[calc(8*var(--u))] border-[calc(2.1*var(--u))] border-white max-lg:-ml-8')}><Headphones className={icon} strokeWidth={1.6} /></span>
        <span className={cn(bubble, '-ml-[calc(8*var(--u))] border-[calc(2.1*var(--u))] border-white max-lg:-ml-8')}><Star className={icon} strokeWidth={1.6} /></span>
      </span>
      <span className='absolute top-[calc(102.4*var(--u))] left-32 flex w-510 flex-col gap-6 max-lg:top-auto max-lg:bottom-16 max-lg:left-16 max-lg:w-[calc(100%-5rem)]'>
        <span className='text-[calc(22.4*var(--u))] leading-[calc(25*var(--u))] font-bold text-[#1A1A1A] max-lg:text-[16px] max-lg:leading-20'>View all {BENEFITS.length} benefits</span>
        <span className={TILE_SUB}>Full details and what each plan gets</span>
      </span>
      <span className='absolute top-100 left-672 flex size-60 items-center justify-center rounded-full bg-[#FF4E08] transition-transform group-hover:translate-x-1 max-lg:top-auto max-lg:right-16 max-lg:bottom-16 max-lg:left-auto max-lg:size-44'>
        <ArrowRight className='size-28 text-white max-lg:size-20' strokeWidth={1.8} />
      </span>
    </Link>
  )
}

interface Props {
  plans: MembershipPlan[]
  membership: UserMembership | null
}

/**
 * Membership — Figma "Subscription plan · Desktop 1920" (flow and rules: app
 * screens/Membership.jsx): a Monthly / Yearly switch with the best saving,
 * Black / Plus / Free cards, the chosen plan's benefits as a bento grid, and
 * the upgrade button with what will be billed. Paid plans at or above the
 * current tier can be bought; the same tier adds to the plan, a higher one
 * carries the unused days over.
 */
export function MembershipClient({ plans, membership }: Props) {
  const router = useRouter()
  const [periodChoice, setPeriodChoice] = useState<Period | null>(null)
  const [selectedTier, setSelectedTier] = useState<PlanTier>('black')

  const activeTier = useMemo(() => activeTierOf(membership, plans), [membership, plans])
  const catalog: PlanCatalog = useMemo(() => planCatalog(plans), [plans])

  const showToggle = catalog.hasMonthly && catalog.hasYearly
  const period: Period = periodChoice ?? (catalog.hasMonthly ? 'month' : 'year')
  const visibleTiers = TIERS.filter(t => planFor(catalog, t, period))
  const tier = visibleTiers.includes(selectedTier) ? selectedTier : visibleTiers[0] ?? 'free'
  const plan = planFor(catalog, tier, period)
  const cashback = cashbackOf(catalog, plan)
  const action = upgradeState(plan, tier, activeTier, period)
  // Figma "Meal credit value": what the free meals are worth against the monthly price
  const monthly = amountOf(plan?.amount) / (period === 'year' ? 12 : 1)
  const mealsShare = monthly > 0 ? Math.round((FREE_MEALS_MUR / monthly) * 100) : 0
  const has = (key: BenefitKey) => benefitIncluded(key, tier)

  const skip = () => (window.history.length > 1 ? router.back() : router.push('/'))

  return (
    <div className={cn('relative overflow-hidden bg-white font-(family-name:--font-dm-sans)', MEMBER_UNIT)}>
      {/* Figma "Ellipse 43912": the warm glow behind the header */}
      <div aria-hidden className='pointer-events-none absolute -top-530 left-160 h-700 w-1600 rounded-[50%] bg-[#FFD9A6] blur-[calc(94*var(--u))] max-lg:-top-320 max-lg:left-1/2 max-lg:h-400 max-lg:w-600 max-lg:-translate-x-1/2 max-lg:opacity-70' />

      <div className='relative px-172 pt-64 pb-48 max-lg:px-16 max-lg:pt-20 max-lg:pb-160'>
        <div className='flex items-start justify-between gap-24'>
          <div className='min-w-0'>
            <h1 className='text-[calc(44*var(--u))] leading-[calc(57*var(--u))] font-extrabold text-[#1A1A1A] max-lg:text-[24px] max-lg:leading-32'>Unlock more with Privé</h1>
            <p className='mt-13 text-[calc(20*var(--u))] leading-[1.4] text-[#666666] max-lg:mt-4 max-lg:text-[14px]'>One upgrade, endless rewards</p>
          </div>
          <div className='flex shrink-0 flex-col items-end'>
            <button
              type='button'
              onClick={skip}
              className='flex h-[calc(49.5*var(--u))] w-72 items-center justify-center rounded-[calc(27.77*var(--u))] bg-[rgba(145,145,145,0.1)] text-[calc(18*var(--u))] leading-[calc(23*var(--u))] font-semibold tracking-[-0.01em] text-[#454040] transition-colors hover:bg-[rgba(145,145,145,0.18)] max-lg:h-36 max-lg:w-64 max-lg:text-[14px]'
            >
              Skip
            </button>
            {showToggle && (
              <div className='mt-[calc(10.5*var(--u))] max-lg:hidden'>
                <PeriodToggle period={period} onChange={setPeriodChoice} savePercent={catalog.savePercent} />
              </div>
            )}
          </div>
        </div>

        {/* phones: the switch gets its own row under the title */}
        {showToggle && (
          <div className='mt-4 lg:hidden'>
            <PeriodToggle period={period} onChange={setPeriodChoice} savePercent={catalog.savePercent} />
          </div>
        )}

        <div className='mt-34 grid grid-cols-3 gap-24 max-lg:mt-20 max-lg:grid-cols-1 max-lg:gap-12'>
          {visibleTiers.map(t => (
            <PlanCard
              key={t}
              tier={t}
              plan={planFor(catalog, t, period)!}
              period={period}
              selected={t === tier}
              isCurrent={t === activeTier}
              onSelect={() => setSelectedTier(t)}
            />
          ))}
        </div>

        {has('free-meals') && mealsShare > 0 && (
          <p className='mt-62 flex h-64 items-center rounded-[calc(16*var(--u))] bg-[#FFF7EE] px-24 text-[calc(16*var(--u))] leading-[calc(21*var(--u))] text-[#666666] max-lg:mt-20 max-lg:h-auto max-lg:rounded-xl max-lg:px-16 max-lg:py-12 max-lg:text-[13px] max-lg:leading-20'>
            <span>
              Free meals alone give back <span className='font-semibold text-[#C2410C]'>MUR {FREE_MEALS_MUR} a month</span>, {mealsShare}% of the price.
            </span>
          </p>
        )}

        <div
          className={cn(
            'grid grid-cols-4 grid-rows-[calc(200*var(--u))_calc(200*var(--u))_calc(190*var(--u))] gap-24 max-lg:grid-flow-row-dense max-lg:grid-cols-2 max-lg:grid-rows-none max-lg:gap-12',
            has('free-meals') && mealsShare > 0 ? 'mt-32 max-lg:mt-12' : 'mt-62 max-lg:mt-20',
          )}
        >
          <MealsTile included={has('free-meals')} />
          <MocktailsTile included={has('mocktails')} />
          <SmallTile benefit='deal-reveals' sub={dealsLine(plan?.deals_per_month)} included={has('deal-reveals')} />
          <CashbackTile label={cashback.label} multiplier={cashback.multiplier} />
          <SmallTile benefit='top-deals' sub='Biggest discounts first' included={has('top-deals')} />
          <SmallTile benefit='table-cashback' sub='On every booking' included={has('table-cashback')} soon />
          <SmallTile benefit='takeaway' sub='Straight from the app' included={has('takeaway')} />
          <ViewAllTile href={`/membership/benefits?tier=${tier}&period=${period}`} />
        </div>

        <div className='mt-48 max-lg:mt-0'>
          <UpgradeAction label={action.label} billed={action.billed} href={action.checkoutHref} disabled={!action.canContinue} />
        </div>
      </div>
    </div>
  )
}
