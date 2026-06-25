'use client'

import { useEffect, useState } from 'react'
import { Copy, CheckCheck, Clock } from 'lucide-react'
import type { GiftCode } from '@/lib/types/gifts'

function CodeCard({ code }: { code: GiftCode }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(code.code).catch(() => null)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const statusColour = {
    active: 'bg-green-50 text-green-700 border-green-200',
    redeemed: 'bg-gray-50 text-gray-500 border-gray-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
  }[code.status]

  return (
    <div className='p-4 rounded-2xl border border-gray-100 bg-white flex items-center gap-3'>
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2 mb-1'>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${statusColour}`}>
            {code.status}
          </span>
        </div>
        <p className='font-mono text-[15px] font-bold text-gray-900 tracking-widest'>{code.code}</p>
        <div className='flex items-center gap-1 mt-1'>
          <Clock className='w-3 h-3 text-gray-400' />
          <span className='text-[11px] text-gray-400'>
            {new Date(code.created_at).toLocaleDateString('en-MU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span className='text-gray-300 mx-1'>·</span>
          <span className='text-[11px] font-semibold text-gray-700'>₨{code.amount}</span>
        </div>
      </div>
      {code.status === 'active' && (
        <button
          type='button'
          onClick={copy}
          className='shrink-0 p-2 rounded-xl bg-violet-50 hover:bg-violet-100 transition-colors'
        >
          {copied ? <CheckCheck className='w-4 h-4 text-violet-600' /> : <Copy className='w-4 h-4 text-violet-500' />}
        </button>
      )}
    </div>
  )
}

export function MyCodesPanel() {
  const [codes, setCodes] = useState<GiftCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/gifts/my-codes')
      .then(r => r.json())
      .then((data: { gift_codes?: GiftCode[]; error?: string }) => {
        if (data.error) setError(data.error)
        else setCodes(data.gift_codes ?? [])
      })
      .catch(() => setError('Failed to load your gift codes.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className='space-y-3'>
      {[1, 2, 3].map(i => <div key={i} className='h-20 rounded-2xl bg-gray-100 animate-pulse' />)}
    </div>
  )

  if (error) return <p className='text-[13px] text-red-500 text-center py-8'>{error}</p>

  if (codes.length === 0) return (
    <div className='text-center py-12'>
      <p className='text-[15px] font-semibold text-gray-700'>No gift codes yet</p>
      <p className='text-[13px] text-gray-400 mt-1'>Purchase a gift card to see your codes here.</p>
    </div>
  )

  return (
    <div className='space-y-3'>
      {codes.map(c => <CodeCard key={c.id} code={c} />)}
    </div>
  )
}
