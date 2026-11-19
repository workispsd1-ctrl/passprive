import { cn } from '@/lib/utils'

/** app parity: OfferStripLabel TEXT_STARS — where the stars pop around the text, and when (share of the sweep). */
const STARS: { style: React.CSSProperties; delay: number; size: number }[] = [
  { style: { left: -14, top: -7 }, delay: 0, size: 13 },
  { style: { left: '22%', top: -9 }, delay: 0.08, size: 9 },
  { style: { left: '50%', top: -8 }, delay: 0.16, size: 11 },
  { style: { left: '78%', top: -9 }, delay: 0.24, size: 9 },
  { style: { right: -18, top: -5 }, delay: 0.32, size: 14 },
  { style: { right: -12, bottom: -10 }, delay: 0.4, size: 9 },
  { style: { left: '60%', bottom: -12 }, delay: 0.24, size: 11 },
  { style: { left: '30%', bottom: -11 }, delay: 0.12, size: 9 },
  { style: { left: -12, bottom: -10 }, delay: 0.04, size: 11 },
]

const CYCLE_S = 3 // 1.8s sweep + 1.2s rest
const SWEEP_S = 1.8

function Sparkle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='currentColor' aria-hidden>
      <path d='M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z' />
    </svg>
  )
}

/**
 * The orange offer strip under a card photo, animated as the app's
 * OfferStripLabel: a light sweeps across, the text sways with it and small
 * stars pop around the words, every 3 seconds. All strips share one clock
 * (same duration, no offset), so a rail of cards glints together.
 */
export function OfferStrip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('pp-motion relative overflow-hidden', className)}>
      <span
        aria-hidden
        className='pointer-events-none absolute inset-y-0 w-11 -skew-x-20 bg-linear-to-r from-white/0 via-white/55 to-white/0'
        style={{ animation: `pp-strip-shine ${CYCLE_S}s infinite` }}
      />
      <span className='relative inline-block' style={{ animation: `pp-strip-sway ${CYCLE_S}s ease-in-out infinite` }}>
        {children}
        {STARS.map((s, i) => (
          <span
            key={i}
            aria-hidden
            className='pointer-events-none absolute text-white opacity-0'
            style={{ ...s.style, animation: `pp-strip-star ${CYCLE_S}s ${s.delay * SWEEP_S}s infinite` }}
          >
            <Sparkle size={s.size} />
          </span>
        ))}
      </span>
    </div>
  )
}
