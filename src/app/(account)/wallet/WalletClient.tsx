'use client'

import { useState } from 'react'
import { Wallet, ArrowDownLeft, ArrowUpRight, Coins, Crown, ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { WalletBalance, WalletTransaction } from '@/lib/types/wallet'
import type { UserMembership } from '@/lib/types/subscription'
import { PLAN_TIER } from '@/lib/types/subscription'
import { formatMRU, formatISODate } from '@/lib/utils/format'
import { EmptyStateCard } from '@/components/shared/EmptyStateCard'
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

const TIER_LABELS: Record<string, string> = {
  none: 'Basic',
  premium: 'Privé Premium',
  black: 'Privé Black',
}

const TIER_GRADIENT: Record<string, string> = {
  none: 'bg-linear-to-br from-slate-700 via-slate-800 to-slate-900',
  premium: 'bg-linear-to-br from-brand via-brand-dark to-brand-dark',
  black: 'bg-linear-to-br from-zinc-800 via-neutral-900 to-black',
}

const TX_LABELS: Record<string, string> = {
  cashback: 'Cashback earned',
  credit: 'Credit added',
  payment: 'Points redeemed',
  debit: 'Points spent',
  refund: 'Refund',
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const isCredit = tx.type === 'cashback' || tx.type === 'credit' || tx.type === 'refund'
  const label = TX_LABELS[tx.type] ?? tx.type.replace(/_/g, ' ')

  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-gray-100 last:border-0">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? 'bg-green-50' : 'bg-red-50'}`}>
        {isCredit
          ? <ArrowDownLeft className="w-4 h-4 text-green-500" />
          : <ArrowUpRight className="w-4 h-4 text-red-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 capitalize">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {tx.restaurant_name ? `${tx.restaurant_name} · ` : ''}{formatISODate(tx.created_at)}
        </p>
      </div>
      <span className={`text-sm font-bold tabular-nums shrink-0 ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
        {isCredit ? '+' : '-'}{formatMRU(tx.amount)}
      </span>
    </div>
  )
}

/** One Privé Credits movement — app parity: WalletScreen activity row (ledger shape). */
function LedgerRowItem({ row, onOpen }: { row: LedgerRow; onOpen: () => void }) {
  const isCredit = row.type === 'credit'
  const status = lotStatusLine(row)
  const statusClass = row.lot_state ? LOT_STATE_STYLE[row.lot_state]?.text : 'text-gray-400'
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 border-b border-gray-100 py-3.5 text-left last:border-0 hover:bg-gray-50/60">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? 'bg-green-50' : 'bg-red-50'}`}>
        {isCredit ? <ArrowDownLeft className="w-4 h-4 text-green-500" /> : <ArrowUpRight className="w-4 h-4 text-red-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-gray-800">{ledgerTitle(row)}</p>
        <p className="mt-0.5 truncate text-xs text-gray-400">
          {[row.merchant_area, formatMuDateTime(row.created_at)].filter(Boolean).join(' • ')}
        </p>
        {status && <p className={`mt-0.5 truncate text-xs font-medium ${statusClass}`}>{status}</p>}
      </div>
      <span className={`text-sm font-bold tabular-nums shrink-0 ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
        {isCredit ? '+' : '-'} MUR {formatPoints(row.amount)}
      </span>
      <ChevronRight className="size-4 shrink-0 text-gray-300" />
    </button>
  )
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
  balance: WalletBalance | null
  transactions: WalletTransaction[]
  /** my_points_ledger rows; null when the RPC is unavailable (→ `transactions`) */
  ledger: LedgerRow[] | null
  nextExpiry: NextExpiry | null
  membership: UserMembership | null
}

export function WalletClient({ balance, transactions, ledger, nextExpiry, membership }: Props) {
  const [detail, setDetail] = useState<LedgerRow | null>(null)
  const rawTier = membership?.membership_tier ?? 'none'
  const resolvedTier = PLAN_TIER[rawTier] ?? rawTier
  const tier = resolvedTier in TIER_LABELS ? resolvedTier : 'none'
  const tierLabel = TIER_LABELS[tier]
  const rate = membership?.cashback_rate ?? 0.5
  const currentBalance = balance?.balance ?? 0
  const isPaid = tier !== 'none'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-6">

      {/* Top grid: balance card + info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Balance card — takes 3/5 on desktop */}
        <div className={`lg:col-span-3 rounded-3xl ${TIER_GRADIENT[tier]} p-7 text-white shadow-xl relative overflow-hidden`}>
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 opacity-70">
                <Wallet className="w-4 h-4" />
                <span className="text-xs font-semibold tracking-wide">PassPrivé Wallet</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
                <Crown className="w-3 h-3 opacity-80" />
                <span className="text-[11px] font-bold tracking-widest uppercase opacity-90">{tierLabel}</span>
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-1">Available Balance</p>
            <p className="text-5xl font-black tracking-tight">
              MUR {currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs opacity-40 mt-3">1 Privé Credit = MUR 1</p>
            {nextExpiry && (
              <p className="text-xs opacity-70 mt-1">
                {nextExpiry.amount.toLocaleString('en-US')} {nextExpiry.amount === 1 ? 'credit expires' : 'credits expire'} on {formatMuDate(nextExpiry.at)}
              </p>
            )}
          </div>
        </div>

        {/* Right column — 2/5 on desktop */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Cashback rate card */}
          <div className="rounded-2xl bg-brand-tint border border-brand-tint-strong p-5 flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-brand-tint-strong flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-brand-dark">You earn {rate}% cashback</p>
              <p className="text-xs text-brand mt-1">
                {isPaid ? `${tierLabel} benefit` : 'On every eligible bill payment'}
              </p>
            </div>
            <span className="text-3xl font-black text-brand tabular-nums">{rate}%</span>
          </div>

          {/* Upgrade prompt — only when on free tier */}
          {!isPaid && (
            <Link
              href="/membership"
              className="rounded-2xl bg-linear-to-br from-brand to-brand-dark p-5 text-white shadow-md flex items-center justify-between gap-3 hover:opacity-95 transition-opacity"
            >
              <div>
                <p className="text-sm font-bold">Upgrade to Privé Premium</p>
                <p className="text-xs opacity-80 mt-1">Earn up to 4% at partner restaurants</p>
              </div>
              <ChevronRight className="w-5 h-5 opacity-70 shrink-0" />
            </Link>
          )}

          {/* Membership expiry for paid members */}
          {isPaid && membership?.membership_expiry && (() => {
            const expiry = new Date(membership.membership_expiry)
            const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / 86400000)
            const isExpiringSoon = daysLeft <= 30
            return (
              <div className={`rounded-2xl p-5 ${isExpiringSoon ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-100'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${isExpiringSoon ? 'text-amber-700' : 'text-green-700'}`}>
                  {isExpiringSoon ? `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}` : 'Membership active'}
                </p>
                <p className={`text-sm font-medium mt-1 ${isExpiringSoon ? 'text-amber-800' : 'text-green-800'}`}>
                  {expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {isExpiringSoon && (
                  <a href="/membership" className="inline-block mt-2 text-xs font-bold text-amber-700 underline underline-offset-2">
                    Renew now
                  </a>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Main content: transactions + rate table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">

        {/* Transaction history — 3/5 */}
        <div className="lg:col-span-3">
          <p className="text-base font-bold text-gray-900 mb-3">Transaction History</p>

          {ledger ? (
            ledger.length === 0 ? (
              <EmptyStateCard
                icon={<Coins className="w-7 h-7 text-gray-300" />}
                heading="No transactions yet"
                description="Pay your bill or upload a receipt at a partner merchant to start earning Privé Credits"
              />
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white px-4 shadow-sm">
                {ledger.map(row => <LedgerRowItem key={row.id} row={row} onOpen={() => setDetail(row)} />)}
              </div>
            )
          ) : transactions.length === 0 ? (
            <EmptyStateCard
              icon={<Coins className="w-7 h-7 text-gray-300" />}
              heading="No transactions yet"
              description="Pay your bill at any partner restaurant to start earning PP Points"
            />
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white px-4 shadow-sm">
              {transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
            </div>
          )}
        </div>

        {/* Rates table — 2/5 */}
        <div className="lg:col-span-2">
          <p className="text-base font-bold text-gray-900 mb-3">Cashback Rates</p>

          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            {[
              { label: 'Basic', rate: 0.5, tier: 'none', desc: 'All restaurants' },
              { label: 'Privé Premium', rate: 2, tier: 'premium', desc: 'Preferred Partners' },
              { label: 'Privé Black', rate: 4, tier: 'black', desc: 'Preferred Partners' },
            ].map((item, i) => (
              <div
                key={item.tier}
                className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-gray-50' : ''} ${tier === item.tier ? 'bg-brand-tint' : ''}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${tier === item.tier ? 'text-brand-dark' : 'text-gray-700'}`}>
                      {item.label}
                    </span>
                    {tier === item.tier && (
                      <span className="text-[10px] font-bold text-brand bg-brand-tint-strong px-2 py-0.5 rounded-full">
                        Your plan
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
                <span className={`text-lg font-black tabular-nums ${tier === item.tier ? 'text-brand' : 'text-gray-300'}`}>
                  {item.rate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <LedgerDetailDialog row={detail} onClose={() => setDetail(null)} />
    </div>
  )
}
