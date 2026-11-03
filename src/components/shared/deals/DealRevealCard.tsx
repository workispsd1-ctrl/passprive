'use client'

import Image from 'next/image'
import { Loader2, Lock } from 'lucide-react'
import { dealWindowShort, resetLabel, type DealQuota, type RevealItem } from '@/lib/deals'

const SERIF = 'font-(family-name:--font-libre-baskerville)'

/** Splits "15% OFF" / "MUR 300 OFF" / "FREE DESSERT" into the ticket's kicker + headline. */
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

/**
 * One Deal Reveal ticket — app parity: components/DealRevealCard.jsx. Locked:
 * the benefit is blurred behind a lock and "Tap to reveal now"; revealed: the
 * ticket shows the benefit, its window and the terms link.
 */
export function DealRevealCard({
  item,
  quota,
  revealed,
  busy,
  onReveal,
  onTerms,
}: {
  item: RevealItem
  quota: DealQuota | null
  revealed: boolean
  busy: boolean
  onReveal: () => void
  onTerms: () => void
}) {
  const { kicker, headline, onBill } = ticketCopy(item.benefit)
  const windowLine = dealWindowShort(item.terms)
  const reset = resetLabel(quota?.period_end)
  const size = headline.length <= 6 ? 'text-[32px]' : headline.length <= 9 ? 'text-[28px]' : headline.length <= 12 ? 'text-[24px]' : 'text-[20px]'

  return (
    <div className="relative aspect-316/272 w-full shrink-0 overflow-hidden rounded-[20px] border-2 border-white bg-[#FF6A30] font-(family-name:--font-dm-sans) text-white shadow-[0_4px_6px_rgba(0,0,0,0.07)]">
      {/* warm glows — app parity: the card's three radial Glow layers */}
      <div className="pointer-events-none absolute -top-28 -right-24 size-96 rounded-full bg-[radial-gradient(circle,rgba(238,67,0,0.65),transparent_65%)]" />
      <div className="pointer-events-none absolute -bottom-40 -left-36 size-86 rounded-full bg-[radial-gradient(circle,rgba(238,67,0,0.5),transparent_65%)]" />
      <div className="pointer-events-none absolute top-10 left-1/2 size-47 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,236,148,0.22),transparent_65%)]" />

      <Image src="/assets/deals/deal-coin.png" alt="" width={22} height={22} className="pointer-events-none absolute top-[8%] left-[30%] -rotate-20" />
      <Image src="/assets/deals/deal-coin.png" alt="" width={20} height={20} className="pointer-events-none absolute top-[26%] right-[22%] -rotate-42 blur-[1px]" />

      <p className="absolute top-[7%] left-0 right-0 text-center leading-none">
        <span className="block pl-[8%] text-[38px] font-medium text-[#FFEC8B] italic">Deal</span>
        <span className={`${SERIF} -mt-2 block text-[43px] font-bold tracking-[-1.2px] italic`}>Reveal</span>
      </p>

      <div className="absolute inset-x-[7%] top-[36%] h-[37%]">
        <Image src="/assets/deals/deal-ticket.png" alt="" fill className="pointer-events-none object-fill" sizes="280px" />
        {revealed ? (
          <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
            {kicker && <span className="text-[10px] leading-3 font-bold tracking-[3px] text-[#FFEC8B]">{kicker}</span>}
            <span className={`${size} w-full truncate leading-[1.2] font-bold italic [text-shadow:0_4px_4px_#E15F2E]`}>{headline}</span>
            {onBill && <span className="text-[10px] tracking-[1px] text-white/85">on total bill payment</span>}
          </div>
        ) : (
          <div className="relative flex h-full flex-col items-center justify-center gap-1">
            {/* the benefit itself, unreadable until revealed */}
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-[36px] font-bold italic blur-[5px] select-none">
              {item.benefit}
            </span>
            <span className="relative flex size-8.5 items-center justify-center rounded-full bg-white/25">
              <Lock className="size-4.5" strokeWidth={2.4} />
            </span>
            <button
              type="button"
              onClick={onReveal}
              disabled={busy}
              className="relative flex min-h-6 min-w-31.5 items-center justify-center rounded-full bg-white px-3 py-1 text-[12px] font-bold text-[#2247FF] transition-transform hover:scale-[1.03] disabled:opacity-80"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : 'Tap to reveal now'}
            </button>
          </div>
        )}
      </div>

      {revealed
        ? windowLine && (
            <p className="absolute inset-x-0 top-[73%] text-center text-[14px] leading-4.5 font-medium">
              {windowLine.split(/(\d+)/).map((part, i) => (
                <span key={i} className={/\d/.test(part) ? 'font-bold' : undefined}>{part}</span>
              ))}
            </p>
          )
        : reset && (
            <span className="absolute top-[75%] left-1/2 flex h-6 -translate-x-1/2 items-center gap-1 rounded-full border border-[#FFAC8B] px-2 text-[10px] font-semibold whitespace-nowrap">
              <Image src="/assets/deals/deal-calendar.png" alt="" width={18} height={15} />
              {reset}
            </span>
          )}

      <button
        type="button"
        onClick={onTerms}
        className="absolute bottom-[6%] left-1/2 -translate-x-1/2 text-[10px] font-medium underline"
      >
        Terms apply.
      </button>
    </div>
  )
}
