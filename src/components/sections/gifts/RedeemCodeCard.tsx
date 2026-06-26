'use client'

import { useState } from 'react'
import { Ticket, CheckCheck } from 'lucide-react'

interface Props {
  onRedeemSuccess: (newBalance: number) => void
}

export function RedeemCodeCard({ onRedeemSuccess }: Props) {
  const [redeemCode, setRedeemCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ amount: number; new_balance: number } | null>(null)

  async function handleRedeem() {
    if (!redeemCode.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/gifts/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode }),
      })
      const data = await res.json() as {
        success?: boolean; message?: string
        amount?: number; new_balance?: number; error?: string
      }
      if (!res.ok || !data.success) {
        setError(data.error ?? data.message ?? 'Invalid or already redeemed code.')
      } else {
        setSuccess({ amount: data.amount!, new_balance: data.new_balance! })
        onRedeemSuccess(data.new_balance!)
        setRedeemCode('')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id='redeem-section' className='rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'>
      <div className='flex items-center gap-2.5 mb-4'>
        <div className='w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center'>
          <Ticket className='w-4 h-4 text-amber-600' />
        </div>
        <h3 className='text-[15px] font-bold text-gray-900'>Redeem a Gift Code</h3>
      </div>

      {success ? (
        <div className='text-center py-3 px-2'>
          <div className='w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3'>
            <CheckCheck className='w-6 h-6 text-green-600' />
          </div>
          <p className='text-[15px] font-bold text-gray-900'>Code Redeemed!</p>
          <p className='text-[13px] text-gray-500 mt-1'>
            <span className='font-semibold text-green-600'>₨{success.amount}</span> added to your balance.
          </p>
          <p className='text-[12px] text-gray-400 mt-0.5'>New balance: ₨{success.new_balance}</p>
          <button
            type='button'
            onClick={() => setSuccess(null)}
            className='mt-3 text-[12px] text-violet-600 font-semibold hover:underline'
          >
            Redeem another code
          </button>
        </div>
      ) : (
        <>
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed mb-2 transition-colors ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus-within:border-violet-400 focus-within:bg-white'
          }`}>
            <input
              type='text'
              placeholder='GIFT-XXXX'
              value={redeemCode}
              onChange={e => { setRedeemCode(e.target.value.toUpperCase()); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && handleRedeem()}
              className='flex-1 bg-transparent text-[14px] font-mono tracking-widest focus:outline-none uppercase placeholder:text-gray-300'
            />
          </div>
          {error && <p className='text-[11px] text-red-500 mb-2 px-1'>{error}</p>}
          <button
            type='button'
            onClick={handleRedeem}
            disabled={loading || !redeemCode.trim()}
            className='w-full py-2.5 rounded-xl bg-gray-900 text-white font-bold text-[13px] disabled:opacity-40 hover:bg-gray-800 transition-colors'
          >
            {loading ? 'Redeeming…' : 'Redeem Code'}
          </button>
        </>
      )}
    </div>
  )
}
