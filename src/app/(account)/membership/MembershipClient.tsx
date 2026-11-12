'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Check, Eye } from 'lucide-react'
import LoginDialog from '@/components/LoginDialog'
import type { MembershipPlan, UserMembership } from '@/lib/types/subscription'
import { amountOf, tierOf } from '@/lib/membershipPlans'
import { cn } from '@/lib/utils'

const ORANGE = '#FF4E08'
const TIERS = ['black', 'plus', 'free'] as const
type Tier = (typeof TIERS)[number]
type Period = 'month' | 'year'
const TIER_RANK: Record<Tier, number> = { free: 0, plus: 1, black: 2 }

// app parity: Membership.jsx TIER_STYLE
const TIER_STYLE: Record<Tier, { label?: string; labelColor: string; badge: string; gradient: string }> = {
  black: { label: 'POPULAR', labelColor: ORANGE, badge: '/assets/membership/BlackBadge.webp', gradient: 'linear-gradient(180deg,#FF4800 29.8%,#782200 100%)' },
  plus: { label: 'OFFER', labelColor: '#2247FF', badge: '/assets/membership/PlusBadge.webp', gradient: 'linear-gradient(135deg,#2C2842 24%,#0B73B6 100%)' },
  free: { labelColor: ORANGE, badge: '/assets/membership/FreeBadge.webp', gradient: 'linear-gradient(135deg,#1D6E45 28.6%,#59A872 100%)' },
}

const mur = (v: number) => `MUR ${Math.round(v).toLocaleString('en-US')}`

/** app parity: periodOf — "month" / "1year" plan types */
function periodOf(plan: MembershipPlan): Period | null {
  const type = String(plan.type ?? '').toLowerCase()
  if (type === 'month') return 'month'
  if (type === '1year' || type === 'year') return 'year'
  return null
}

/** app parity: hasActiveMembership */
function hasActiveMembership(m: UserMembership | null) {
  if (!m) return false
  const expired = !!m.membership_expiry && Date.parse(m.membership_expiry) <= Date.now()
  const tier = String(m.membership_tier ?? '').trim().toLowerCase()
  return !!tier && !['none', 'inactive', 'free'].includes(tier) && !expired
}

function Radio({ on }: { on: boolean }) {
  return (
    <span className={cn('flex size-5 items-center justify-center rounded-full border-2', on ? 'border-[#FF4E08]' : 'border-[#DCDCDC]')}>
      {on && <span className='size-2.5 rounded-full bg-[#FF4E08]' />}
    </span>
  )
}

function PlanCard({ tier, plan, period, selected, isCurrent, onSelect }: { tier: Tier; plan: MembershipPlan; period: Period; selected: boolean; isCurrent: boolean; onSelect: () => void }) {
  const look = TIER_STYLE[tier]
  const amount = amountOf(plan.amount)
  const original = amountOf(plan.original_amount)
  return (
    <button
      type='button'
      onClick={onSelect}
      aria-pressed={selected}
      className={cn('flex min-w-0 flex-1 flex-col rounded-2xl border bg-white p-3 text-left transition-shadow', selected ? 'border-[#FF4E08] shadow-[0_6px_18px_rgba(255,78,8,0.18)]' : 'border-[#ECECEC]')}
    >
      <span className='flex items-center justify-between'>
        <span className='text-[10px] font-bold tracking-wide' style={{ color: look.labelColor }}>{look.label ?? ''}</span>
        <Radio on={selected} />
      </span>
      <Image src={plan.badge_url || look.badge} alt='' width={154} height={66} className='mt-2 h-7 w-auto self-start object-contain' />
      <span className='mt-2 flex items-baseline gap-0.5'>
        <span className='bg-clip-text text-[18px] font-bold text-transparent' style={{ backgroundImage: look.gradient }}>
          {tier === 'free' ? 'FREE' : mur(amount)}
        </span>
        {tier !== 'free' && <span className='text-[11px] text-[#8A8A8E]'>{period === 'month' ? '/mo' : '/yr'}</span>}
      </span>
      {isCurrent ? (
        <span className='mt-0.5 text-[11px] text-[#8A8A8E]'>Current Plan</span>
      ) : original > amount ? (
        <span className='mt-0.5 text-[11px] text-[#8A8A8E] line-through'>{mur(original)}</span>
      ) : <span className='mt-0.5 text-[11px]'>&nbsp;</span>}
    </button>
  )
}

function IconTile({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className='flex items-start gap-2.5 rounded-2xl bg-[#FFF7EE] p-3'>
      <span className='mt-0.5 shrink-0'>{icon}</span>
      <span className='min-w-0'>
        <span className='block text-[14px] font-semibold text-[#1A1A1A]'>{title}</span>
        {sub && <span className='mt-0.5 block text-[12px] text-[#6B6B6B]'>{sub}</span>}
      </span>
    </div>
  )
}

interface Props {
  plans: MembershipPlan[]
  membership: UserMembership | null
  isLoggedIn: boolean
}

/**
 * Membership — app parity: screens/Membership.jsx (Nov 2026 redesign):
 * "Unlock more with Privé", a Monthly / Yearly switch with the best saving,
 * Black / Plus / Free cards, the chosen plan's cashback and benefits, and
 * Continue with what will be billed. Paid plans at or above the current tier
 * can be bought; the same tier adds to the plan, a higher one carries days over.
 */
export function MembershipClient({ plans, membership, isLoggedIn }: Props) {
  const router = useRouter()
  const [loginOpen, setLoginOpen] = useState(false)
  const [periodChoice, setPeriodChoice] = useState<Period | null>(null)
  const [selectedTier, setSelectedTier] = useState<Tier>('black')

  const activeTier: Tier = useMemo(() => {
    if (!hasActiveMembership(membership)) return 'free'
    const label = String(membership?.membership_tier ?? '').trim().toLowerCase()
    const matched = plans.find(p => p.plan_name.trim().toLowerCase() === label)
    if (matched) {
      const t = tierOf(matched)
      return (TIERS as readonly string[]).includes(t) ? (t as Tier) : 'plus'
    }
    if (label.includes('black')) return 'black'
    if (label.includes('plus') || label.includes('premium')) return 'plus'
    return 'free'
  }, [membership, plans])

  const { byPeriod, freePlan, savePercent } = useMemo(() => {
    const map: Record<Period, Partial<Record<Tier, MembershipPlan>>> = { month: {}, year: {} }
    let free: MembershipPlan | null = null
    for (const plan of plans) {
      const tier = tierOf(plan)
      if (tier === 'free') { free = free ?? plan; continue }
      const period = periodOf(plan)
      if (period && (tier === 'black' || tier === 'plus') && !map[period][tier]) map[period][tier] = plan
    }
    const save = (period: Period) => Math.max(0, ...Object.values(map[period]).map(plan => {
      const amount = amountOf(plan?.amount)
      const original = amountOf(plan?.original_amount)
      return original > amount ? Math.round((1 - amount / original) * 100) : 0
    }))
    return { byPeriod: map, freePlan: free, savePercent: Math.max(save('month'), save('year')) }
  }, [plans])

  const hasMonthly = Object.keys(byPeriod.month).length > 0
  const hasYearly = Object.keys(byPeriod.year).length > 0
  const showToggle = hasMonthly && hasYearly
  const period: Period = periodChoice ?? (hasMonthly ? 'month' : 'year')
  const planFor = (tier: Tier) => (tier === 'free' ? freePlan : byPeriod[period][tier] ?? null)
  const visibleTiers = TIERS.filter(t => planFor(t))
  const tier = visibleTiers.includes(selectedTier) ? selectedTier : visibleTiers[0]
  const plan = tier ? planFor(tier) : null
  const amount = amountOf(plan?.amount)
  const baseCashback = Number(freePlan?.cashback) || 0
  const cashback = Number(plan?.cashback) || 0
  const multiplier = baseCashback > 0 && cashback > 0 ? Math.round(cashback / baseCashback) : 0
  const benefits = (plan?.benefits ?? []).filter(b => !/cashback/i.test(b))
  const dealsSub = plan?.deals_per_month == null ? 'Unlimited, every month' : `${plan.deals_per_month} every month`
  const targetRank = tier ? TIER_RANK[tier] : 0
  const currentRank = TIER_RANK[activeTier]
  const canContinue = !!plan && amount > 0 && targetRank > 0 && targetRank >= currentRank
  const carryNote = currentRank > 0 && targetRank === currentRank
    ? ' · adds to your current plan'
    : currentRank > 0 && targetRank > currentRank ? ' · unused days carried over' : ''

  const onContinue = () => {
    if (!canContinue || !plan) return
    if (!isLoggedIn) { setLoginOpen(true); return }
    router.push(`/membership/checkout?plan=${encodeURIComponent(plan.id)}`)
  }

  const skip = () => (window.history.length > 1 ? router.back() : router.push('/'))

  return (
    <div className='relative mx-auto max-w-xl overflow-hidden px-4.5 pt-4 pb-44 font-(family-name:--font-dm-sans)'>
      <div aria-hidden className='pointer-events-none absolute -top-80 left-1/2 size-[641px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(255,217,166,0.63)_0%,rgba(255,217,166,0.45)_41%,rgba(255,217,166,0.18)_70%,rgba(255,217,166,0)_100%)]' />

      <div className='relative flex items-start justify-between'>
        <div>
          <h1 className='text-[24px] font-bold text-[#1A1A1A]'>Unlock more with Privé</h1>
          <p className='mt-1 text-[14px] text-[#666666]'>One upgrade, endless rewards</p>
        </div>
        <button type='button' onClick={skip} className='text-[14px] font-semibold text-[#666666] hover:text-[#1A1A1A]'>Skip</button>
      </div>

      {showToggle && (
        <div className='relative mt-5 flex items-center gap-2'>
          <div className='flex rounded-full bg-[#F2F2F2] p-1'>
            {(['month', 'year'] as const).map(key => (
              <button
                key={key}
                type='button'
                onClick={() => setPeriodChoice(key)}
                className={cn('rounded-full px-5 py-2 text-[14px]', period === key ? 'bg-white font-bold text-[#1A1A1A] shadow-sm' : 'font-medium text-[#6B6B6B]')}
              >
                {key === 'month' ? 'Monthly' : 'Yearly'}
              </button>
            ))}
          </div>
          {savePercent > 0 && (
            <span className='rounded-full bg-[linear-gradient(135deg,#FF4800_23.7%,#FFAA7C_100%)] px-3 py-1 text-[12px] font-bold text-white'>Save {savePercent}%</span>
          )}
        </div>
      )}

      <div className={cn('relative flex gap-2.5', showToggle ? 'mt-4' : 'mt-6')}>
        {visibleTiers.map(t => (
          <PlanCard key={t} tier={t} plan={planFor(t)!} period={period} selected={t === tier} isCurrent={t === activeTier} onSelect={() => setSelectedTier(t)} />
        ))}
      </div>

      {plan && (
        <div className='relative mt-6 flex flex-col gap-2.5'>
          {cashback > 0 && (
            <div className='flex items-center gap-4 rounded-2xl bg-[#FFF7EE] p-4'>
              <span className='flex shrink-0 items-center gap-1.5'>
                <span className='text-[28px] font-black text-[#FF4E08]'>{plan.cashback_label || `${cashback}%`}</span>
                {multiplier > 0 && <span className='rounded-full bg-[#FF4E08] px-2 py-0.5 text-[11px] font-bold text-white'>{multiplier}x</span>}
              </span>
              <span>
                <span className='block text-[14px] font-semibold text-[#1A1A1A]'>Cashback on retail</span>
                <span className='mt-0.5 block text-[12px] text-[#6B6B6B]'>Upload any receipt from outlets on the app</span>
              </span>
            </div>
          )}
          <div className='grid grid-cols-2 gap-2.5'>
            <IconTile title='Deal reveals' sub={dealsSub} icon={<Eye className='size-6 text-[#FF4E08]' />} />
            {benefits.map(b => (
              <IconTile key={b} title={b} icon={<Check className='size-5 text-[#FF4E08]' strokeWidth={2.5} />} />
            ))}
          </div>
        </div>
      )}

      <div className='fixed inset-x-0 bottom-0 z-30 bg-white/85 px-4.5 pt-4 pb-[max(26px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(255,72,0,0.12)] backdrop-blur'>
        <div className='mx-auto max-w-xl'>
          <button
            type='button'
            onClick={onContinue}
            disabled={!canContinue}
            className='h-13 w-full rounded-full bg-[#FF4E08] text-[16px] font-semibold text-white transition-colors hover:bg-[#E64300] disabled:bg-[#D5D5D5]'
          >
            {canContinue || tier !== activeTier ? 'Continue' : 'Current Plan'}
          </button>
          <p className='mt-2 h-4 text-center text-[12px] text-[#6B6B6B]'>
            {canContinue ? `Billed ${mur(amount)} ${period === 'month' ? 'monthly' : 'yearly'}${carryNote}` : ''}
          </p>
        </div>
      </div>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} hideTrigger />
    </div>
  )
}
