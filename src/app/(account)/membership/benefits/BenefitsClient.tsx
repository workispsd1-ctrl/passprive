'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, ChevronLeft } from 'lucide-react'
import type { MembershipPlan, UserMembership } from '@/lib/types/subscription'
import { amountOf } from '@/lib/membershipPlans'
import { BENEFITS, BENEFIT_SECTIONS, dealsLine, type Benefit, type PlanTier } from '@/lib/membershipBenefits'
import { BENEFIT_ICON, UpgradeAction } from '@/components/membership/shared'
import {
  MEMBER_UNIT,
  TIERS,
  TIER_LABEL,
  activeTierOf,
  cashbackOf,
  mur,
  planCatalog,
  planFor,
  upgradeState,
  type Period,
} from '@/components/membership/plans'
import { cn } from '@/lib/utils'

const CHIP_TIERS: PlanTier[] = ['free', 'plus', 'black']

/** Free / Plus / Black under each benefit — a grey pill with a green check when included, struck through when not. */
function TierChips({ tiers }: { tiers: PlanTier[] }) {
  return (
    <div className='flex items-center gap-[calc(18.72*var(--u))] max-lg:gap-10'>
      {CHIP_TIERS.map(t =>
        tiers.includes(t) ? (
          <span key={t} className='flex h-[calc(26.52*var(--u))] items-center gap-[calc(3*var(--u))] rounded-full bg-[#F5F5F5] px-[calc(9.36*var(--u))] text-[calc(16*var(--u))] leading-[calc(21*var(--u))] font-medium text-[#1A1A1A] max-lg:h-24 max-lg:px-8 max-lg:text-[12px]'>
            <Check className='size-[calc(18.72*var(--u))] text-[#34A550] max-lg:size-14' strokeWidth={2.2} />
            {TIER_LABEL[t]}
          </span>
        ) : (
          <span key={t} className='text-[calc(16*var(--u))] leading-[calc(21*var(--u))] font-medium text-[#717171] line-through max-lg:text-[12px]'>
            {TIER_LABEL[t]}
          </span>
        ),
      )}
    </div>
  )
}

/** "How it works" — the numbered steps on a grey panel, joined by a dashed line. */
function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className='relative mt-6 flex w-656 flex-col gap-12 rounded-[calc(12*var(--u))] bg-[#F5F5F5] px-16 pt-13 pb-14 max-lg:w-full max-lg:gap-10 max-lg:rounded-xl max-lg:px-12 max-lg:py-12'>
      <span aria-hidden className='absolute top-[calc(26.5*var(--u))] bottom-[calc(27.5*var(--u))] left-29 border-l border-dashed border-[#FF4E08] max-lg:top-24 max-lg:bottom-24 max-lg:left-[23px]' />
      {steps.map((step, i) => (
        <li key={step} className='relative flex items-center gap-[calc(8.8*var(--u))] max-lg:gap-8'>
          <span className='flex size-[calc(26.4*var(--u))] shrink-0 items-center justify-center rounded-full bg-[#FF4E08] text-[calc(15.4*var(--u))] leading-[calc(20*var(--u))] font-medium text-white max-lg:size-24 max-lg:text-[12px]'>
            {i + 1}
          </span>
          <span className='text-[calc(14*var(--u))] leading-[calc(20*var(--u))] font-medium text-[#1A1A1A] max-lg:text-[13px] max-lg:leading-18'>{step}</span>
        </li>
      ))}
    </ol>
  )
}

/** One benefit — Figma "… benefit" cards: 776 wide, icon box, copy, plan chips. */
function BenefitCard({ benefit, sub, included }: { benefit: Benefit; sub: string; included: boolean }) {
  const [open, setOpen] = useState(false)
  const Icon = BENEFIT_ICON[benefit.key]
  return (
    <div className={cn('relative flex gap-24 rounded-[calc(24*var(--u))] border border-[#DCDCDC] bg-white p-24 transition-opacity max-lg:gap-12 max-lg:rounded-2xl max-lg:p-16', !included && 'opacity-50')}>
      <span className='flex size-48 shrink-0 items-center justify-center rounded-[calc(14.4*var(--u))] bg-[#FFF0E9] max-lg:size-40 max-lg:rounded-xl'>
        <Icon className='size-24 text-[#FF4E08] max-lg:size-20' strokeWidth={2} />
      </span>
      {benefit.soon && (
        <span className='absolute top-24 right-24 flex h-26 items-center rounded-full bg-[#FFF7EE] px-12 text-[calc(14*var(--u))] leading-[calc(18*var(--u))] font-bold text-[#666666] max-lg:top-16 max-lg:right-16 max-lg:h-20 max-lg:px-8 max-lg:text-[10px]'>
          SOON
        </span>
      )}
      <div className='min-w-0 flex-1'>
        <div className='flex flex-col gap-10 max-lg:gap-6'>
          <div className='flex flex-col gap-6 max-lg:gap-2'>
            <p className='pr-80 text-[calc(22*var(--u))] leading-[1.45] font-black text-[#1A1A1A] max-lg:pr-48 max-lg:text-[16px]'>{benefit.title}</p>
            <p className='text-[calc(16*var(--u))] leading-[1.45] font-bold text-[#FF4E08] max-lg:text-[13px]'>{sub}</p>
          </div>
          <p className='text-[calc(16*var(--u))] leading-[1.45] font-medium text-[#717171] max-lg:text-[13px]'>{benefit.description}</p>
        </div>
        <div className='mt-24 max-lg:mt-12'>
          <TierChips tiers={benefit.tiers} />
        </div>
        {benefit.steps && (
          <>
            <button
              type='button'
              onClick={() => setOpen(o => !o)}
              aria-expanded={open}
              className='mt-[calc(28.8*var(--u))] flex items-center gap-[calc(5.2*var(--u))] text-[calc(18*var(--u))] leading-[calc(23*var(--u))] font-medium text-[#FF4E08] max-lg:mt-12 max-lg:text-[14px]'
            >
              How it works
              <ChevronDown className={cn('size-[calc(20.8*var(--u))] transition-transform max-lg:size-16', open && 'rotate-180')} strokeWidth={1.8} />
            </button>
            {open && <Steps steps={benefit.steps} />}
          </>
        )}
      </div>
    </div>
  )
}

interface Props {
  plans: MembershipPlan[]
  membership: UserMembership | null
  initialTier: PlanTier
  initialPeriod: Period | null
}

/**
 * Privé benefits — Figma "Privé benefits · Desktop 1920": a Black / Plus /
 * Free switch, every benefit grouped by section with what each plan gets,
 * and the same upgrade button as the plan page. Benefits outside the chosen
 * plan stay listed, faded.
 */
export function BenefitsClient({ plans, membership, initialTier, initialPeriod }: Props) {
  const router = useRouter()
  const catalog = useMemo(() => planCatalog(plans), [plans])
  const activeTier = useMemo(() => activeTierOf(membership, plans), [membership, plans])
  const period: Period = initialPeriod && (initialPeriod === 'month' ? catalog.hasMonthly : catalog.hasYearly)
    ? initialPeriod
    : catalog.hasMonthly ? 'month' : 'year'
  const tiers = TIERS.filter(t => planFor(catalog, t, period))
  const [chosen, setChosen] = useState<PlanTier>(initialTier)
  const tier = tiers.includes(chosen) ? chosen : tiers[0] ?? 'free'
  const plan = planFor(catalog, tier, period)
  const cashback = cashbackOf(catalog, plan)
  const action = upgradeState(plan, tier, activeTier, period)
  const includedCount = BENEFITS.filter(b => b.tiers.includes(tier)).length

  // the orange line follows the chosen plan where the table has the number
  const subOf = (b: Benefit) => {
    if (b.key === 'deal-reveals') return dealsLine(plan?.deals_per_month)
    if (b.key === 'retail-cashback' && cashback.label) {
      return cashback.multiplier > 1 ? `${cashback.label} • ${cashback.multiplier}x cashback` : `${cashback.label} cashback`
    }
    return b.sub
  }

  const back = () => (window.history.length > 1 ? router.back() : router.push('/membership'))

  return (
    <div className={cn('bg-white font-(family-name:--font-dm-sans)', MEMBER_UNIT)}>
      <div className='px-172 pt-60 pb-25 max-lg:px-16 max-lg:pt-20 max-lg:pb-160'>
        <div className='flex items-start gap-22 max-lg:gap-12'>
          <button
            type='button'
            onClick={back}
            aria-label='Back'
            className='mt-6 flex h-[calc(48.81*var(--u))] w-50 shrink-0 items-center justify-center rounded-[calc(23.14*var(--u))] bg-[rgba(217,217,217,0.1)] text-[#595B61] transition-colors hover:bg-[rgba(217,217,217,0.3)] max-lg:mt-0 max-lg:size-36 max-lg:rounded-full max-lg:bg-black/5'
          >
            <ChevronLeft className='size-28 max-lg:size-24' strokeWidth={1.75} />
          </button>
          <div className='min-w-0'>
            <h1 className='text-[calc(44*var(--u))] leading-[calc(57*var(--u))] font-extrabold text-[#1A1A1A] max-lg:text-[24px] max-lg:leading-36'>Privé benefits</h1>
            <p className='mt-16 text-[calc(20*var(--u))] leading-[calc(20*var(--u))] font-medium text-[#717171] max-lg:mt-4 max-lg:text-[14px] max-lg:leading-20'>
              {BENEFITS.length} benefits across {tiers.length} plans
            </p>
          </div>
        </div>

        {/* Figma "Plan comparison tabs": 1576×88, the chosen plan on a white 520×72 pill */}
        <div role='tablist' className='mt-31 grid h-88 grid-cols-3 rounded-[calc(44*var(--u))] bg-[linear-gradient(90deg,#FFFFFF_0%,#F4F4F4_100%)] p-8 max-lg:mt-20 max-lg:h-64 max-lg:rounded-full max-lg:bg-[#F4F4F4] max-lg:p-4'>
          {tiers.map(t => {
            const tp = planFor(catalog, t, period)
            const on = t === tier
            return (
              <button
                key={t}
                type='button'
                role='tab'
                aria-selected={on}
                onClick={() => setChosen(t)}
                className={cn(
                  'flex flex-col items-center justify-center gap-4 rounded-[calc(36*var(--u))] transition-colors max-lg:gap-0 max-lg:rounded-full',
                  on && 'bg-white shadow-[calc(-2*var(--u))_calc(2*var(--u))_calc(4*var(--u))_rgba(255,78,8,0.25)]',
                )}
              >
                <span className={cn('text-[calc(22*var(--u))] leading-[calc(29*var(--u))] max-lg:text-[15px] max-lg:leading-20', on ? 'font-bold text-[#FF4E08]' : 'font-semibold text-[#1A1A1A]')}>
                  {TIER_LABEL[t]}
                </span>
                <span className='text-[calc(14*var(--u))] leading-[calc(18*var(--u))] font-semibold text-[#909090] max-lg:text-[11px] max-lg:leading-16'>
                  {t === 'free' || !tp ? 'Free' : `${mur(amountOf(tp.amount))}${period === 'month' ? '/mo' : '/yr'}`}
                </span>
              </button>
            )
          })}
        </div>

        <p className='mt-48 text-[calc(18*var(--u))] leading-[calc(20*var(--u))] text-[#1A1A1A] max-lg:mt-20 max-lg:text-[14px]'>
          <span className='font-bold'>Privé {TIER_LABEL[tier]}</span>{' '}
          <span className='font-medium'>
            includes {includedCount === BENEFITS.length ? `all ${BENEFITS.length}` : `${includedCount} of ${BENEFITS.length}`} benefits
          </span>
        </p>

        {BENEFIT_SECTIONS.map((section, i) => {
          const items = BENEFITS.filter(b => b.section === section)
          const got = items.filter(b => b.tiers.includes(tier)).length
          return (
            <section key={section} className={cn(i === 0 ? 'mt-28 max-lg:mt-20' : 'mt-68 max-lg:mt-32')}>
              <div className='flex items-center justify-between text-[calc(16*var(--u))] leading-[calc(21*var(--u))] font-extrabold tracking-[calc(1*var(--u))] text-[#909090] max-lg:text-[12px]'>
                <h2>{section}</h2>
                <span>{got}/{items.length}</span>
              </div>
              <div className='mt-19 grid grid-cols-2 items-start gap-24 max-lg:mt-12 max-lg:grid-cols-1 max-lg:gap-12'>
                {items.map(b => (
                  <BenefitCard key={b.key} benefit={b} sub={subOf(b)} included={b.tiers.includes(tier)} />
                ))}
              </div>
            </section>
          )
        })}

        <div className='mt-48 max-lg:mt-0'>
          <UpgradeAction label={action.label} billed={action.billed} href={action.checkoutHref} disabled={!action.canContinue} />
        </div>
      </div>
    </div>
  )
}
