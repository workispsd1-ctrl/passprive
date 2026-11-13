'use client'

import { useEffect, useState } from 'react'
import { useUserPlan } from '@/lib/context/PlanContext'
import { planCashbackPct } from '@/lib/cashback'

const SEEN_KEY = 'cashbackIntroStrip:shown'
const HOLD_MS = 5000

/**
 * "Earn X% cashback on every bill payment" — app parity:
 * components/Home/CashbackIntroStrip.jsx. The rate is the signed-in user's own
 * plan rate; the strip shows once per visit (the app: once per launch) and
 * folds away after five seconds.
 */
export function CashbackIntroStrip() {
  const plan = useUserPlan()
  const pct = planCashbackPct(plan)
  const [phase, setPhase] = useState<'hidden' | 'open' | 'closing'>('hidden')

  useEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1'
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {}
    if (seen) return
    const open = setTimeout(() => setPhase('open'), 0)
    const close = setTimeout(() => setPhase('closing'), HOLD_MS)
    const gone = setTimeout(() => setPhase('hidden'), HOLD_MS + 450)
    return () => [open, close, gone].forEach(clearTimeout)
  }, [])

  if (!pct || phase === 'hidden') return null
  const label = `${pct.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`

  return (
    <div
      role="status"
      className={`relative left-1/2 grid w-screen -translate-x-1/2 overflow-hidden rounded-b-[18px] bg-linear-to-b from-[#4C1BA6] via-[#38107C] to-[#2A0C63] transition-[grid-template-rows,opacity] duration-400 ease-out ${phase === 'open' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
    >
      <div className="min-h-0">
        <p className="flex h-11 items-center justify-center gap-2 px-4 text-[14px] font-medium text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/membership/Wallet.webp" alt="" className="h-5.5 w-5.5 object-contain" />
          <span className="truncate">
            Earn <b className="font-bold text-[#FFEC8B]">{label} cashback</b> on every bill payment
          </span>
        </p>
      </div>
    </div>
  )
}
