'use client'

import { Wallet, ArrowDownLeft, ArrowUpRight, Sparkles } from 'lucide-react'
import type { WalletBalance, WalletTransaction, UserCashbackInfo } from '@/lib/types/wallet'

const TIER_LABELS: Record<string, string> = {
  none: 'Basic',
  premium: 'Privé Premium',
  black: 'Privé Black',
}

const TIER_COLORS: Record<string, string> = {
  none: 'from-gray-700 to-gray-900',
  premium: 'from-violet-600 to-purple-800',
  black: 'from-gray-900 to-black',
}

function formatAmount(amount: number) {
  return `Rs ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const isCashback = tx.type === 'cashback' || tx.type === 'credit'
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-gray-100 last:border-0">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isCashback ? 'bg-green-100' : 'bg-red-50'}`}>
        {isCashback
          ? <ArrowDownLeft className="w-4 h-4 text-green-600" />
          : <ArrowUpRight className="w-4 h-4 text-red-500" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 capitalize">{tx.type.replace('_', ' ')}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.created_at)}</p>
      </div>
      <span className={`text-sm font-bold ${isCashback ? 'text-green-600' : 'text-red-500'}`}>
        {isCashback ? '+' : '-'}{formatAmount(Math.abs(tx.amount))}
      </span>
    </div>
  )
}

interface Props {
  balance: WalletBalance | null
  transactions: WalletTransaction[]
  cashbackInfo: UserCashbackInfo | null
}

export function WalletClient({ balance, transactions, cashbackInfo }: Props) {
  const tier = cashbackInfo?.membership_tier ?? 'none'
  const rate = cashbackInfo?.cashback_rate ?? 0.5
  const currentBalance = balance?.balance ?? 0

  return (
    <div className="px-4 pb-10 max-w-xl mx-auto">

      {/* Wallet card */}
      <div className={`mt-5 rounded-3xl bg-linear-to-br ${TIER_COLORS[tier] ?? TIER_COLORS.none} p-6 text-white shadow-lg`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 opacity-80" />
            <span className="text-sm font-semibold opacity-80">PassPrivé Wallet</span>
          </div>
          <span className="text-xs font-bold tracking-widest opacity-60 uppercase">
            {TIER_LABELS[tier] ?? 'Basic'}
          </span>
        </div>
        <p className="text-xs font-semibold opacity-60 uppercase tracking-wider mb-1">Available Balance</p>
        <p className="text-4xl font-bold tracking-tight">{formatAmount(currentBalance)}</p>
      </div>

      {/* Cashback rate card */}
      <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-violet-900">You earn {rate}% cashback</p>
          <p className="text-xs text-violet-500 mt-0.5">
            {tier === 'none'
              ? 'Upgrade your membership to earn more'
              : `${TIER_LABELS[tier]} membership perk`}
          </p>
        </div>
        <span className="ml-auto text-2xl font-extrabold text-violet-600">{rate}%</span>
      </div>

      {/* Cashback tiers reference */}
      <div className="mt-4 rounded-2xl border border-gray-100 bg-white divide-y divide-gray-50 overflow-hidden shadow-sm">
        <p className="px-4 pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Membership cashback rates</p>
        {[
          { label: 'Basic', rate: 0.5, tier: 'none' },
          { label: 'Privé Premium', rate: 2, tier: 'premium' },
          { label: 'Privé Black', rate: 4, tier: 'black' },
        ].map(item => (
          <div key={item.tier} className={`flex items-center justify-between px-4 py-3 ${tier === item.tier ? 'bg-violet-50' : ''}`}>
            <span className={`text-sm font-semibold ${tier === item.tier ? 'text-violet-700' : 'text-gray-700'}`}>
              {item.label}
              {tier === item.tier && <span className="ml-2 text-[10px] font-bold text-violet-500 bg-violet-100 px-1.5 py-0.5 rounded-full">Your plan</span>}
            </span>
            <span className={`text-sm font-bold ${tier === item.tier ? 'text-violet-600' : 'text-gray-400'}`}>{item.rate}%</span>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      <div className="mt-6">
        <p className="text-base font-bold text-gray-900 mb-3">Transaction History</p>
        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white py-12 flex flex-col items-center gap-2">
            <Wallet className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-400">No transactions yet</p>
            <p className="text-xs text-gray-300">Cashback will appear here after your payments</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white px-4">
            {transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
          </div>
        )}
      </div>

    </div>
  )
}
