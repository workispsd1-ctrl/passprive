'use client'

import { useRouter } from 'next/navigation'
import { CalendarDays, Eye, Gift, Headphones, Martini, Percent, Receipt, ShoppingBag, Star, Utensils, type LucideIcon } from 'lucide-react'
import { useAuthPrompt } from '@/lib/context/AuthPromptContext'
import type { BenefitKey, PlanTier } from '@/lib/membershipBenefits'
import { cn } from '@/lib/utils'
import { TIER_LABEL } from './plans'

export const BENEFIT_ICON: Record<BenefitKey, LucideIcon> = {
  'free-meals': Utensils,
  mocktails: Martini,
  takeaway: ShoppingBag,
  birthday: Gift,
  'deal-reveals': Eye,
  'top-deals': Percent,
  'retail-cashback': Receipt,
  'table-cashback': CalendarDays,
  'priority-support': Headphones,
  events: Star,
}

// Figma "Prive Black / Plus / Free unit": the pill, its blurred glow and the two words
const PILL: Record<PlanTier, { bg: string; glow: string; glowH: string; prive: string; word: string }> = {
  black: { bg: 'bg-[#0E0C18]', glow: 'bg-[#BF9531]', glowH: 'h-[calc(41.44*var(--u))]', prive: 'text-[#FFF6F2]', word: 'text-[#FFC53D]' },
  plus: { bg: 'bg-[#0044FF]', glow: 'bg-[#00A5B9]', glowH: 'h-[calc(59.37*var(--u))]', prive: 'text-[#BFF6FC]', word: 'text-white' },
  free: { bg: 'bg-[#1D6E45]', glow: 'bg-[#6BBA80]', glowH: 'h-[calc(59.37*var(--u))]', prive: 'text-[#FFFCF5]', word: 'text-white' },
}

/** "Privé Black" pill — Figma 144×57.6, radius 100. */
export function TierPill({ tier, className }: { tier: PlanTier; className?: string }) {
  const look = PILL[tier]
  return (
    <span
      className={cn(
        'relative flex h-[calc(57.6*var(--u))] w-144 shrink-0 items-center justify-center overflow-hidden rounded-full [text-shadow:0_6px_6px_rgba(0,0,0,0.1)] max-lg:h-36 max-lg:w-96',
        look.bg,
        className,
      )}
    >
      <span aria-hidden className={cn('absolute top-[calc(-48.6*var(--u))] left-[calc(-39.2*var(--u))] w-[calc(186.7*var(--u))] -rotate-[9.48deg] rounded-full blur-[calc(19*var(--u))]', look.glow, look.glowH)} />
      <span className={cn('relative font-(family-name:--font-libre-baskerville) text-[calc(21.6*var(--u))] leading-[calc(27*var(--u))] font-bold tracking-[-0.03em] italic max-lg:text-[13px] max-lg:leading-16', look.prive)}>Privé</span>
      <span className={cn('relative ml-[calc(1*var(--u))] text-[calc(26.4*var(--u))] leading-[calc(34*var(--u))] font-extrabold tracking-[-0.07em] max-lg:text-[16px] max-lg:leading-20', look.word)}>{TIER_LABEL[tier]}</span>
    </span>
  )
}

/** Material radio_button 32px — checked: orange ring + dot; unchecked: grey ring. */
export function Radio({ on }: { on: boolean }) {
  return (
    <span className='flex size-32 shrink-0 items-center justify-center max-lg:size-20'>
      <span className={cn('flex size-[calc(26.7*var(--u))] items-center justify-center rounded-full border-[calc(2.67*var(--u))] max-lg:size-18 max-lg:border-2', on ? 'border-[#FF4E08]' : 'border-[#DCDCDC]')}>
        {on && <span className='size-[calc(13.3*var(--u))] rounded-full bg-[#FF4E08] max-lg:size-8'/>}
      </span>
    </span>
  )
}

/**
 * Figma "Upgrade action": the 600×64 orange button and the billing line.
 * Signed out, it asks for a login first and then goes to checkout.
 */
export function UpgradeAction({ label, billed, href, disabled }: { label: string; billed: string; href: string | null; disabled: boolean }) {
  const router = useRouter()
  const { requireLogin } = useAuthPrompt()
  return (
    <div className='flex flex-col items-center max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-30 max-lg:bg-white/90 max-lg:px-16 max-lg:pt-12 max-lg:pb-[max(16px,env(safe-area-inset-bottom))] max-lg:shadow-[0_-8px_24px_rgba(255,72,0,0.12)] max-lg:backdrop-blur'>
      <button
        type='button'
        disabled={disabled || !href}
        onClick={() => href && requireLogin(() => router.push(href))}
        className='flex h-64 w-600 items-center justify-center rounded-[calc(32*var(--u))] bg-[#FF4800] p-10 font-(family-name:--font-inter) text-[calc(20*var(--u))] leading-[calc(22*var(--u))] font-semibold text-white transition-colors hover:bg-[#E64300] disabled:bg-[#D5D5D5] max-lg:h-52 max-lg:w-full max-lg:rounded-full max-lg:text-[16px]'
      >
        {label}
      </button>
      <p className='mt-16 flex h-28 items-center font-(family-name:--font-inter) text-[calc(16*var(--u))] leading-[calc(22*var(--u))] font-medium text-[#666666] max-lg:mt-6 max-lg:h-16 max-lg:text-[12px]'>
        {billed}
      </p>
    </div>
  )
}
