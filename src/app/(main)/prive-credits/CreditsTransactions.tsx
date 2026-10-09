'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WalletTransaction } from '@/lib/types/wallet'

const TABS = ['All', 'Earned', 'Used'] as const

function formatDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Credit history with the app's All / Earned / Used tabs (PriveCreditsScreen.jsx). */
export function CreditsTransactions({ transactions }: { transactions: WalletTransaction[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('All')
  const earned = (t: WalletTransaction) => t.type === 'credit'
  const list = tab === 'All' ? transactions : transactions.filter(t => (tab === 'Earned') === earned(t))

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

      {list.length === 0 ? (
        <div className='py-10 text-center'>
          <p className='font-semibold text-gray-800'>
            {tab === 'Earned' ? 'No credits earned yet' : tab === 'Used' ? 'No credits used yet' : 'No transactions yet'}
          </p>
          <p className='mt-1 text-sm text-gray-500'>Pay your bill with PassPrivé to start earning.</p>
        </div>
      ) : (
        <ul className='divide-y divide-gray-100'>
          {list.map(t => {
            const credit = earned(t)
            return (
              <li key={t.id} className='flex items-center gap-3 py-3.5'>
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', credit ? 'bg-green-50 text-green-600' : 'bg-brand-tint text-brand')}>
                  {credit ? <ArrowDownLeft className='h-4 w-4' /> : <ArrowUpRight className='h-4 w-4' />}
                </span>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-[14px] font-semibold text-gray-900'>
                    {credit ? 'Credits earned' : 'Credits used'}{t.restaurant_name ? ` · ${t.restaurant_name}` : ''}
                  </p>
                  <p className='text-[12px] text-gray-500'>{formatDate(t.created_at)}</p>
                </div>
                <span className={cn('text-[14px] font-bold', credit ? 'text-green-600' : 'text-gray-900')}>
                  {credit ? '+' : '−'}Rs {Math.abs(Math.round(Number(t.amount) || 0)).toLocaleString('en-US')}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
