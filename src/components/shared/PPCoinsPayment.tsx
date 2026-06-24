'use client'

import { useState } from 'react'
import { CheckCircle2, Coins, Loader2 } from 'lucide-react'
import { useDecimalInput } from '@/lib/hooks/useDecimalInput'
import { CurrencyInput } from '@/components/shared/CurrencyInput'

interface Props {
  restaurantId: string
  ppBalance: number
  onPaid: (amount: number) => void
}

export function PPCoinsPayment({ restaurantId, ppBalance, onPaid }: Props) {
  const amountInput = useDecimalInput()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paid, setPaid] = useState<number | null>(null)

  const numAmount = amountInput.numericValue
  const insufficient = numAmount > ppBalance

  async function handlePay() {
    if (numAmount <= 0 || insufficient) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/wallet/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount, restaurant_id: restaurantId }),
      })
      const data = await res.json() as { paid?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Payment failed')
      const deducted = data.paid ?? numAmount
      setPaid(deducted)
      onPaid(deducted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (paid !== null) {
    return (
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
        <div className="flex items-center gap-2 text-green-600 mb-2">
          <CheckCircle2 className="w-5 h-5" />
          <p className="font-bold text-sm">Payment successful</p>
        </div>
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-800">₨{paid.toFixed(2)}</span> deducted from your PP Points.
        </p>
        <p className="text-xs text-gray-400 mt-1">Remaining: ₨{(ppBalance - paid).toFixed(2)}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-violet-500" />
          <p className="text-sm font-bold text-gray-800">Pay with PP Points</p>
        </div>
        <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
          ₨{ppBalance.toFixed(2)} available
        </span>
      </div>

      <div className="px-5 py-4">
        <CurrencyInput
          label="Amount (MUR)"
          value={amountInput.value}
          onChange={e => { amountInput.onChange(e); setError(null) }}
          size="sm"
          error={insufficient ? 'Insufficient PP Points balance' : error}
        />
        <button
          type="button"
          onClick={handlePay}
          disabled={loading || numAmount <= 0 || insufficient}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold disabled:opacity-40 hover:bg-gray-800 transition-colors"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            : <><Coins className="w-4 h-4" /> Pay with PP Points</>}
        </button>
      </div>
    </div>
  )
}
