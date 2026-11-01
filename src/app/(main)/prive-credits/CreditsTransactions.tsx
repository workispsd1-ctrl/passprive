'use client'

import { useState } from 'react'
import { Receipt, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CashbackTx } from '@/lib/services/cashbackSummary'

const TABS = ['All', 'Earned', 'Used'] as const

export type PaymentTx = { id: string; context: string; amount: number; createdAt: string }

function formatDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { timeZone: 'Indian/Mauritius', day: '2-digit', month: 'short', year: 'numeric' })
}

/** app parity: PriveCreditsScreen paymentLabel */
function paymentLabel(ctx: string) {
  const c = ctx.toUpperCase()
  if (c.includes('MEMBERSHIP')) return 'Membership'
  if (c.includes('STORE')) return 'Store Order'
  if (c.includes('BILL')) return 'Bill Payment'
  if (c.includes('GIFT')) return 'Gift Card'
  if (c.includes('BOOKING')) return 'Booking'
  return 'Payment'
}

/**
 * Privé Credits history — app parity: PriveCreditsScreen. All = the member's
 * successful payments; Earned / Used = credit movements from the cashback summary.
 */
export function CreditsTransactions({ payments, credits }: { payments: PaymentTx[]; credits: CashbackTx[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('All')
  const moves = credits.filter(t => (tab === 'Earned' ? t.type === 'credit' : !!t.type && t.type !== 'credit'))
  const count = tab === 'All' ? payments.length : moves.length

  return (
    <div className='mt-3'>
      <div className='flex gap-6 border-b border-gray-100'>
        {TABS.map(t => (
          <button
            key={t}
            type='button'
            onClick={() => setTab(t)}
            className={cn('border-b-2 pb-2.5 text-[14px] transition-colors', t === tab ? 'border-brand font-semibold text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800')}
          >
            {t}
          </button>
        ))}
      </div>

      {count === 0 ? (
        <div className='py-10 text-center'>
          <p className='font-semibold text-gray-800'>
            {tab === 'Earned' ? 'No credits earned yet' : tab === 'Used' ? 'No credits used yet' : 'No transactions yet'}
          </p>
          <p className='mt-1 text-sm text-gray-500'>
            {tab === 'Used' ? 'Redeem your Privé Credits on any bill to see them here.' : 'Pay a bill with PassPrivé to start earning.'}
          </p>
        </div>
      ) : (
        <ul className='divide-y divide-gray-100'>
          {tab === 'All'
            ? payments.map(p => (
                <li key={p.id} className='flex items-center gap-3 py-3.5'>
                  <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1eb] text-brand'>
                    <Receipt className='h-4.5 w-4.5' />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-[14px] font-semibold text-gray-900'>{paymentLabel(p.context)}</p>
                    <p className='text-[12px] text-gray-500'>{formatDate(p.createdAt)}</p>
                  </div>
                  <span className='text-right'>
                    <span className='block text-[14px] font-bold text-gray-900'>MUR {p.amount.toLocaleString('en-US')}</span>
                    <span className='block text-[11px] font-semibold text-green-600'>Success</span>
                  </span>
                </li>
              ))
            : moves.map(t => {
                const credit = t.type === 'credit'
                return (
                  <li key={t.id} className='flex items-center gap-3 py-3.5'>
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', credit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500')}>
                      {credit ? <TrendingUp className='h-4.5 w-4.5' /> : <TrendingDown className='h-4.5 w-4.5' />}
                    </span>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-[14px] font-semibold text-gray-900'>{credit ? 'Cashback Received' : 'Cashback Spent'}</p>
                      <p className='text-[12px] text-gray-500'>{formatDate(t.createdAt)}</p>
                    </div>
                    <span className='text-right'>
                      <span className={cn('block text-[14px] font-bold', credit ? 'text-green-600' : 'text-gray-900')}>
                        {credit ? '+' : '−'}{Math.abs(t.amount).toFixed(2)}
                      </span>
                      <span className='block text-[11px] text-gray-500'>Credits</span>
                    </span>
                  </li>
                )
              })}
        </ul>
      )}
    </div>
  )
}
