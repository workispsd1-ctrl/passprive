'use client'

import Image from 'next/image'
import { useUserPlan } from '@/lib/context/PlanContext'
import { cn } from '@/lib/utils'

export type PreviewTier = 'free' | 'plus' | 'black'

const FREE = { key: 'free' as const, src: '/assets/membership/FreeBadge.webp', label: 'Free' }
const PLUS = { key: 'plus' as const, src: '/assets/membership/PlusBadge.webp', label: 'Plus' }
const BLACK = { key: 'black' as const, src: '/assets/membership/BlackBadge.webp', label: 'Black' }

// app parity: TierPills.jsx PILLS_BY_PLAN — your plan first, then the plans above it
const PILLS_BY_PLAN = { free: [FREE, PLUS, BLACK], premiere: [PLUS, BLACK], black: [] }

/**
 * Plan badges over "Offers for you" — app parity: components/TierPills.jsx.
 * The first badge ("Your plan") shows your own offers; tapping a higher plan
 * previews its deals and cashback, greyed and locked.
 */
export function TierPills({ value, onChange, className }: { value: PreviewTier | null; onChange: (tier: PreviewTier | null) => void; className?: string }) {
  const plan = useUserPlan()
  const pills = PILLS_BY_PLAN[plan] ?? PILLS_BY_PLAN.free
  if (!pills.length) return null
  const activeKey = pills.some(p => p.key === value) ? value : pills[0].key

  return (
    <div className={cn('flex items-start justify-between', className)}>
      {pills.map((pill, i) => {
        const active = pill.key === activeKey
        return (
          <button
            key={pill.key}
            type='button'
            aria-pressed={active}
            aria-label={i === 0 ? 'Your plan' : `Preview ${pill.label} offers`}
            onClick={() => onChange(i === 0 ? null : pill.key)}
            className='flex flex-col items-center gap-1'
          >
            <Image src={pill.src} alt='' width={154} height={66} className={cn('h-[33px] w-[77px] object-contain', !active && 'opacity-50 grayscale')} />
            {i === 0 && <span className={cn('text-[11px]', active ? 'font-bold text-[#1C1C1E]' : 'font-medium text-[#8A8A8E]')}>Your plan</span>}
          </button>
        )
      })}
    </div>
  )
}
