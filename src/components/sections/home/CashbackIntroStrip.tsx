'use client'

import { useEffect, useState } from 'react'
import { useUserPlan } from '@/lib/context/PlanContext'
import { planCashbackPct } from '@/lib/cashback'

const SEEN_KEY = 'cashbackIntroStrip:shown'
// app parity: CashbackIntroStrip.jsx timings
const OPEN_MS = 360
const HOLD_MS = 5000
const CLOSE_MS = 420

type Phase = 'hidden' | 'mounted' | 'open' | 'closing'

/**
 * "Earn X% cashback on every bill payment" — app parity:
 * components/Home/CashbackIntroStrip.jsx. The rate is the signed-in user's own
 * plan rate; the strip shows once per visit (the app: once per launch), right
 * under the home banner (HeaderHeroNav) as the app's sits under HomeOffers. Like
 * the app it grows open (360ms, cubic out), holds five seconds and folds away
 * (420ms), drawn as the app draws it: the #4C1BA6 → #2A0C63 base, a soft gloss
 * band, a 110° sheen and 18px bottom corners.
 */
export function CashbackIntroStrip() {
  const plan = useUserPlan()
  const pct = planCashbackPct(plan)
  const [phase, setPhase] = useState<Phase>('hidden')

  useEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1'
    } catch {}
    if (seen) return
    // mount closed, then open on the next frame so the height transition runs.
    // Mark it seen only once it really opens — React's dev double-run of this
    // effect would otherwise mark it on the cancelled first pass and never show it.
    let raf2 = 0
    const mount = setTimeout(() => setPhase('mounted'), 0)
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setPhase('open')
        try {
          sessionStorage.setItem(SEEN_KEY, '1')
        } catch {}
      })
    })
    const close = setTimeout(() => setPhase('closing'), OPEN_MS + HOLD_MS)
    const gone = setTimeout(() => setPhase('hidden'), OPEN_MS + HOLD_MS + CLOSE_MS)
    return () => {
      ;[mount, close, gone].forEach(clearTimeout)
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [])

  if (!pct || phase === 'hidden') return null
  const label = `${pct.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`
  const open = phase === 'open'

  return (
    <div
      role='status'
      // phones: the app's 44px strip; desktop: 64 design px at 1920, scaling with the screen
      className='pp-motion relative w-full overflow-hidden rounded-b-[18px] bg-[#38107C] [--cb-h:44px] lg:rounded-b-[max(18px,calc(100vw*24/1920))] lg:[--cb-h:max(44px,calc(100vw*64/1920))]'
      style={{
        height: open ? 'var(--cb-h)' : 0,
        opacity: phase === 'closing' ? 0 : 1,
        transition: open
          ? `height ${OPEN_MS}ms cubic-bezier(0.33,1,0.68,1)`
          : `height ${CLOSE_MS}ms cubic-bezier(0.65,0,0.35,1), opacity ${CLOSE_MS}ms cubic-bezier(0.65,0,0.35,1)`,
      }}
    >
      {/* base */}
      <span aria-hidden className='absolute inset-0 bg-linear-to-b from-[#4C1BA6] via-[#38107C] to-[#2A0C63]' />
      {/* gloss — the app's 26% on phones; softer across a wide desktop strip so the middle stays rich purple */}
      <span aria-hidden className='absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.26)_40%,rgba(255,255,255,0)_100%)] lg:opacity-45' />
      {/* sheen: the app's still 110° band */}
      <span aria-hidden className='absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0)_30%,rgba(255,255,255,0.22)_50%,rgba(255,255,255,0)_70%)]' />
      {/* a light sweeping across every 3s while it's open (same sweep as the card offer strips) */}
      {open && (
        <span
          aria-hidden
          className='pointer-events-none absolute inset-y-0 w-44 -skew-x-20 bg-linear-to-r from-white/0 via-white/30 to-white/0'
          style={{ animation: `pp-strip-shine 3s ${OPEN_MS}ms infinite` }}
        />
      )}
      <p className='relative flex h-(--cb-h) items-center justify-center gap-2 px-4 font-(family-name:--font-dm-sans) text-[14px] font-medium text-white lg:gap-[max(8px,calc(100vw*12/1920))] lg:text-[max(14px,calc(100vw*20/1920))]'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src='/assets/membership/Wallet.webp'
          alt=''
          className='size-5.5 shrink-0 object-contain opacity-0 motion-reduce:opacity-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] lg:size-[max(22px,calc(100vw*32/1920))]'
          style={open ? { animation: `pp-cb-coin 700ms ${OPEN_MS - 120}ms cubic-bezier(0.34,1.56,0.64,1) forwards` } : undefined}
        />
        <span className='truncate opacity-0 motion-reduce:opacity-100' style={open ? { animation: `pp-cb-rise 420ms ${OPEN_MS + 180}ms cubic-bezier(0.33,1,0.68,1) forwards` } : undefined}>
          Earn <b className='font-bold text-[#FFEC8B]'>{label} cashback</b> on every bill payment
        </span>
      </p>
    </div>
  )
}
