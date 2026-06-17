'use client'

import { Check, Crown, Sparkles, Zap, ArrowRight } from 'lucide-react'
import type { SubscriptionPlan, UserMembership } from '@/lib/types/subscription'
import { TIER_PERKS } from '@/lib/types/subscription'

const PLAN_TIER: Record<string, string> = {
  BasePlan_1: 'premium',
  black_tier: 'black',
}

function formatExpiry(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/* ─── Basic card ────────────────────────────────────────────────── */
function BasicCard({ isActive }: { isActive: boolean }) {
  const perks = TIER_PERKS.none
  return (
    <div className={`relative flex flex-col h-140 rounded-3xl overflow-hidden bg-white border ${isActive ? 'border-gray-300 ring-2 ring-gray-200 shadow-lg' : 'border-gray-200 shadow-sm'}`}>
      {isActive && (
        <span className="absolute top-4 right-4 z-10 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-gray-900 text-white">
          Your plan
        </span>
      )}

      {/* Header */}
      <div className="bg-linear-to-br from-slate-50 to-gray-100 px-6 pt-8 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-5">
          <Zap className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Basic</span>
        </div>
        <p className="text-5xl font-extrabold text-gray-900 leading-none">Free</p>
        <div className="mt-4 inline-flex items-center gap-1.5 bg-gray-200/80 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full">
          ✦ 0.5% cashback
        </div>
      </div>

      {/* Perks */}
      <div className="flex-1 px-6 pt-5">
        <ul className="flex flex-col gap-3">
          {perks.map(perk => (
            <li key={perk} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-500 leading-snug">{perk}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        <div className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-center text-sm font-bold text-gray-400">
          Free forever
        </div>
      </div>
    </div>
  )
}

/* ─── Premium card ──────────────────────────────────────────────── */
function PremiumCard({ plan, isActive, isLoggedIn }: { plan: SubscriptionPlan; isActive: boolean; isLoggedIn: boolean }) {
  const perks = TIER_PERKS.premium
  const href = isLoggedIn ? '/membership/checkout?plan=premium' : '/login?redirect=/membership/checkout?plan=premium'

  return (
    <div className={`relative flex flex-col h-140 rounded-3xl overflow-hidden shadow-xl ${isActive ? 'ring-2 ring-violet-400' : ''}`}>
      {/* Badge */}
      {!isActive && (
        <span className="absolute top-4 right-4 z-10 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/25 text-white border border-white/20 backdrop-blur-sm">
          Popular
        </span>
      )}
      {isActive && (
        <span className="absolute top-4 right-4 z-10 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/20 text-white">
          Your plan
        </span>
      )}

      {/* Header */}
      <div className="bg-linear-to-br from-violet-500 via-purple-600 to-indigo-800 px-6 pt-8 pb-6">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-4 h-4 text-white/80" />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">{plan.plan_name.trim()}</span>
        </div>
        <div className="flex items-end gap-1.5">
          <span className="text-5xl font-extrabold text-white leading-none">Rs {Number(plan.amount).toLocaleString()}</span>
          <span className="text-sm text-white/50 mb-1">/yr</span>
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 bg-white/15 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
          ✦ {plan.cashback}% cashback
        </div>
      </div>

      {/* Perks */}
      <div className="flex-1 bg-white px-6 pt-5">
        <ul className="flex flex-col gap-3">
          {perks.map(perk => (
            <li key={perk} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700 leading-snug">{perk}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="bg-white px-6 pb-6">
        {isActive ? (
          <div className="w-full py-3.5 rounded-2xl border-2 border-violet-200 text-center text-sm font-bold text-violet-400">
            Current plan
          </div>
        ) : (
          <a href={href} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors">
            Get {plan.plan_name.trim()} <ArrowRight className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  )
}

/* ─── Black card ────────────────────────────────────────────────── */
function BlackCard({ plan, isActive, isLoggedIn }: { plan: SubscriptionPlan; isActive: boolean; isLoggedIn: boolean }) {
  const perks = TIER_PERKS.black
  const href = isLoggedIn ? '/membership/checkout?plan=black' : '/login?redirect=/membership/checkout?plan=black'

  return (
    <div className={`relative flex flex-col h-140 rounded-3xl overflow-hidden bg-zinc-950 shadow-2xl ${isActive ? 'ring-1 ring-zinc-600' : ''}`}>
      {/* Amber accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-400/60 to-transparent" />

      {/* Badge */}
      {!isActive && (
        <span className="absolute top-4 right-4 z-10 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/25">
          Most Exclusive
        </span>
      )}
      {isActive && (
        <span className="absolute top-4 right-4 z-10 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 text-white/70">
          Your plan
        </span>
      )}

      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-white/5">
        <div className="flex items-center gap-2 mb-5">
          <Crown className="w-4 h-4 text-amber-400/80" />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">{plan.plan_name.trim()}</span>
        </div>
        <div className="flex items-end gap-1.5">
          <span className="text-5xl font-extrabold text-white leading-none">Rs {Number(plan.amount).toLocaleString()}</span>
          <span className="text-sm text-zinc-600 mb-1">/yr</span>
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full">
          ✦ {plan.cashback}% cashback
        </div>
      </div>

      {/* Perks */}
      <div className="flex-1 px-6 pt-5">
        <ul className="flex flex-col gap-3">
          {perks.map(perk => (
            <li key={perk} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
              <span className="text-sm text-zinc-300 leading-snug">{perk}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        {isActive ? (
          <div className="w-full py-3.5 rounded-2xl border border-white/10 text-center text-sm font-bold text-zinc-600">
            Current plan
          </div>
        ) : (
          <a href={href} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-white text-zinc-900 text-sm font-bold hover:bg-zinc-100 transition-colors">
            Get {plan.plan_name.trim()} <ArrowRight className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────── */
interface Props {
  plans: SubscriptionPlan[]
  membership: UserMembership | null
  isLoggedIn: boolean
}

function SubscriptionTable({ membership, currentTier }: { membership: UserMembership | null; currentTier: string }) {
  const isActive = currentTier !== 'none'
  const tierLabel = currentTier === 'black' ? 'Privé Black' : currentTier === 'premium' ? 'Privé Premium' : 'None'
  const statusLabel = isActive ? 'Active' : 'Inactive'

  const rows = [
    { label: 'Membership status', value: statusLabel, accent: isActive },
    { label: 'Membership type', value: tierLabel, accent: false },
    { label: 'Start date', value: membership?.membership_started ? formatExpiry(membership.membership_started) : 'Not available', accent: false },
    { label: 'End date', value: membership?.membership_expiry ? formatExpiry(membership.membership_expiry) : 'Not available', accent: false },
  ]

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <p className="text-sm font-bold text-gray-700">Subscription details</p>
      </div>
      {rows.map((row, i) => (
        <div key={row.label} className={`flex items-center justify-between px-5 py-3.5 ${i < rows.length - 1 ? 'border-b border-gray-50' : ''}`}>
          <span className="text-sm text-gray-500">{row.label}</span>
          <span className={`text-sm font-semibold ${row.accent ? 'text-green-600' : 'text-gray-800'}`}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function MembershipClient({ plans, membership, isLoggedIn }: Props) {
  const currentTier = membership?.membership_tier ?? 'none'
  const expiryLabel = formatExpiry(membership?.membership_expiry ?? null)

  const premiumPlan = plans.find(p => PLAN_TIER[p.product_id] === 'premium')
  const blackPlan = plans.find(p => PLAN_TIER[p.product_id] === 'black')

  return (
    <div className="relative pb-16 overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-200 h-80 rounded-full bg-violet-500/6 blur-3xl" />

      {/* Hero */}
      <div className="relative px-6 pt-10 pb-6 max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Choose your plan</h1>
        <p className="mt-2 text-[15px] text-gray-500 max-w-sm leading-relaxed">
          Earn cashback on every bill and unlock exclusive dining benefits.
        </p>

        {/* Active membership status pill */}
        {isLoggedIn && membership && currentTier !== 'none' && (
          <div className={`mt-5 inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl text-sm font-semibold text-white ${
            currentTier === 'black' ? 'bg-zinc-900' : 'bg-violet-600'
          }`}>
            {currentTier === 'black' ? <Crown className="w-4 h-4 text-amber-400" /> : <Sparkles className="w-4 h-4" />}
            {currentTier === 'premium' ? 'Privé Premium' : 'Privé Black'} active
            {expiryLabel && <span className="opacity-60 font-normal">· expires {expiryLabel}</span>}
          </div>
        )}
      </div>

      {/* Subscription details table */}
      {isLoggedIn && (
        <div className="relative px-6 max-w-5xl mx-auto mb-8">
          <SubscriptionTable membership={membership} currentTier={currentTier} />
        </div>
      )}

      {/* Cards */}
      <div className="relative px-5 max-w-5xl mx-auto">
        <div className="flex gap-4 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:gap-5 md:items-center">
          <div className="snap-start shrink-0 w-67.5 md:w-auto">
            <BasicCard isActive={currentTier === 'none'} />
          </div>

          {premiumPlan && (
            <div className="snap-start shrink-0 w-67.5 md:w-auto">
              <PremiumCard plan={premiumPlan} isActive={currentTier === 'premium'} isLoggedIn={isLoggedIn} />
            </div>
          )}

          {blackPlan && (
            <div className="snap-start shrink-0 w-67.5 md:w-auto">
              <BlackCard plan={blackPlan} isActive={currentTier === 'black'} isLoggedIn={isLoggedIn} />
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-10">
        Questions? <a href="/support" className="underline text-gray-500">Contact support</a>.
      </p>
    </div>
  )
}
