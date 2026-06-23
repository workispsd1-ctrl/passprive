'use client'

import { Wallet, ArrowDownLeft, ArrowUpRight, Coins, Crown, ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { WalletBalance, WalletTransaction } from '@/lib/types/wallet'
import type { UserMembership } from '@/lib/types/subscription'
import { PLAN_TIER } from '@/lib/types/subscription'

const TIER_LABELS: Record<string, string> = {
  none: 'Basic',
  premium: 'Privé Premium',
  black: 'Privé Black',
}

const TIER_GRADIENT: Record<string, string> = {
  none: 'bg-linear-to-br from-slate-700 via-slate-800 to-slate-900',
  premium: 'bg-linear-to-br from-violet-600 via-purple-700 to-indigo-800',
  black: 'bg-linear-to-br from-zinc-800 via-neutral-900 to-black',
}

const TX_LABELS: Record<string, string> = {
  cashback: 'Cashback earned',
  credit: 'Credit added',
  payment: 'Points redeemed',
  debit: 'Points spent',
  refund: 'Refund',
}

function formatRs(amount: number) {
  return `Rs ${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
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
          {tx.restaurant_name ? `${tx.restaurant_name} · ` : ''}{formatDate(tx.created_at)}
        </p>
      </div>
      <span className={`text-sm font-bold tabular-nums shrink-0 ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
        {isCredit ? '+' : '-'}{formatRs(tx.amount)}
      </span>
    </div>
  )
}

interface Props {
  balance: WalletBalance | null
  transactions: WalletTransaction[]
  membership: UserMembership | null
}

export function WalletClient({ balance, transactions, membership }: Props) {
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
              Rs {currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs opacity-40 mt-3">1 PP Point = Rs 1.00</p>
          </div>
        </div>

        {/* Right column — 2/5 on desktop */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Cashback rate card */}
          <div className="rounded-2xl bg-violet-50 border border-violet-100 p-5 flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-violet-900">You earn {rate}% cashback</p>
              <p className="text-xs text-violet-500 mt-1">
                {isPaid ? `${tierLabel} benefit` : 'On every eligible bill payment'}
              </p>
            </div>
            <span className="text-3xl font-black text-violet-600 tabular-nums">{rate}%</span>
          </div>

          {/* Upgrade prompt — only when on free tier */}
          {!isPaid && (
            <Link
              href="/membership"
              className="rounded-2xl bg-linear-to-br from-violet-600 to-purple-700 p-5 text-white shadow-md flex items-center justify-between gap-3 hover:opacity-95 transition-opacity"
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

          {transactions.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white py-16 flex flex-col items-center gap-2 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-1">
                <Coins className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500">No transactions yet</p>
              <p className="text-xs text-gray-400 max-w-48">
                Pay your bill at any partner restaurant to start earning PP Points
              </p>
            </div>
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
                className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-gray-50' : ''} ${tier === item.tier ? 'bg-violet-50' : ''}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${tier === item.tier ? 'text-violet-700' : 'text-gray-700'}`}>
                      {item.label}
                    </span>
                    {tier === item.tier && (
                      <span className="text-[10px] font-bold text-violet-500 bg-violet-100 px-2 py-0.5 rounded-full">
                        Your plan
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
                <span className={`text-lg font-black tabular-nums ${tier === item.tier ? 'text-violet-600' : 'text-gray-300'}`}>
                  {item.rate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
