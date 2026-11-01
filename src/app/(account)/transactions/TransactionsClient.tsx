'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ReceiptText } from 'lucide-react'
import type { BillPayment } from '@/lib/services/billPayments'
import { formatMuDateTime, formatPoints, ledgerKindLabel, ledgerTitle, type LedgerRow } from '@/lib/pointsLedger'
import { BillPaymentRow, fmtMur } from '@/components/shared/BillPaymentRow'
import { cn } from '@/lib/utils'

const STATUS_TABS = [
  { key: 'paid', label: 'Paid' },
  { key: 'earned', label: 'Earned' },
  { key: 'used', label: 'Used' },
] as const
type StatusTab = (typeof STATUS_TABS)[number]['key']

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function Detail({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'orange' }) {
  return (
    <div className='flex items-center justify-between gap-4 py-1.5 text-[13px]'>
      <span className='text-[#8e8e93]'>{label}</span>
      <span className={cn('font-semibold', accent === 'green' ? 'text-[#2e8b4a]' : accent === 'orange' ? 'text-[#ff4800]' : 'text-[#1c1c1e]')}>{value}</span>
    </div>
  )
}

/** A bill payment that opens to its breakdown — app parity: TransactionDetailsScreen. */
function PaymentItem({ p, defaultOpen }: { p: BillPayment; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <li id={`tx-${p.id}`} className='scroll-mt-24'>
      <button type='button' onClick={() => setOpen(v => !v)} aria-expanded={open} className='flex w-full items-center gap-2 px-4 py-3.5 transition-colors hover:bg-gray-50'>
        <BillPaymentRow p={p} />
        <ChevronDown className={cn('size-4 shrink-0 text-[#8e8e93] transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className='mx-4 mb-4 rounded-2xl bg-[#faf8f7] px-4 py-3'>
          {p.location && <Detail label='Location' value={p.location} />}
          {p.billTotal != null && <Detail label='Bill total' value={`MUR ${fmtMur(p.billTotal)}`} />}
          {p.discount != null && <Detail label='Offer discount' value={`-MUR ${fmtMur(p.discount)}`} accent='orange' />}
          <Detail label={p.paid ? 'Paid' : 'Amount'} value={`MUR ${fmtMur(p.amount)}`} />
          {p.credits != null && p.paid && <Detail label='Privé Credits earned' value={`+${p.credits}`} accent='green' />}
          {!p.paid && <Detail label='Status' value='Not completed — you were not charged' />}
          {p.orderId && <Detail label='Order ID' value={p.orderId} />}
          {p.merchantId && (
            <Link
              href={p.kind === 'restaurant' ? `/dining/${p.merchantId}` : `/stores/${p.merchantId}`}
              className='mt-2 inline-block text-[13px] font-semibold text-[#ff4800] hover:underline'
            >
              View {p.kind === 'restaurant' ? 'restaurant' : 'store'} →
            </Link>
          )}
        </div>
      )}
    </li>
  )
}

/** A Privé Credits movement — earned (+) or used (−). */
function LedgerItem({ row, earned }: { row: LedgerRow; earned: boolean }) {
  return (
    <li className='flex items-center gap-3 px-4 py-3.5'>
      <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-xl', earned ? 'bg-[#e8f6ec] text-[#2e8b4a]' : 'bg-[#fdecec] text-[#c62828]')}>
        <ReceiptText className='size-5' />
      </span>
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-[14px] font-semibold text-[#1c1c1e]'>{ledgerTitle(row)}</span>
        <span className='block truncate text-[12px] text-[#8e8e93]'>{ledgerKindLabel(row)} · {formatMuDateTime(row.created_at)}</span>
      </span>
      <span className={cn('shrink-0 text-[14px] font-bold', earned ? 'text-[#2e8b4a]' : 'text-[#c62828]')}>
        {earned ? '+' : '−'} MUR {formatPoints(row.amount)}
      </span>
    </li>
  )
}

/**
 * Transactions — app parity: TransactionsScreen. Paid (bill payments, with
 * category tabs), Earned and Used (Privé Credits).
 */
export function TransactionsClient({ payments, ledger, openId }: { payments: BillPayment[]; ledger: LedgerRow[]; openId: string | null }) {
  const [tab, setTab] = useState<StatusTab>('paid')
  const [category, setCategory] = useState('all')
  const categories = ['all', ...new Set(payments.map(p => p.category))]
  const paid = category === 'all' ? payments : payments.filter(p => p.category === category)
  const earned = ledger.filter(r => r.type === 'credit')
  const used = ledger.filter(r => r.type === 'debit')
  const empty = { paid: 'No bill payments yet — pay a bill at a PassPrivé restaurant and it shows up here.', earned: 'No Privé Credits earned yet.', used: 'You haven’t used any Privé Credits yet.' }[tab]
  const count = tab === 'paid' ? paid.length : tab === 'earned' ? earned.length : used.length

  return (
    <div className='mx-auto max-w-3xl px-4 pt-4 pb-16 font-(family-name:--font-dm-sans) md:px-6'>
      <div className='flex gap-2'>
        {STATUS_TABS.map(t => (
          <button
            key={t.key}
            type='button'
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-full border px-5 py-2 text-[14px] font-semibold transition-colors',
              tab === t.key ? 'border-[#ff4800] bg-[#ff4800] text-white' : 'border-[#ff4800]/40 text-[#ff4800] hover:bg-[#fff1eb]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'paid' && categories.length > 2 && (
        <div className='scrollbar-hide mt-4 flex gap-6 overflow-x-auto border-b border-gray-100'>
          {categories.map(c => (
            <button
              key={c}
              type='button'
              onClick={() => setCategory(c)}
              className={cn('relative shrink-0 pb-2.5 text-[14px] font-semibold', category === c ? 'text-[#ff4800]' : 'text-[#8e8e93] hover:text-[#5b5a5a]')}
            >
              {c === 'all' ? 'All' : cap(c)}
              {category === c && <span className='absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#ff4800]' />}
            </button>
          ))}
        </div>
      )}

      {count === 0 ? (
        <p className='mt-6 rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center text-[14px] text-gray-500'>{empty}</p>
      ) : (
        <ul className='mt-5 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white'>
          {tab === 'paid'
            ? paid.map(p => <PaymentItem key={p.id} p={p} defaultOpen={p.id === openId} />)
            : (tab === 'earned' ? earned : used).map(r => <LedgerItem key={r.id} row={r} earned={tab === 'earned'} />)}
        </ul>
      )}
    </div>
  )
}
