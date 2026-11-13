import Link from 'next/link'
import { ArrowRight, EllipsisVertical, MessageSquareText } from 'lucide-react'
import type { ProfileSummary, ProfileTier } from '@/lib/services/profileSummary'
import { cn } from '@/lib/utils'

// Figma shows the Plus pill (#0044FF + teal glow); Black and Free follow the same build.
const TIER_PILL: Record<ProfileTier, { label: string; bg: string; glow: string; prive: string }> = {
  plus: { label: 'Plus', bg: 'bg-[#0044FF]', glow: 'bg-[#00A5B9]', prive: 'text-[#BFF6FC]' },
  black: { label: 'Black', bg: 'bg-[#1A1A1A]', glow: 'bg-[#6B6B6B]', prive: 'text-[#E9DDB4]' },
  free: { label: 'Free', bg: 'bg-[#FF4800]', glow: 'bg-[#FFB38F]', prive: 'text-[#FFF0CE]' },
}

const ACTION = 'flex h-39 w-40 items-center justify-center rounded-[calc(18.5*var(--u))] bg-white/10 text-[#DADADA]'

/** Navy card: name, email, phone, "View details", membership pill, chat + more. 1576×224, radius 24. */
export function ProfileOverview({ summary, className }: { summary: ProfileSummary; className?: string }) {
  const pill = TIER_PILL[summary.tier]
  return (
    <section className={cn('relative overflow-hidden rounded-[calc(24*var(--u))] bg-[#0A1A4D] px-24 pt-24 pb-28 text-white lg:h-224 lg:px-40 lg:pt-38 lg:pb-0', className)}>
      {/* top-card-glow-1 */}
      <span
        aria-hidden
        className='pointer-events-none absolute top-3 -left-26 h-57 w-440 rotate-[10deg] bg-white mix-blend-overlay blur-[calc(43*var(--u))]'
      />

      <div className='relative max-lg:pr-96'>
        <h1 className='line-clamp-2 text-[calc(32*var(--u))] leading-42 font-bold'>{summary.name}</h1>
        {summary.email && <p className='mt-6 truncate text-[calc(16*var(--u))] leading-21'>{summary.email}</p>}
        {summary.phone && <p className='mt-7 truncate text-[calc(16*var(--u))] leading-21'>{summary.phone}</p>}
        {/* app parity: Profile.jsx "View details" → ProfileDetails */}
        <Link
          href='/profile/details'
          className='mt-28 flex h-27.5 w-122.5 items-center justify-center gap-6 rounded-[calc(14*var(--u))] bg-white font-(family-name:--font-inter) text-[calc(15*var(--u))] leading-20 font-medium text-[#0044FF] hover:bg-[#EEF2FF]'
        >
          View details
          <ArrowRight className='size-14' strokeWidth={2.2} />
        </Link>
      </div>

      {/* Profile actions + More actions — 40×39, 8 apart, 24 from the top */}
      <div className='absolute top-24 right-24 flex gap-8 lg:right-32'>
        <Link href='/support' aria-label='Chat with us' className={cn(ACTION, 'hover:bg-white/20')}>
          <MessageSquareText className='size-18' strokeWidth={1.8} />
        </Link>
        <span aria-hidden className={ACTION}>
          <EllipsisVertical className='size-20' strokeWidth={2.4} />
        </span>
      </div>

      {/* Privé Plus membership — 126×54, centred on the right */}
      <Link
        href='/membership'
        aria-label={`Privé ${pill.label} membership`}
        className={cn(
          'absolute right-24 bottom-24 flex h-54 w-126 items-baseline justify-center overflow-hidden rounded-[calc(39.6*var(--u))] pt-11.5 lg:top-83 lg:right-80 lg:bottom-auto',
          pill.bg,
        )}
      >
        <span aria-hidden className={cn('absolute -top-42.75 -left-30.5 h-52 w-163.75 -rotate-[9.48deg] blur-[calc(16.7*var(--u))]', pill.glow)} />
        <span className={cn('relative font-(family-name:--font-libre-baskerville) text-[calc(19.05*var(--u))] leading-24 font-bold tracking-[-0.03em] italic [text-shadow:0_calc(5.5*var(--u))_calc(5.5*var(--u))_rgba(0,0,0,0.1)]', pill.prive)}>
          Privé
        </span>
        <span className='relative text-[calc(23.05*var(--u))] leading-30 font-extrabold tracking-[-0.07em] text-white [text-shadow:0_calc(5.5*var(--u))_calc(5.5*var(--u))_rgba(0,0,0,0.1)]'>
          {pill.label}
        </span>
      </Link>
    </section>
  )
}
