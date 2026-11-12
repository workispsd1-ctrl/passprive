'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Wallet } from 'lucide-react'
import { usePlatformFlags } from '@/lib/context/PlatformFlagsContext'
import type { BookingReward } from '@/lib/services/bookings'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  LOT_STATE_STYLE,
  formatMuDate,
  formatMuDateTime,
  formatPoints,
  ledgerKindLabel,
  ledgerTitle,
  lotStatusLine,
  type LedgerRow,
  type NextExpiry,
} from '@/lib/pointsLedger'

export type WalletTier = 'free' | 'plus' | 'black'

// app parity: WalletScreen.jsx HERO
const HERO: Record<WalletTier, { bg: string; badge: string; base: string; label: string; cashbackLine: string; sixX: boolean; multiplier: number; accent: string; accentSoft: string }> = {
  black: {
    bg: '/assets/membership/hero-black.webp', badge: '/assets/membership/BlackBadge.webp', base: '#0B0B0C', label: 'rgba(255,255,255,0.72)',
    cashbackLine: 'Earn up to 3% cashback as Privé Credits instantly', sixX: false, multiplier: 1, accent: '#B07A1E', accentSoft: '#F0D9A8',
  },
  plus: {
    bg: '/assets/membership/hero-plus.webp', badge: '/assets/membership/PlusBadge.webp', base: '#0C1A3A', label: 'rgba(255,255,255,0.72)',
    cashbackLine: 'Earn up to 1.5% cashback as Privé Credits instantly. Upgrade to Black to earn 2x credits.', sixX: true, multiplier: 2, accent: '#0044FF', accentSoft: '#BFD0FF',
  },
  free: {
    bg: '/assets/membership/hero-free.webp', badge: '/assets/membership/FreeBadge.webp', base: '#243024', label: 'rgba(255,255,255,0.85)',
    cashbackLine: 'Earn up to 0.5% cashback as Privé Credits instantly. Upgrade your membership to earn 6x credits.', sixX: true, multiplier: 6, accent: '#2A6B4A', accentSoft: '#BFE3CF',
  },
}

const TABS = ['All', 'Earned', 'Used'] as const
type Tab = (typeof TABS)[number]

const mur = (v: number) => `MUR ${Math.round(v).toLocaleString('en-US')}`

/** app parity: WalletScreen formatTxDate — "12 Nov 26, 3:05 pm" in Mauritius time */
function txDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const date = d.toLocaleDateString('en-GB', { timeZone: 'Indian/Mauritius', day: 'numeric', month: 'short', year: '2-digit' })
  const time = d.toLocaleTimeString('en-GB', { timeZone: 'Indian/Mauritius', hour: 'numeric', minute: '2-digit', hour12: true })
  return `${date}, ${time}`
}

/** the app's gradient hairline between activity rows */
function GradientDivider() {
  return <div className='h-[1.5px] w-full bg-[linear-gradient(90deg,rgba(216,222,255,0)_0%,rgba(216,222,255,0.6)_30%,rgba(255,106,48,0.55)_50%,rgba(206,212,255,0.6)_70%,rgba(206,212,255,0)_100%)]' />
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-semibold text-gray-900">{value}</span>
    </div>
  )
}

/** Credit / spend breakdown — app parity: screens/PointsTransactionScreen.jsx. */
function LedgerDetailDialog({ row, onClose }: { row: LedgerRow | null; onClose: () => void }) {
  const isCredit = row?.type === 'credit'
  const state = isCredit && row?.lot_state ? LOT_STATE_STYLE[row.lot_state] : null
  const lots = row?.lots ?? []
  const bill = Number(row?.bill_amount)
  return (
    <Dialog open={!!row} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[85dvh] gap-0 overflow-y-auto rounded-3xl bg-white p-6 sm:max-w-md">
        {row && (
          <>
            <div className="flex flex-col items-center text-center">
              <DialogDescription className="text-sm font-medium text-gray-500">{ledgerKindLabel(row)}</DialogDescription>
              <DialogTitle className={`mt-1 text-4xl font-black tabular-nums ${isCredit ? 'text-[#3AA456]' : 'text-[#E23B3B]'}`}>
                {isCredit ? '+' : '-'} {formatPoints(row.amount)}
              </DialogTitle>
              <p className="text-sm text-gray-500">Privé Credits</p>
              {state ? (
                <span className={`mt-2 rounded-full px-3 py-1 text-xs font-bold ${state.chip}`}>{state.label}</span>
              ) : row.status === 'HELD' ? (
                <span className={`mt-2 rounded-full px-3 py-1 text-xs font-bold ${LOT_STATE_STYLE.partly_used.chip}`}>Pending</span>
              ) : null}
            </div>
            <div className="mt-5 rounded-2xl border border-gray-100 px-4">
              <DetailRow label={isCredit ? 'Earned at' : row.type === 'expiry' ? 'Type' : 'Used at'} value={ledgerTitle(row)} />
              <DetailRow label="Area" value={row.merchant_area} />
              <DetailRow label="Bill amount" value={Number.isFinite(bill) && bill > 0 ? `MUR ${bill.toLocaleString('en-US')}` : ''} />
              <DetailRow label={isCredit ? 'Credited on' : row.type === 'expiry' ? 'Expired on' : 'Date'} value={formatMuDateTime(row.created_at)} />
              {isCredit && (
                <>
                  <DetailRow label={row.lot_state === 'expired' ? 'Expired on' : 'Expires on'} value={formatMuDate(row.expires_at, true)} />
                  <DetailRow label="Remaining" value={row.lot_state === 'expired' ? '0' : formatPoints(row.remaining)} />
                </>
              )}
              {row.type === 'expiry' && <DetailRow label="Earned on" value={formatMuDate(row.earned_at, true)} />}
              <DetailRow label="Reference" value={String(row.id ?? '').slice(0, 8).toUpperCase()} />
            </div>
            {lots.length > 0 && (
              <>
                <p className="mt-5 text-sm font-bold text-gray-900">
                  {isCredit ? 'Where these credits went' : 'Credits used (soonest to expire first)'}
                </p>
                <div className="mt-2 rounded-2xl border border-gray-100 px-4">
                  {lots.map((lot, i) => (
                    <div key={`${i}-${lot.at ?? lot.earned_at}`} className="flex items-center justify-between gap-3 border-b border-gray-100 py-3 last:border-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-800">
                          {isCredit
                            ? lot.type === 'expiry' ? 'Expired' : lot.merchant_name || 'Used on a bill'
                            : `Earned ${formatMuDate(lot.earned_at, true)}`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {isCredit ? formatMuDateTime(lot.at) : `Would have expired ${formatMuDate(lot.expires_at, true)}`}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-gray-700">{formatPoints(lot.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface Props {
  balance: number
  /** my_points_ledger rows, or the cashback summary's history when the RPC is unavailable */
  transactions: LedgerRow[]
  nextExpiry: NextExpiry | null
  tier: WalletTier
  pendingRewards: BookingReward[]
}

/** Privé Credits wallet — app parity: screens/WalletScreen.jsx. */
export function WalletClient({ balance, transactions, nextExpiry, tier, pendingRewards }: Props) {
  const { earn } = usePlatformFlags()
  const [detail, setDetail] = useState<LedgerRow | null>(null)
  const [tab, setTab] = useState<Tab>('All')
  const hero = HERO[tier]
  const hasCredits = balance > 0

  const filtered = useMemo(() => {
    if (tab === 'Earned') return transactions.filter(t => t.type === 'credit')
    if (tab === 'Used') return transactions.filter(t => t.type && t.type !== 'credit')
    return transactions
  }, [transactions, tab])

  const { earned, used } = useMemo(() => {
    let e = 0
    let u = 0
    for (const t of transactions) {
      const amt = Math.abs(Number(t.amount) || 0)
      if (t.type === 'credit') e += amt
      else u += amt
    }
    return { earned: e, used: u }
  }, [transactions])

  const steps = [
    'Pay your bill with PassPrivé app',
    hero.cashbackLine,
    'Redeem on next payment on any bill (shopping, dining or wellness)',
    'Use the Privé Credits on top of all other offers & coupons',
  ]

  const tabs = (rich: boolean) => (
    <>
      <div className='mt-3 flex gap-6'>
        {TABS.map(t => (
          <button key={t} type='button' onClick={() => setTab(t)} className='flex flex-col items-center gap-1.5 pt-1'>
            <span className={cn('text-[15px]', t === tab ? 'font-bold text-[#1A1A1A]' : 'font-medium text-[#605D64]')}>{t}</span>
            <span className='h-[3px] w-full rounded-full' style={{ backgroundColor: t === tab ? (rich ? hero.accent : '#FF4800') : 'transparent' }} />
          </button>
        ))}
      </div>
      <div className='h-px w-full' style={{ backgroundColor: rich ? hero.accent : '#E6E0E9' }} />
    </>
  )

  const list = filtered.length === 0 ? (
    <div className='flex flex-col items-center py-10 text-center'>
      <span className='flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF1EB]'>
        <Wallet className='h-8 w-8 text-brand' strokeWidth={1.8} />
      </span>
      <p className='mt-3 text-[16px] font-bold text-[#1A1A1A]'>No transactions yet</p>
      <p className='mt-1 text-[13px] text-[#605D64]'>Pay a bill or shop to see your credits here.</p>
    </div>
  ) : (
    <div>
      {filtered.map((row, i) => {
        const isCredit = row.type === 'credit'
        const status = lotStatusLine(row) || (row.status === 'HELD' ? 'Pending payment' : '')
        const statusClass = row.lot_state ? LOT_STATE_STYLE[row.lot_state]?.text : 'text-[#7A7F87]'
        return (
          <div key={row.id || i}>
            <div className='py-4'>
              <div className='flex items-start justify-between gap-3'>
                <p className='min-w-0 truncate text-[15px] font-semibold text-[#1A1A1A]'>{ledgerTitle(row)}</p>
                <p className='shrink-0 text-[15px] font-bold' style={{ color: isCredit ? '#3AA456' : hasCredits ? '#454040' : '#E23B3B' }}>
                  {isCredit ? '+' : '-'} {mur(Math.abs(Number(row.amount) || 0))}
                </p>
              </div>
              <p className='mt-1 truncate text-[13px] text-[#605D64]'>{[row.merchant_area, txDate(row.created_at)].filter(Boolean).join(' • ')}</p>
              {status && <p className={cn('mt-1 truncate text-[12px] font-medium', statusClass)}>{status}</p>}
              <div className='mt-2 flex justify-end'>
                <button type='button' onClick={() => setDetail(row)} className='rounded-full border border-[#E6E0E9] px-3.5 py-1.5 text-[12px] font-semibold text-[#1A1A1A] hover:bg-[#FAFAFA]'>
                  View details
                </button>
              </div>
            </div>
            {i < filtered.length - 1 && <GradientDivider />}
          </div>
        )
      })}
    </div>
  )

  const seeAll = transactions.length > 0 && (
    <Link href='/transactions' className='mt-2 flex items-center justify-center gap-1 py-3 text-[14px] font-semibold text-[#605D64] hover:text-[#1A1A1A]'>
      See all transactions <ChevronRight className='h-4 w-4' />
    </Link>
  )

  return (
    <div className={cn('mx-auto max-w-2xl pb-16', hero.sixX && 'pb-32')}>
      {/* hero */}
      <section className='relative overflow-hidden px-6 pt-10 pb-8 text-white md:mt-6 md:rounded-3xl' style={{ backgroundColor: hero.base }}>
        <Image src={hero.bg} alt='' fill priority sizes='672px' className='object-cover' />
        <div className='relative'>
          <Image src={hero.badge} alt='' width={308} height={132} className='h-8 w-auto' />
          <p className='mt-6 text-[14px] font-medium' style={{ color: hero.label }}>Available Privé Credits</p>
          <div className='mt-1 flex items-center gap-2'>
            <Image src='/assets/membership/Wallet.webp' alt='' width={36} height={36} className='h-9 w-9 object-contain' />
            <p className='text-[34px] font-bold'>{mur(balance)}</p>
          </div>
          {balance <= 0 && <p className='mt-1 text-[13px]' style={{ color: hero.label }}>1 Privé Credit = MUR 1</p>}
          {nextExpiry && (
            <p className='mt-1 text-[13px]' style={{ color: hero.label }}>
              {`${Math.round(nextExpiry.amount).toLocaleString('en-US')} ${nextExpiry.amount === 1 ? 'credit expires' : 'credits expire'} on ${formatMuDate(nextExpiry.at)}`}
            </p>
          )}
        </div>
      </section>

      <div className='px-4 md:px-0'>
        {earn && pendingRewards.length > 0 && (
          <div className='mt-4 rounded-2xl border border-brand-tint-strong bg-brand-tint p-4'>
            <p className='text-[14px] font-bold text-[#1A1A1A]'>
              Pending Privé Credits · {mur(pendingRewards.reduce((sum, r) => sum + Number(r.amount || 0), 0))}
            </p>
            {pendingRewards.map(r => (
              <div key={r.id} className='mt-2'>
                <p className='truncate text-[13px] text-[#1A1A1A]'>
                  MUR {Math.round(Number(r.amount || 0))} · Table booking at {r.merchant_name || 'restaurant'} · {formatMuDate(r.booking_date)}
                </p>
                <p className='text-[12px] text-[#605D64]'>Unlocks after your visit: scan your bill or pay it with PassPrive by {formatMuDate(r.verify_by)}.</p>
              </div>
            ))}
          </div>
        )}

        {hasCredits ? (
          <>
            <div className='mx-auto -mt-4 w-fit rounded-full px-4 py-1.5 text-[13px] font-semibold text-white relative' style={{ backgroundColor: hero.accent }}>
              1 Privé Credit = MUR 1
            </div>

            <section className='mt-6 rounded-3xl border border-[#F2F4F4] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'>
              <h2 className='text-[18px] font-bold text-[#1A1A1A]'>How it works</h2>
              <ol className='relative mt-4 space-y-5 pl-6'>
                <span className='absolute top-2 bottom-2 left-[3px] border-l border-dashed' style={{ borderColor: hero.accentSoft }} />
                {steps.map((step, i) => (
                  <li key={step} className='relative'>
                    <span className='absolute top-1.5 -left-6 h-[7px] w-[7px] rounded-full' style={{ backgroundColor: hero.accent }} />
                    <p className='text-[14px] leading-5 text-[#1A1A1A]'>{step}</p>
                    {i === 1 && hero.sixX && (
                      <Link href='/membership' className='mt-2 inline-block rounded-full px-3 py-1 text-[12px] font-semibold text-white' style={{ backgroundColor: hero.accent }}>
                        See how →
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </section>

            <Link href='/faq' className='mt-4 flex items-center justify-between gap-4 rounded-3xl bg-[#1A1A1A] px-5 py-4 text-white hover:opacity-95'>
              <span>
                <span className='block text-[14px] font-semibold'>Have more questions regarding Privé Credits?</span>
                <span className='mt-1 flex items-center gap-1 text-[13px] font-semibold text-brand'>Check all FAQs <ChevronRight className='h-3.5 w-3.5' strokeWidth={2.4} /></span>
              </span>
              <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#FFE29E] text-[18px] font-bold text-[#FFE29E]'>!</span>
            </Link>

            <h2 className='mt-8 text-[18px] font-bold text-[#1A1A1A]'>Transactions</h2>
            {tabs(true)}
            {list}
            {seeAll}
          </>
        ) : (
          <>
            <div className='mt-6 grid grid-cols-2 gap-3'>
              {[['CREDITS EARNED', earned], ['CREDITS USED', used]].map(([label, value]) => (
                <div key={label as string} className='relative overflow-hidden rounded-2xl p-4'>
                  <Image src='/assets/wallet/CashbackSavingBackground.webp' alt='' fill sizes='336px' className='object-cover' />
                  <span className='relative inline-block rounded-full bg-[#1A1A1A] px-2.5 py-1 text-[10px] font-bold tracking-wide text-white'>{label}</span>
                  <p className='relative mt-3 text-[22px] font-bold text-[#1A1A1A]'>{mur(value as number)}</p>
                </div>
              ))}
            </div>

            <h2 className='mt-8 text-[18px] font-bold text-[#1A1A1A]'>Credits Transactions</h2>
            {tabs(false)}
            {list}
            {seeAll}

            {hero.sixX && (
              <Link href='/membership' className='mt-6 block rounded-3xl bg-[#0B0B0C] p-5 text-white hover:opacity-95'>
                <span className='flex items-center gap-2 text-[14px] text-white/80'>
                  You could earn {hero.multiplier}x more with
                  <Image src='/assets/membership/BlackBadge.webp' alt='Black' width={308} height={132} className='h-6 w-auto' />
                </span>
                <span className='mt-2 block text-[28px] font-bold'>Earn {Math.round(earned * hero.multiplier).toLocaleString('en-US')}</span>
                <span className='block text-[14px] text-white/80'>Privé Credits</span>
                <span className='mt-4 inline-block rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-[#0B0B0C]'>Upgrade to Black →</span>
              </Link>
            )}

            <Link href='/faq' className='mt-4 flex items-center justify-between gap-4 rounded-3xl border border-[#F2F4F4] px-5 py-4 hover:bg-[#FAFAFA]'>
              <span>
                <span className='block text-[14px] font-semibold text-[#1A1A1A]'>Have more questions regarding Privé Credits?</span>
                <span className='mt-1 block text-[13px] font-semibold text-brand'>Check all FAQs</span>
              </span>
              <ChevronRight className='h-5 w-5 text-brand' />
            </Link>
          </>
        )}
      </div>

      {/* app parity: the "Earn up to Nx cashback" bar pinned to the bottom for Free / Plus */}
      {hero.sixX && (
        <Link href='/membership' className='fixed inset-x-0 bottom-0 z-30 bg-white/95 px-4 pt-3 pb-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur'>
          <span className='mx-auto block max-w-2xl rounded-full bg-[#0B0B0C] py-3 text-center text-[15px] font-semibold text-white'>
            Earn up to {hero.multiplier}x cashback
          </span>
        </Link>
      )}

      <LedgerDetailDialog row={detail} onClose={() => setDetail(null)} />
    </div>
  )
}
