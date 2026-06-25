'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Copy, CheckCheck } from 'lucide-react'
import Link from 'next/link'

type State = 'loading' | 'success' | 'failed'

interface GiftResult {
  gift_code: string
  amount: number
}

function PaymentReturnInner() {
  const params = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<State>('loading')
  const [result, setResult] = useState<GiftResult | null>(null)
  const [copied, setCopied] = useState(false)

  // Personalisation saved before redirect
  const recipientName = typeof window !== 'undefined' ? sessionStorage.getItem('gift_pending_recipient') ?? '' : ''
  const giftTitle = typeof window !== 'undefined' ? sessionStorage.getItem('gift_pending_title') ?? '' : ''

  useEffect(() => {
    const sessionId = params.get('session_id') ?? params.get('SessionId') ?? ''
    const merchantTrace = params.get('merchant_trace') ?? params.get('MerchantTrace') ?? ''
    const status = params.get('status') ?? params.get('Status') ?? ''

    if (!sessionId) { setState('failed'); return }

    async function finalize() {
      try {
        // Step 1: verify
        const verifyRes = await fetch('/api/payments/gift/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, merchant_trace: merchantTrace, status }),
        })
        const verifyData = await verifyRes.json() as { success?: boolean; error?: string }
        if (!verifyRes.ok || verifyData.success === false) { setState('failed'); return }

        // Step 2: finalize (creates the gift code)
        const finalRes = await fetch('/api/payments/gift/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, merchant_trace: merchantTrace }),
        })
        const finalData = await finalRes.json() as { gift_code?: string; amount?: number; error?: string }
        if (!finalRes.ok || !finalData.gift_code) { setState('failed'); return }

        setResult({ gift_code: finalData.gift_code, amount: finalData.amount ?? 0 })
        setState('success')

        // Clean up session storage
        sessionStorage.removeItem('gift_pending_recipient')
        sessionStorage.removeItem('gift_pending_title')
        sessionStorage.removeItem('gift_pending_message')
        sessionStorage.removeItem('gift_pending_image')
      } catch {
        setState('failed')
      }
    }

    void finalize()
  }, [params])

  function copy() {
    if (!result) return
    navigator.clipboard.writeText(result.gift_code).catch(() => null)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (state === 'loading') return (
    <main className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='text-center'>
        <Loader2 className='w-10 h-10 text-violet-500 animate-spin mx-auto mb-4' />
        <p className='text-[15px] font-semibold text-gray-700'>Confirming your gift…</p>
        <p className='text-[13px] text-gray-400 mt-1'>Please don't close this page.</p>
      </div>
    </main>
  )

  if (state === 'failed') return (
    <main className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
      <div className='max-w-sm w-full text-center bg-white rounded-3xl p-8 shadow-sm'>
        <XCircle className='w-14 h-14 text-red-400 mx-auto mb-4' />
        <h1 className='text-[20px] font-bold text-gray-900'>Payment Failed</h1>
        <p className='text-[13px] text-gray-500 mt-2'>Your gift card was not created. No charge was made.</p>
        <Link href='/gifts' className='mt-6 block w-full py-3 rounded-2xl bg-gray-900 text-white font-semibold text-[14px] text-center'>
          Try Again
        </Link>
      </div>
    </main>
  )

  return (
    <main className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
      <div className='max-w-sm w-full'>
        <div className='text-center mb-6'>
          <CheckCircle className='w-14 h-14 text-green-500 mx-auto mb-3' />
          <h1 className='text-[22px] font-bold text-gray-900'>Gift Card Created!</h1>
          {recipientName && (
            <p className='text-[14px] text-gray-500 mt-1'>
              {giftTitle || 'A gift'} for <span className='font-semibold text-gray-700'>{recipientName}</span>
            </p>
          )}
        </div>

        {/* Voucher card */}
        <div className='rounded-3xl bg-gradient-to-br from-violet-800 to-violet-600 p-6 text-white text-center mb-4'>
          <p className='text-violet-200 text-[11px] font-semibold uppercase tracking-wider mb-3'>PassPrivé Gift Card</p>
          <p className='text-[32px] font-black mb-1'>₨{result!.amount.toLocaleString()}</p>
          <p className='text-violet-200 text-[12px] mb-4'>Gift Card Value</p>
          <div className='bg-white/10 backdrop-blur rounded-2xl px-4 py-3'>
            <p className='font-mono text-[18px] font-bold tracking-widest'>{result!.gift_code}</p>
          </div>
        </div>

        <button
          type='button'
          onClick={copy}
          className='w-full py-3 rounded-2xl border-2 border-violet-200 bg-violet-50 text-violet-700 font-semibold text-[14px] flex items-center justify-center gap-2 mb-3'
        >
          {copied ? <CheckCheck className='w-4 h-4' /> : <Copy className='w-4 h-4' />}
          {copied ? 'Copied!' : 'Copy Code'}
        </button>

        <p className='text-[12px] text-gray-400 text-center mb-5'>
          Share this code with the recipient so they can redeem it in the PassPrivé app.
        </p>

        <button
          type='button'
          onClick={() => router.push('/gifts')}
          className='w-full py-3 rounded-2xl bg-gray-900 text-white font-semibold text-[14px]'
        >
          Done
        </button>
      </div>
    </main>
  )
}

export default function GiftPaymentReturnPage() {
  return (
    <Suspense fallback={
      <main className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <Loader2 className='w-8 h-8 text-violet-500 animate-spin' />
      </main>
    }>
      <PaymentReturnInner />
    </Suspense>
  )
}
