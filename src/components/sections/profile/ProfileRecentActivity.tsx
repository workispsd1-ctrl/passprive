'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { formatPoints, ledgerKindLabel, ledgerTitle, type LedgerRow } from '@/lib/pointsLedger'
import { cn } from '@/lib/utils'

type Tab = 'all' | 'earned' | 'used'

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'earned', label: 'Earned' },
  { key: 'used', label: 'Used' },
]

const EMPTY: Record<Tab, string> = {
  all: 'No Privé Credits activity yet.',
  earned: 'No Privé Credits earned yet.',
  used: 'You haven’t used any Privé Credits yet.',
}

const SMALL = 'text-[calc(12*var(--u))] leading-18'

/** "27 June ‘26, 8:56 PM", Mauritius time. */
function activityTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Indian/Mauritius', day: 'numeric', month: 'long', year: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true,
  }).formatToParts(d)
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === t)?.value ?? ''
  return `${get('day')} ${get('month')} ‘${get('year')}, ${get('hour')}:${get('minute')} ${get('dayPeriod').toUpperCase()}`
}

/** One credits movement — 76 tall: name / area • time / kind on the left, amount + "View details" at x=1030. */
function ActivityRow({ row }: { row: LedgerRow }) {
  const earned = row.type === 'credit'
  const when = activityTime(row.created_at)
  return (
    <li className='relative flex h-76 pt-4 pr-16 pl-16 lg:pr-57'>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-[calc(14*var(--u))] leading-20 font-bold text-[#454040]'>{ledgerTitle(row)}</p>
        <p className={cn(SMALL, 'mt-4 truncate text-[#717171]')}>
          {[row.merchant_area, when].filter(Boolean).join(' • ')}
        </p>
        <p className={cn(SMALL, 'truncate text-[#938F96]')}>{ledgerKindLabel(row)}</p>
      </div>
      <div className='w-93 shrink-0'>
        <p className={cn('text-[calc(14*var(--u))] leading-20 font-bold whitespace-nowrap', earned ? 'text-[#3AA456]' : 'text-[#454040]')}>
          {earned ? '+' : '-'} Rs. {formatPoints(row.amount)}
        </p>
        <Link
          href='/transactions'
          className={cn(SMALL, 'mt-8 flex h-26 w-93 items-center justify-center rounded-[calc(18*var(--u))] border border-[#FF4800] font-semibold text-[#FF4800] hover:bg-[#FFF1EB]')}
        >
          View details
        </Link>
      </div>
      <span aria-hidden className='absolute inset-x-0 bottom-0 h-px bg-[#F0F0F0]' />
    </li>
  )
}

/** "Recent activity" — All / Earned / Used tabs over the latest 4 Privé Credits movements. */
export function ProfileRecentActivity({ ledger, className }: { ledger: LedgerRow[]; className?: string }) {
  const [tab, setTab] = useState<Tab>('all')
  const rows = ledger
    .filter(r => (tab === 'all' ? r.type === 'credit' || r.type === 'debit' : r.type === (tab === 'earned' ? 'credit' : 'debit')))
    .slice(0, 4)

  return (
    <section className={className}>
      <h2 className='text-[calc(24*var(--u))] leading-28 font-bold text-[#2C2D32]'>Recent activity</h2>

      {/* tabs: 84 wide, 30 apart; 3px orange bar under the active one on a 1px orange rule */}
      <div role='tablist' className='relative mt-22 flex gap-30'>
        {TABS.map(t => (
          <button
            key={t.key}
            type='button'
            role='tab'
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className='relative flex h-29 w-84 items-start justify-center gap-6 text-[calc(14*var(--u))] leading-16 font-bold text-[#454040]'
          >
            {t.label}
            {t.key === 'all' && <ChevronDown aria-hidden className='size-16 text-[#FF4800]' strokeWidth={2} />}
            {tab === t.key && <span className='absolute inset-x-0 bottom-0 h-3 rounded-[calc(2.5*var(--u))] bg-[#FF4901]' />}
          </button>
        ))}
        <span aria-hidden className='absolute inset-x-0 bottom-0 h-px bg-[#FF4901]' />
      </div>

      {rows.length === 0 ? (
        <p className='mt-17 py-32 text-center text-[calc(14*var(--u))] text-[#717171]'>{EMPTY[tab]}</p>
      ) : (
        <ul className='mt-17 flex flex-col gap-6'>
          {rows.map(r => <ActivityRow key={r.id} row={r} />)}
        </ul>
      )}

      <div className='mt-20 flex justify-end'>
        <Link
          href='/transactions'
          className='flex h-43 w-300 items-center justify-center gap-12 rounded-[calc(27*var(--u))] border border-[#FF4800] bg-white px-20 text-[calc(14*var(--u))] leading-18 font-bold text-[#FF4800] transition-colors hover:bg-[#FFF1EB]'
        >
          View more transactions
          <ChevronRight className='size-18' strokeWidth={2.2} />
        </Link>
      </div>
    </section>
  )
}
