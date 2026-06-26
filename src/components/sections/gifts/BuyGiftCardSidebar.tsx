'use client'

import { Gift, ArrowRight, Check } from 'lucide-react'

interface Props {
  onBuyClick: () => void
}

export function BuyGiftCardSidebar({ onBuyClick }: Props) {
  return (
    <div className='relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-700 to-violet-900 p-6 text-white shadow-xl shadow-violet-500/20'>
      <div className='pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full bg-violet-500/30 blur-2xl' />
      <div className='pointer-events-none absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-fuchsia-500/20 blur-xl' />
      <div className='relative'>
        <div className='w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center mb-4'>
          <Gift className='w-5 h-5 text-white' />
        </div>
        <p className='text-[18px] font-black mb-1'>Buy a Gift Card</p>
        <p className='text-[13px] text-violet-200 mb-5'>Instantly purchase and share a gift code with anyone.</p>
        <div className='space-y-2 mb-5'>
          {['Choose occasion + brand', 'Add a personal message', 'Pay & share instantly'].map(f => (
            <div key={f} className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0'>
                <Check className='w-2.5 h-2.5 text-white' />
              </div>
              <span className='text-[12px] text-violet-100'>{f}</span>
            </div>
          ))}
        </div>
        <button
          type='button'
          onClick={onBuyClick}
          className='w-full py-3 rounded-2xl bg-white text-violet-700 font-black text-[14px] hover:bg-violet-50 transition-colors flex items-center justify-center gap-2'
        >
          Get Started <ArrowRight className='w-4 h-4' />
        </button>
      </div>
    </div>
  )
}
