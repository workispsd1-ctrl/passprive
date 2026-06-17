'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Wallet, Sparkles } from 'lucide-react'

interface Props {
  restaurantId: string | null
  restaurantName: string | null
  cashbackRate: number
  membershipTier: string
}

export function PayBillClient({ restaurantId, restaurantName, cashbackRate, membershipTier }: Props) {
  const router = useRouter()
  const [rawValue, setRawValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ cashback: number; bill: number } | null>(null)

  const billAmount = parseFloat(rawValue) || 0
  const cashbackPreview = billAmount > 0 ? Math.round((billAmount * cashbackRate / 100) * 100) / 100 : 0

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/[^0-9.]/g, '')
    const parts = v.split('.')
    if (parts.length > 2) return
    if (parts[1] && parts[1].length > 2) return
    setRawValue(v)
    setError(null)
  }

  async function handleSubmit() {
    if (billAmount <= 0) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/wallet/cashback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bill_amount: billAmount, restaurant_id: restaurantId ?? undefined }),
      })
      const data = await res.json() as { cashback_credited?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to claim cashback')
      setSuccess({ cashback: data.cashback_credited ?? cashbackPreview, bill: billAmount })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-11 h-11 text-green-500" strokeWidth={1.8} />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900">Cashback credited!</h2>
        <p className="text-gray-500 mt-3 max-w-sm leading-relaxed">
          <span className="font-bold text-gray-800">Rs {success.cashback.toFixed(2)}</span> has been added to your PassPrivé wallet for a bill of Rs {success.bill.toFixed(2)}.
        </p>
        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={() => router.push('/wallet')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-colors"
          >
            <Wallet className="w-4 h-4" /> View Wallet
          </button>
          <button
            type="button"
            onClick={() => { setSuccess(null); setRawValue('') }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Enter another bill
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pb-16">

      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Pay Bill</p>
        <h1 className="text-2xl font-extrabold text-gray-900">
          {restaurantName ? `Bill at ${restaurantName}` : 'Enter Your Bill'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Submit your receipt amount to earn cashback into your wallet.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Bill entry ────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Bill Amount (MUR)</p>

            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-gray-400 shrink-0">Rs</span>
              <input
                type="text"
                inputMode="decimal"
                value={rawValue}
                onChange={handleInput}
                placeholder="0.00"
                className="flex-1 text-5xl font-extrabold text-gray-900 bg-transparent border-b-2 border-gray-200 focus:border-violet-500 focus:outline-none pb-2 placeholder:text-gray-200 transition-colors"
              />
            </div>
            <p className="text-xs text-gray-400 mt-3">Enter the total amount from your restaurant receipt</p>

            {error && (
              <p className="mt-4 text-sm text-red-500 font-medium">{error}</p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || billAmount <= 0}
              className="mt-8 flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold text-sm disabled:opacity-40 hover:bg-gray-800 transition-colors"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                : billAmount > 0
                ? <><Sparkles className="w-4 h-4" /> Claim Rs {cashbackPreview.toFixed(2)} cashback</>
                : 'Enter bill amount to continue'}
            </button>
          </div>
        </div>

        {/* ── Right: Summary sidebar ──────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Live cashback summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cashback Summary</p>
            </div>
            <div className="divide-y divide-gray-50">
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-gray-500">Bill amount</span>
                <span className="text-sm font-semibold text-gray-800">
                  {billAmount > 0 ? `Rs ${billAmount.toFixed(2)}` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-gray-500">Cashback rate</span>
                <span className="text-sm font-semibold text-gray-800">{cashbackRate}%</span>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-sm font-bold text-gray-800">You will earn</span>
                <span className={`text-base font-extrabold ${cashbackPreview > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                  {cashbackPreview > 0 ? `+ Rs ${cashbackPreview.toFixed(2)}` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Membership tier info */}
          <div className={`rounded-2xl p-5 text-white ${
            membershipTier === 'black'
              ? 'bg-zinc-950'
              : membershipTier === 'premium'
              ? 'bg-linear-to-br from-violet-600 to-purple-700'
              : 'bg-linear-to-br from-gray-600 to-gray-800'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-white/80" />
              <p className="text-xs font-bold uppercase tracking-wider opacity-70">Your membership</p>
            </div>
            <p className="text-base font-extrabold mt-1">
              {membershipTier === 'black' ? 'Privé Black' : membershipTier === 'premium' ? 'Privé Premium' : 'Basic'}
            </p>
            <p className="text-xs opacity-60 mt-1">{cashbackRate}% cashback on every bill</p>
          </div>

          {/* How it works */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">How it works</p>
            <ol className="flex flex-col gap-2.5">
              {['Dine at the restaurant', 'Enter your total receipt amount', 'Cashback is instantly credited to your wallet'].map((step, i) => (
                <li key={step} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

        </div>
      </div>
    </div>
  )
}
