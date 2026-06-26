'use client'

import { useState, useEffect } from 'react'
import { Ticket, Clock, Copy, CheckCheck, Coins } from 'lucide-react'
import type { GiftCode, GiftSummary, GiftTransaction } from '@/lib/types/gifts'

type HistoryTab = 'codes' | 'activity'

interface Props {
  summary: GiftSummary | null
  onBuyClick: () => void
}

export function GiftHistoryCard({ summary, onBuyClick }: Props) {
  const [historyTab, setHistoryTab] = useState<HistoryTab>('codes')
  const [codes, setCodes] = useState<GiftCode[]>([])
  const [codesLoading, setCodesLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/gifts/my-codes')
      .then(r => r.json())
      .then((d: { gift_codes?: GiftCode[] }) => setCodes(d.gift_codes ?? []))
      .catch(() => null)
      .finally(() => setCodesLoading(false))
  }, [])

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code).catch(() => null)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className='rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'>
      <h3 className='text-[15px] font-bold text-gray-900 mb-3'>History</h3>

      <div className='flex gap-1 mb-4'>
        {([['codes', 'My Codes'], ['activity', 'Wallet Activity']] as [HistoryTab, string][]).map(([id, label]) => (
          <button
            key={id}
            type='button'
            onClick={() => setHistoryTab(id)}
            className={`flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all ${
              historyTab === id ? 'bg-violet-50 text-violet-700' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {historyTab === 'codes' && (
        codesLoading ? (
          <div className='space-y-2'>
            {[1, 2].map(i => <div key={i} className='h-16 rounded-xl bg-gray-100 animate-pulse' />)}
          </div>
        ) : codes.length === 0 ? (
          <div className='text-center py-6'>
            <div className='w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3'>
              <Ticket className='w-5 h-5 text-gray-400' />
            </div>
            <p className='text-[13px] font-semibold text-gray-700'>No gift codes yet</p>
            <p className='text-[12px] text-gray-400 mt-1'>Buy a gift card to see your codes here.</p>
            <button
              type='button'
              onClick={onBuyClick}
              className='mt-3 text-[12px] text-violet-600 font-semibold hover:underline'
            >
              Buy now →
            </button>
          </div>
        ) : (
          <div className='space-y-2 max-h-64 overflow-y-auto pr-1'>
            {codes.map(c => (
              <div key={c.id} className='flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-1.5 mb-0.5'>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                      c.status === 'active'   ? 'bg-green-100 text-green-700' :
                      c.status === 'redeemed' ? 'bg-gray-200 text-gray-500' :
                      'bg-red-100 text-red-600'
                    }`}>{c.status}</span>
                    <span className='text-[11px] font-bold text-gray-700'>₨{c.amount}</span>
                  </div>
                  <p className='font-mono text-[11px] font-bold text-gray-900 tracking-wider truncate'>{c.code}</p>
                  <div className='flex items-center gap-1 mt-0.5'>
                    <Clock className='w-2.5 h-2.5 text-gray-400' />
                    <span className='text-[10px] text-gray-400'>
                      {new Date(c.created_at).toLocaleDateString('en-MU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                {c.status === 'active' && (
                  <button
                    type='button'
                    onClick={() => copyCode(c.id, c.code)}
                    className='shrink-0 w-7 h-7 rounded-lg bg-violet-50 hover:bg-violet-100 flex items-center justify-center transition-colors'
                  >
                    {copiedId === c.id
                      ? <CheckCheck className='w-3.5 h-3.5 text-violet-600' />
                      : <Copy className='w-3.5 h-3.5 text-violet-400' />
                    }
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {historyTab === 'activity' && (
        !summary || summary.transactions.length === 0 ? (
          <div className='text-center py-6'>
            <div className='w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3'>
              <Coins className='w-5 h-5 text-gray-400' />
            </div>
            <p className='text-[13px] font-semibold text-gray-700'>No activity yet</p>
            <p className='text-[12px] text-gray-400 mt-1'>Coin credits and spends appear here.</p>
          </div>
        ) : (
          <div className='space-y-2 max-h-64 overflow-y-auto pr-1'>
            {summary.transactions.map((tx: GiftTransaction) => (
              <div key={tx.id} className='flex items-center justify-between p-3 rounded-xl bg-gray-50'>
                <div>
                  <p className='text-[12px] font-semibold text-gray-900 capitalize'>{tx.type}</p>
                  <p className='text-[10px] text-gray-400 mt-0.5'>
                    {new Date(tx.created_at).toLocaleDateString('en-MU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-[13px] font-black ${tx.type === 'spend' ? 'text-red-500' : 'text-green-600'}`}>
                  {tx.type === 'spend' ? '−' : '+'}₨{tx.amount}
                </span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
