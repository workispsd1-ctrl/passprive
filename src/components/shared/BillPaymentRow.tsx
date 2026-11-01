import Image from 'next/image'
import { Store, UtensilsCrossed } from 'lucide-react'
import type { BillPayment } from '@/lib/services/billPayments'
import { formatMuDateTime } from '@/lib/pointsLedger'
import { cn } from '@/lib/utils'

export const fmtMur = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 })

/** One bill payment — app parity: TransactionsScreen's paid row (logo, place, when, amount). */
export function BillPaymentRow({ p, compact = false }: { p: BillPayment; compact?: boolean }) {
  const Icon = p.kind === 'restaurant' ? UtensilsCrossed : Store
  return (
    <span className='flex min-w-0 flex-1 items-center gap-3'>
      <span className={cn('relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#fff1eb] text-[#ff4800]', compact ? 'size-10' : 'size-12')}>
        {p.image ? <Image src={p.image} alt='' fill sizes='48px' className='object-cover' /> : <Icon className='size-5' />}
      </span>
      <span className='min-w-0 flex-1 text-left'>
        <span className='block truncate text-[14px] font-semibold text-[#1c1c1e]'>{p.name}</span>
        <span className='block truncate text-[12px] text-[#8e8e93]'>{formatMuDateTime(p.createdAt)}</span>
      </span>
      <span className='shrink-0 text-right'>
        <span className={cn('block text-[14px] font-bold', p.paid ? 'text-[#1c1c1e]' : 'text-[#8e8e93] line-through')}>MUR {fmtMur(p.amount)}</span>
        {!p.paid ? (
          <span className='block text-[11px] font-semibold text-[#c62828]'>Not completed</span>
        ) : p.credits ? (
          <span className='block text-[11px] font-semibold text-[#2e8b4a]'>+{p.credits} credits</span>
        ) : null}
      </span>
    </span>
  )
}
