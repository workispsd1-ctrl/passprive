'use client'

import { useState } from 'react'
import { X, Gift, CheckCircle } from 'lucide-react'
import type { RedeemResult } from '@/lib/types/gifts'

interface Props {
  onClose: () => void
  onRedeemed: (result: RedeemResult) => void
}

export function RedeemModal({ onClose, onRedeemed }: Props) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<RedeemResult | null>(null)

  async function handleRedeem() {
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/gifts/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json() as RedeemResult & { error?: string }
      if (!res.ok || !data.success) {
        setError(data.error ?? data.message ?? 'Redemption failed. Please check the code and try again.')
      } else {
        setSuccess(data)
        onRedeemed(data)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4'>
      <div className='w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl'>
        <div className='flex items-center justify-between mb-5'>
          <h2 className='text-[18px] font-bold text-gray-900'>Redeem Gift Code</h2>
          <button type='button' onClick={onClose} className='p-1.5 rounded-full hover:bg-gray-100'>
            <X className='w-4 h-4 text-gray-500' />
          </button>
        </div>

        {success ? (
          <div className='text-center py-4'>
            <CheckCircle className='w-14 h-14 text-green-500 mx-auto mb-3' />
            <p className='text-[17px] font-bold text-gray-900'>Code Redeemed!</p>
            <p className='text-[13px] text-gray-500 mt-1'>{success.message}</p>
            <div className='mt-4 p-4 rounded-2xl bg-violet-50 border border-violet-100'>
              <p className='text-[13px] text-violet-600 font-medium'>Amount credited</p>
              <p className='text-[28px] font-black text-violet-700 mt-0.5'>₨{success.amount}</p>
              <p className='text-[12px] text-gray-500 mt-1'>New balance: ₨{success.new_balance}</p>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='mt-5 w-full py-3 rounded-2xl bg-violet-600 text-white font-semibold text-[14px]'
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className='flex items-center gap-3 p-4 rounded-2xl bg-violet-50 border border-violet-100 mb-5'>
              <Gift className='w-5 h-5 text-violet-500 shrink-0' />
              <p className='text-[13px] text-violet-700'>Enter the code from your gift card to add coins to your balance.</p>
            </div>

            <input
              type='text'
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleRedeem()}
              placeholder='GIFT-XXXX'
              className='w-full px-4 py-3 rounded-2xl border border-gray-200 text-[15px] font-mono tracking-widest text-center focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 uppercase'
              maxLength={20}
              autoFocus
            />

            {error && (
              <p className='mt-2 text-[12px] text-red-500 text-center'>{error}</p>
            )}

            <button
              type='button'
              onClick={handleRedeem}
              disabled={loading || !code.trim()}
              className='mt-4 w-full py-3 rounded-2xl bg-violet-600 text-white font-semibold text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity'
            >
              {loading ? 'Redeeming…' : 'Redeem Code'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
