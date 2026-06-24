'use client'

import { CreditCard, Loader2 } from 'lucide-react'

interface Props {
  total: number
  loading: boolean
  error: string | null
  onPay: () => void
}

export function CoverChargeCard({ total, loading, error, onPay }: Props) {
  return (
    <div className="rounded-2xl bg-white border border-violet-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-violet-100 bg-violet-50">
        <p className="text-sm font-bold text-violet-800">Cover Charge Required</p>
        <p className="text-xs text-violet-600 mt-0.5">Pay your cover charge to secure this booking</p>
      </div>
      <div className="px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Amount Due</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-0.5">₨{total.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Redeemable at the restaurant on your visit</p>
        </div>
        <button
          type="button"
          onClick={onPay}
          disabled={loading}
          className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {loading ? 'Redirecting…' : 'Pay Now'}
        </button>
      </div>
      {error && (
        <p className="px-5 pb-4 text-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  )
}
