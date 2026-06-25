'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Gift, Check, ChevronRight, Star, MapPin, Trophy, Utensils } from 'lucide-react'
import type { VisitRewardEntry, RepeatRewardTier } from '@/lib/services/visitRewards'

// ─── Colour tokens (exact match from app RepeatRewardSection) ────────────────
const ORANGE = '#F5821F'
const GREEN = '#2EA05A'

// ─── Reward text helper (identical to app) ───────────────────────────────────
function rewardText(tier: RepeatRewardTier): string {
  const v = tier?.rewardValue
  switch (tier?.rewardType) {
    case 'FREE_ITEM': return tier?.rewardLabel || 'Free item'
    case 'FLAT':      return v ? `MUR ${v} off` : 'Discount'
    case 'PERCENT':   return v ? `${v}% off` : 'Discount'
    default:          return tier?.rewardLabel || 'Reward'
  }
}

// ─── Subtitle (identical to app) ─────────────────────────────────────────────
function buildSubtitle(visits: number, tiers: RepeatRewardTier[]): string {
  const sorted = [...tiers].sort((a, b) => (a.visitCount || 0) - (b.visitCount || 0))
  const next = sorted.find(t => (t.visitCount || 0) > visits)
  if (next) {
    return `${visits} visit${visits === 1 ? '' : 's'} · ${next.visitCount - visits} more for ${rewardText(next)}`
  }
  return `${visits} visit${visits === 1 ? '' : 's'} · all rewards unlocked 🎉`
}

// ─── Gradient progress bar ────────────────────────────────────────────────────
function ProgressBar({ visits, tiers }: { visits: number; tiers: RepeatRewardTier[] }) {
  const sorted = [...tiers].sort((a, b) => (a.visitCount || 0) - (b.visitCount || 0))
  const max = sorted[sorted.length - 1]?.visitCount ?? 1
  const pct = Math.min((visits / max) * 100, 100)

  return (
    <div className="relative h-1.5 rounded-full bg-gray-100 my-3">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${GREEN} 0%, ${ORANGE} 100%)` }}
      />
      {sorted.map(tier => {
        const pos = Math.min(((tier.visitCount || 0) / max) * 100, 100)
        const earned = visits >= (tier.visitCount || 0)
        return (
          <div
            key={tier.id ?? tier.visitCount}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm"
            style={{ left: `${pos}%`, backgroundColor: earned ? GREEN : '#e5e7eb' }}
          />
        )
      })}
    </div>
  )
}

// ─── Stamp circle (identical colour logic to app) ────────────────────────────
function StampCircle({ tier, visits, isNext }: { tier: RepeatRewardTier; visits: number; isNext: boolean }) {
  const earned = visits >= (tier?.visitCount || 0)
  const accent = earned ? GREEN : isNext ? ORANGE : null

  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ minWidth: 64 }}>
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
        style={accent
          ? { backgroundColor: accent, boxShadow: `0 4px 12px ${accent}55` }
          : { backgroundColor: 'transparent', border: '2px solid #e5e7eb' }
        }
      >
        {earned
          ? <Check className="w-5 h-5 text-white" strokeWidth={3} />
          : <span className="text-[13px] font-bold" style={{ color: isNext ? '#fff' : '#9ca3af' }}>{tier?.visitCount}</span>
        }
      </div>
      <span
        className="text-[10px] font-semibold text-center leading-tight"
        style={{ maxWidth: 64, color: earned ? GREEN : isNext ? ORANGE : '#9ca3af' }}
      >
        {rewardText(tier)}
      </span>
    </div>
  )
}

// ─── Restaurant reward card — dining-page card style ─────────────────────────
function RewardCard({ entry }: { entry: VisitRewardEntry }) {
  const { reward } = entry
  const tiers = [...reward.tiers].sort((a, b) => (a.visitCount || 0) - (b.visitCount || 0))
  const visits = reward.visitCount
  const nextTier = tiers.find(t => (t.visitCount || 0) > visits)
  const allUnlocked = tiers.length > 0 && !nextTier
  const subtitle = tiers.length > 0 ? buildSubtitle(visits, tiers) : null

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      {/* ── Cover image — same aspect-ratio & gradient overlay as dining cards ── */}
      <Link
        href={entry.slug ? `/dining/${entry.slug}` : '#'}
        className="group relative block aspect-[4/3] bg-gray-900 overflow-hidden shrink-0"
        tabIndex={entry.slug ? 0 : -1}
      >
        {entry.coverImage ? (
          <Image
            src={entry.coverImage}
            alt={entry.name}
            fill
            className="object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900 to-gray-900" />
        )}
        {/* Same dark-to-transparent gradient as dining cards */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* Reward badge top-left */}
        <span
          className="absolute top-2.5 left-2.5 flex items-center gap-1 text-white text-[9px] font-bold px-2.5 py-1 rounded-full leading-none shadow-sm"
          style={{ background: `linear-gradient(90deg, ${ORANGE} 0%, #ff9f43 100%)` }}
        >
          <Gift className="w-2.5 h-2.5" />
          Repeat Rewards
        </span>

        {/* Visit count badge top-right */}
        {visits > 0 && (
          <span className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/50 text-white text-[9px] font-bold px-2 py-1 rounded-lg leading-none backdrop-blur-sm">
            <Trophy className="w-2.5 h-2.5 text-amber-400" />
            {visits} visit{visits === 1 ? '' : 's'}
          </span>
        )}

        {/* Restaurant info overlay — bottom of image, same as dining cards */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-[15px] font-bold leading-tight truncate">{entry.name}</p>
          {(entry.area || entry.city) && (
            <p className="text-white/60 text-[11px] mt-0.5 truncate flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              {[entry.area, entry.city].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {entry.rating > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span className="text-white/80 text-[10px] font-semibold">{entry.rating.toFixed(1)}</span>
              </span>
            )}
            {entry.cuisines.length > 0 && (
              <>
                {entry.rating > 0 && <span className="w-0.5 h-0.5 rounded-full bg-white/30" />}
                <span className="text-white/50 text-[10px] flex items-center gap-1 truncate">
                  <Utensils className="w-2.5 h-2.5 shrink-0" />
                  {entry.cuisines.slice(0, 2).join(' · ')}
                </span>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* ── Repeat-rewards stamp section — below the image ─────────────────── */}
      <div className="p-3 flex-1">
        <div
          className="rounded-xl border p-3"
          style={{ backgroundColor: '#FFF8F0', borderColor: 'rgba(245,130,31,0.25)' }}
        >
          {/* Section title */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 shrink-0" style={{ color: ORANGE }} />
              <span className="text-[12px] font-semibold text-gray-900">Repeat visit rewards</span>
            </div>
            {allUnlocked && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${GREEN}20`, color: GREEN }}>
                All unlocked!
              </span>
            )}
          </div>

          {tiers.length > 0 ? (
            <>
              {/* Subtitle */}
              <p className="text-[10px] text-gray-500 mb-2 leading-tight">{subtitle}</p>

              {/* Progress bar */}
              <ProgressBar visits={visits} tiers={tiers} />

              {/* Stamp circles */}
              <div className="flex gap-3 overflow-x-auto pt-1 pb-0.5" style={{ scrollbarWidth: 'none' }}>
                {tiers.map((tier, i) => {
                  const isNext = nextTier != null && (tier.visitCount || 0) === nextTier.visitCount
                  return (
                    <StampCircle key={tier.id ?? i} tier={tier} visits={visits} isNext={isNext} />
                  )
                })}
              </div>
            </>
          ) : (
            <p className="text-[10px] text-gray-400 leading-tight">
              Reward tiers are being set up for this restaurant. Check back soon!
            </p>
          )}
        </div>

        {/* Visit restaurant CTA */}
        {entry.slug && (
          <Link
            href={`/dining/${entry.slug}`}
            className="group mt-2.5 flex items-center justify-center gap-1.5 w-full text-[11px] font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 py-2.5 rounded-xl transition-colors"
          >
            View restaurant
            <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ rewards }: { rewards: VisitRewardEntry[] }) {
  const totalVisits = rewards.reduce((s, r) => s + r.reward.visitCount, 0)
  const earned = rewards.reduce(
    (s, r) => s + r.reward.tiers.filter(t => r.reward.visitCount >= (t.visitCount || 0)).length, 0
  )
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { label: 'Participating', value: rewards.length, suffix: rewards.length === 1 ? 'place' : 'places' },
        { label: 'Total visits', value: totalVisits, suffix: '' },
        { label: 'Rewards earned', value: earned, suffix: '' },
      ].map(({ label, value, suffix }) => (
        <div key={label} className="flex flex-col items-center bg-white rounded-2xl py-4 shadow-sm border border-gray-100">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          {suffix && <span className="text-[9px] text-gray-400 font-medium">{suffix}</span>}
          <span className="text-[10px] font-medium text-gray-400 text-center leading-tight mt-0.5">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #fff7ed 100%)' }}
      >
        <Gift className="w-9 h-9" style={{ color: ORANGE }} />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">No rewards yet</h2>
      <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
        Earn exclusive rewards every time you dine at participating PassPrivé restaurants.
        Check back soon — more restaurants are joining!
      </p>
      <Link
        href="/dining"
        className="mt-6 inline-flex items-center gap-2 bg-violet-600 text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-violet-700 transition-colors shadow-sm"
      >
        Explore restaurants
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

// ─── Page root ────────────────────────────────────────────────────────────────
export function VisitRewardsClient({ rewards }: { rewards: VisitRewardEntry[] }) {
  return (
    <main className="min-h-screen bg-white pb-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <h1 className="text-[18px] font-bold text-gray-900 mb-4">Visit Rewards</h1>

        {rewards.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {rewards.map(entry => (
              <RewardCard key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </main>
  )
}
