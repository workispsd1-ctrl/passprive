'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import LoginDialog from '@/components/LoginDialog'
import type { MembershipPlan, UserMembership } from '@/lib/types/subscription'
import { amountOf, canUpgradeTo, currentPlanOf, tierOf, visualOf } from '@/lib/membershipPlans'

function formatDate(value: string | null) {
  if (!value) return 'Not available'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? 'Not available' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ─── Plan card — app parity: Membership.jsx PlanCard ─────────────────── */
function PlanCard({ plan, isCurrent, canUpgrade, onUpgrade }: { plan: MembershipPlan; isCurrent: boolean; canUpgrade: boolean; onUpgrade: () => void }) {
  const v = visualOf(plan)
  const amount = amountOf(plan.amount)
  const monthly = amount > 0 ? Math.round(amount / 12) : 0
  const dark = v.tier !== 'free'

  return (
    <div
      className='relative overflow-hidden rounded-3xl border-[1.5px]'
      style={{ borderColor: v.borderColor, backgroundColor: v.baseColor, boxShadow: `0 6px 16px ${v.shadowColor}38` }}
    >
      {v.bg && <Image src={v.bg} alt='' fill className='object-cover' sizes='(max-width: 768px) 100vw, 520px' />}
      <div className='relative flex h-full flex-col p-5.5'>
        {v.tags.length > 0 && (
          <div className='mb-4 flex flex-wrap gap-1.5'>
            {v.tags.map(tag => (
              <span key={tag} className='rounded-full bg-[#FFD46E] px-2 py-1 text-[9px] font-bold tracking-[0.3px] text-[#4C3500] uppercase'>
                {tag}
              </span>
            ))}
          </div>
        )}

        {v.badge ? (
          <Image src={v.badge} alt={plan.plan_name.trim()} width={308} height={132} className='mb-4 h-9 w-auto self-start' />
        ) : (
          <p className='mb-4 text-[20px] leading-9 font-bold tracking-[0.4px]' style={{ color: v.textColor }}>{plan.plan_name.trim()}</p>
        )}

        {amount <= 0 ? (
          <p className='mb-4 text-[38px] font-bold' style={{ color: v.textColor }}>Free</p>
        ) : (
          <div className='mb-4'>
            <p className='flex flex-wrap items-baseline'>
              <span className='text-[28px] font-bold text-white'>MUR {amount.toLocaleString()}</span>
              <span className='ml-px text-[18px] font-bold' style={{ color: v.textColor }}>/yr</span>
              {v.originalAmount && (
                <span className='ml-2 text-[14px] font-medium line-through' style={{ color: v.mutedColor }}>
                  MUR {v.originalAmount.toLocaleString()}
                </span>
              )}
            </p>
            {monthly > 0 && <p className='mt-0.5 text-[13px]' style={{ color: v.mutedColor }}>or MUR {monthly}/month</p>}
          </div>
        )}

        <ul className='mb-5.5 flex-1 space-y-2.5'>
          {v.benefits.map(b => (
            <li key={b} className='flex items-center gap-2.5 text-[13px]' style={{ color: v.textColor }}>
              <Check className='h-4 w-4 shrink-0' strokeWidth={2.5} style={{ color: v.checkColor }} />
              {b}
            </li>
          ))}
        </ul>

        <div className='flex gap-2.5'>
          <Link
            href={`/plans/${plan.id}`}
            className={`flex h-12 flex-1 items-center justify-center rounded-full border-[1.5px] px-2.5 text-[13px] font-bold transition-opacity hover:opacity-80 ${
              dark ? 'border-white text-white' : 'border-black/18 text-[#888888]'
            }`}
          >
            Know more
          </Link>
          {isCurrent ? (
            <span className={`flex h-12 flex-1 items-center justify-center rounded-full px-2.5 text-[13px] font-bold ${dark ? 'bg-white/12 text-white/55' : 'bg-black/7 text-[#909090]'}`}>
              Current Plan
            </span>
          ) : canUpgrade && v.ctaLabel ? (
            <button
              type='button'
              onClick={onUpgrade}
              className='flex h-12 flex-1 items-center justify-center rounded-full px-2.5 text-[13px] font-bold transition-opacity hover:opacity-90'
              style={{ backgroundColor: v.ctaBg ?? '#FF5200', color: v.ctaColor ?? '#FFFFFF' }}
            >
              {v.ctaLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

interface Props {
  plans: MembershipPlan[]
  membership: UserMembership | null
  isLoggedIn: boolean
}

/** Membership plans — app parity: screens/Membership.jsx. */
export function MembershipClient({ plans, membership, isLoggedIn }: Props) {
  const router = useRouter()
  const [loginOpen, setLoginOpen] = useState(false)

  // app parity: hasActiveMembership + activeTier
  const rawTier = (membership?.membership_tier ?? 'none').trim().toLowerCase()
  const isActive = rawTier !== 'none' && rawTier !== 'inactive' && rawTier !== 'free'
  const currentPlan = currentPlanOf(plans, membership)
  const activeTier = currentPlan ? tierOf(currentPlan) : isActive ? null : 'free'

  // app parity: Black, Plus, custom tiers, then Free
  const order: Record<string, number> = { black: 0, plus: 1, free: 3 }
  const sorted = [...plans].sort((a, b) => (order[tierOf(a)] ?? 2) - (order[tierOf(b)] ?? 2) || a.sort_order - b.sort_order)

  function upgrade(plan: MembershipPlan) {
    if (!isLoggedIn) { setLoginOpen(true); return }
    router.push(`/membership/checkout?plan=${encodeURIComponent(plan.id)}`)
  }

  return (
    <div className='mx-auto max-w-5xl px-4 pt-1 pb-16 font-(family-name:--font-dm-sans) md:px-6'>
      {/* the page title ("Unlock more with Privé") is in the layout's title row */}
      <p className='mb-6 pl-12.5 text-[14px] text-[#666666]'>One upgrade, endless rewards</p>

      <div className='grid gap-4.5 md:grid-cols-2'>
        {sorted.map(plan => (
          <PlanCard key={plan.id} plan={plan} isCurrent={tierOf(plan) === activeTier} canUpgrade={canUpgradeTo(plan, currentPlan)} onUpgrade={() => upgrade(plan)} />
        ))}
      </div>

      {isActive && membership && (
        <section className='mt-6 rounded-[18px] border border-gray-200 bg-white p-4'>
          <h2 className='mb-2.5 text-[16px] font-bold text-[#161616]'>Subscription details</h2>
          {[
            ['Membership status', 'Active'],
            ['Membership type', (membership.membership_tier ?? '').toUpperCase() || 'Not available'],
            ['Start date', formatDate(membership.membership_started)],
            ['End date', formatDate(membership.membership_expiry)],
          ].map(([label, value]) => (
            <div key={label} className='flex items-center justify-between gap-2.5 border-b border-gray-100 py-2.5 text-[13px] last:border-0'>
              <span className='font-medium text-[#888888]'>{label}</span>
              <span className='text-right font-semibold text-[#161616]'>{value}</span>
            </div>
          ))}
          <div className='mt-3 rounded-xl bg-gray-50 p-3 text-[12px] leading-[18px] text-[#888888]'>
            <p className='text-[13px] font-semibold text-[#161616]'>Consent</p>
            <p className='mt-1'>By continuing your membership, you consent to PassPrivé membership terms, recurring billing rules, and applicable usage conditions.</p>
            <p className='mt-2.5 text-[13px] font-semibold text-[#161616]'>Information disclosure</p>
            <p className='mt-1'>Subscription and payment information may be shared with payment providers and authorized partners only to process billing, deliver benefits, and meet legal obligations.</p>
            <p className='mt-2.5 text-[13px] font-semibold text-[#161616]'>Cancellation</p>
            <p className='mt-1'>Cancellation requests stop upcoming renewals as per policy terms. Charges already processed are handled according to the refund and cancellation policy.</p>
          </div>
        </section>
      )}

      <p className='mt-8 text-center text-[13px] text-[#888888]'>
        Questions? <Link href='/support' className='underline'>Contact support</Link>
      </p>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} hideTrigger />
    </div>
  )
}
