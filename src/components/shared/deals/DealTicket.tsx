'use client'

import { useId } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RevealItem } from '@/lib/deals'

/*
 * The Deal Reveal ticket — app parity: components/DealRevealCard.jsx (the
 * 358×133 orange ticket with a perforated "REVEAL DEAL / UP TO 5%" stub).
 * Everything is laid out on that frame and sized in container units
 * (1 design px = 100/358 cqw), so the ticket scales as one piece.
 */
const W = 358
const H = 133
const STUB = 96
const NOTCH = 11
const CORNER = 16
const INSET = 5
const HOLE_GAP = 10
const HOLE_TOP = NOTCH + 8

/** design px → container width units */
const q = (px: number) => `${((px * 100) / W).toFixed(3)}cqw`

const TICKET = [
  `M ${CORNER} 0`, `H ${STUB - NOTCH}`, `A ${NOTCH} ${NOTCH} 0 0 0 ${STUB + NOTCH} 0`, `H ${W - CORNER}`,
  `A ${CORNER} ${CORNER} 0 0 1 ${W} ${CORNER}`, `V ${H - CORNER}`, `A ${CORNER} ${CORNER} 0 0 1 ${W - CORNER} ${H}`,
  `H ${STUB + NOTCH}`, `A ${NOTCH} ${NOTCH} 0 0 0 ${STUB - NOTCH} ${H}`, `H ${CORNER}`,
  `A ${CORNER} ${CORNER} 0 0 1 0 ${H - CORNER}`, `V ${CORNER}`, `A ${CORNER} ${CORNER} 0 0 1 ${CORNER} 0`, 'Z',
].join(' ')
const STUB_PATH = `M ${CORNER} 0 H ${STUB - NOTCH} A ${NOTCH} ${NOTCH} 0 0 0 ${STUB} ${NOTCH} V ${H - NOTCH} A ${NOTCH} ${NOTCH} 0 0 0 ${STUB - NOTCH} ${H} H ${CORNER} A ${CORNER} ${CORNER} 0 0 1 0 ${H - CORNER} V ${CORNER} A ${CORNER} ${CORNER} 0 0 1 ${CORNER} 0 Z`
const HOLES = (() => {
  const count = Math.floor((H - HOLE_TOP * 2) / HOLE_GAP) + 1
  const start = (H - (count - 1) * HOLE_GAP) / 2
  return Array.from({ length: count }, (_, i) => start + i * HOLE_GAP)
})()

function TicketShape({ dark }: { dark: boolean }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className='pointer-events-none absolute inset-0 size-full' aria-hidden='true'>
      <defs>
        <linearGradient id={`${id}f`} x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stopColor={dark ? '#2B2B30' : '#FF9A4D'} />
          {!dark && <stop offset='0.55' stopColor='#FF6A30' />}
          <stop offset='1' stopColor={dark ? '#0A0A0C' : '#F2450F'} />
        </linearGradient>
        <linearGradient id={`${id}s`} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stopColor={dark ? '#2B2B30' : '#FF7A35'} />
          <stop offset='1' stopColor={dark ? '#0A0A0C' : '#E23E0A'} />
        </linearGradient>
        <linearGradient id={`${id}g`} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stopColor='#FFFFFF' stopOpacity='0.38' />
          <stop offset='0.5' stopColor='#FFFFFF' stopOpacity='0' />
        </linearGradient>
        <pattern id={`${id}p`} width='10' height='10' patternUnits='userSpaceOnUse' patternTransform='rotate(35)'>
          <rect width='3' height='10' fill='#FFFFFF' fillOpacity='0.07' />
        </pattern>
      </defs>
      <path d={TICKET} fill={`url(#${id}f)`} />
      <path d={TICKET} fill={`url(#${id}p)`} />
      <path d={STUB_PATH} fill={`url(#${id}s)`} />
      <path d={TICKET} fill={`url(#${id}g)`} />
      <path
        d={TICKET}
        fill='none'
        stroke='#FFFFFF'
        strokeOpacity='0.75'
        strokeDasharray='4 3'
        strokeLinecap='round'
        vectorEffect='non-scaling-stroke'
        transform={`translate(${INSET} ${INSET}) scale(${(W - INSET * 2) / W} ${(H - INSET * 2) / H})`}
      />
      {HOLES.map(y => <circle key={y} cx={STUB} cy={y} r='2.4' fill='#FFFFFF' />)}
    </svg>
  )
}

const LOCK = (
  <svg viewBox='0 0 33.8268 33.8268' className='shrink-0' style={{ width: q(33.8), height: q(33.8) }} aria-hidden='true'>
    <path
      fill='#FFFFFF'
      d='M28.1899 11.2782H23.9615V8.75533C23.9615 5.07667 21.2695 1.79265 17.6049 1.44029C13.4047 1.04564 9.86702 4.34375 9.86702 8.45934V11.2782H5.63867V31.0105H28.1899V11.2782ZM16.9143 23.9633C15.3639 23.9633 14.0954 22.6948 14.0954 21.1444C14.0954 19.594 15.3639 18.3255 16.9143 18.3255C18.4647 18.3255 19.7332 19.594 19.7332 21.1444C19.7332 22.6948 18.4647 23.9633 16.9143 23.9633ZM12.6859 11.2782V8.45934C12.6859 6.11966 14.5746 4.231 16.9143 4.231C19.2539 4.231 21.1426 6.11966 21.1426 8.45934V11.2782H12.6859Z'
    />
  </svg>
)

/** "15% OFF" → kicker PERCENTAGE, headline "15% Off" — app: the card's benefit split. */
function ticketCopy(benefit: string) {
  const text = benefit.trim()
  const off = text.match(/^(.*?)\s*OFF$/i)
  const free = text.match(/^FREE\s+(.+)$/i)
  if (off) {
    const pct = /%$/.test(off[1])
    return { kicker: pct ? 'PERCENTAGE' : 'FLAT', headline: `${off[1]}${pct ? '' : ' '}Off`, onBill: true }
  }
  if (free) return { kicker: 'FREE', headline: free[1], onBill: false }
  return { kicker: '', headline: text, onBill: false }
}

export function DealTicket({
  item,
  revealed,
  locked = false,
  busy = false,
  onReveal,
  onTerms,
  className,
}: {
  item: RevealItem
  revealed: boolean
  /** quota used up — the dark ticket */
  locked?: boolean
  busy?: boolean
  onReveal: () => void
  onTerms: () => void
  className?: string
}) {
  const { kicker, headline, onBill } = ticketCopy(item.benefit)
  const headlineSize = headline.length <= 6 ? 32 : headline.length <= 9 ? 28 : headline.length <= 12 ? 24 : 20
  const upTo = item.upTo ?? ''
  const main = 'absolute inset-y-0 right-0 flex flex-col items-center justify-center'

  return (
    <div className={cn('w-full @container', className)}>
      <div className='relative aspect-358/133 w-full font-(family-name:--font-dm-sans) text-white'>
        <TicketShape dark={locked} />

        {/* the stub */}
        <div className='absolute inset-y-0 left-0 flex flex-col items-center justify-center text-center' style={{ width: q(STUB) }}>
          {revealed ? (
            <>
              <span className='font-bold text-[#FFE3C4]' style={{ fontSize: q(10), letterSpacing: q(2) }}>YOUR</span>
              <span className='font-bold' style={{ fontSize: q(18), letterSpacing: q(2) }}>DEAL</span>
            </>
          ) : upTo ? (
            <>
              <span className={cn('font-bold whitespace-nowrap', locked ? 'text-[#FFB48F]' : 'text-[#FFE3C4]')} style={{ fontSize: q(9.5), letterSpacing: q(1) }}>REVEAL DEAL</span>
              <span className={cn('font-bold', locked ? 'text-[#FFB48F]' : 'text-white/80')} style={{ fontSize: q(9), letterSpacing: q(1.2), marginTop: q(2) }}>UP TO</span>
              <span
                className={cn('truncate font-bold', locked ? 'text-[#FF6A30]' : '[text-shadow:0_2px_3px_rgba(120,25,0,0.45)]')}
                style={{ fontSize: q(upTo.length > 4 ? 18 : 28), lineHeight: q(upTo.length > 4 ? 22 : 32), maxWidth: q(STUB - 14) }}
              >
                {upTo}
              </span>
            </>
          ) : (
            <>
              <span className='font-bold text-[#FFE3C4]' style={{ fontSize: q(10), letterSpacing: q(1.6) }}>REVEAL</span>
              <span className='font-bold' style={{ fontSize: q(18), letterSpacing: q(2) }}>DEAL</span>
            </>
          )}
        </div>

        {revealed ? (
          <div className={cn(main, 'text-center')} style={{ width: q(W - STUB) }}>
            {kicker && <span className='font-bold text-[#FFEC8B]' style={{ fontSize: q(10), lineHeight: q(12), letterSpacing: q(3) }}>{kicker}</span>}
            <span
              className='w-full truncate font-bold italic [text-shadow:0_4px_4px_#E15F2E]'
              style={{ fontSize: q(headlineSize), lineHeight: 1.2, paddingInline: q(14) }}
            >
              {headline}
            </span>
            {onBill && <span className='text-white/85' style={{ fontSize: q(10), letterSpacing: q(1), marginTop: 2 }}>on total bill payment</span>}
            <button type='button' onClick={onTerms} className='absolute font-medium underline' style={{ bottom: q(10), fontSize: q(10) }}>
              Terms apply
            </button>
          </div>
        ) : (
          <div className={main} style={{ width: q(W - STUB), gap: q(locked ? 6 : 4) }}>
            {!locked && (
              // the benefit itself, unreadable until revealed
              <span
                aria-hidden='true'
                className='pointer-events-none absolute inset-0 flex items-center justify-center font-bold italic select-none'
                style={{ fontSize: q(36), filter: `blur(${q(5)})` }}
              >
                {item.benefit}
              </span>
            )}
            <span className='relative'>{LOCK}</span>
            <button
              type='button'
              onClick={onReveal}
              disabled={busy}
              className='relative flex items-center justify-center rounded-full bg-white font-bold text-[#2247FF] transition-transform hover:scale-[1.03] disabled:opacity-80'
              style={{ minWidth: q(126), minHeight: q(24), padding: `${q(4)} ${q(12)}`, fontSize: q(12) }}
            >
              {busy ? <Loader2 className='animate-spin' style={{ width: q(16), height: q(16) }} /> : locked ? 'Upgrade' : 'Tap to reveal now'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** "+ Additional" between the deal tickets and the receipt cashback — app parity: DealCashbackConnector.jsx (Figma: 14px #767677, 18px grey dot). */
export function DealCashbackConnector({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-[min(19px,5cqw)] font-(family-name:--font-dm-sans)', className)} aria-label='Plus additional'>
      <span className='h-px flex-1 bg-[#D9D5DC]' />
      <span className='flex shrink-0 items-center gap-1'>
        <span className='flex size-4.5 items-center justify-center rounded-full bg-[#767677] text-[12px] leading-none font-bold text-white'>+</span>
        <span className='text-[13px] leading-5.5 text-[#767677] min-[120rem]:text-[14px]'>Additional</span>
      </span>
      <span className='h-px flex-1 bg-[#D9D5DC]' />
    </div>
  )
}
