'use client'

import { Gift, ArrowRight, RotateCcw, Coins, Sparkles } from 'lucide-react'

interface Props {
  balance: number
  eventsCount: number
  brandsCount: number
  onBuyClick: () => void
  onRedeemClick: () => void
}

export function GiftsHero({ balance, eventsCount, brandsCount, onBuyClick, onRedeemClick }: Props) {
  return (
    <section className='relative overflow-hidden bg-[#1A0E07] min-h-[480px] flex items-center'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full bg-brand-dark/30 blur-[120px]' />
        <div className='absolute -bottom-20 right-0 w-[400px] h-[400px] rounded-full bg-brand-light/20 blur-[100px]' />
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full bg-brand/10 blur-[80px]' />
      </div>
      <div className='gifts-hero-grid pointer-events-none absolute inset-0 opacity-[0.04]' />

      <div className='relative w-full max-w-7xl mx-auto px-6 py-16 flex flex-col lg:flex-row items-center gap-12'>

        <div className='flex-1'>
          <div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/30 bg-brand/10 mb-6'>
            <Sparkles className='w-3 h-3 text-white/80' />
            <span className='text-[11px] font-bold text-white/80 tracking-widest uppercase'>Introducing</span>
          </div>
          <h1 className='text-[52px] md:text-[68px] font-black text-white leading-[0.95] mb-5'>
            PassPrivé<br />
            <span className='bg-linear-to-r from-brand/70 to-amber-300 bg-clip-text text-transparent'>Gift</span>
          </h1>
          <p className='text-[16px] text-white/80 max-w-md mb-8 leading-relaxed'>
            Send joy to the people who matter. Choose an occasion, pick a brand, personalise your message — and they spend it wherever they love.
          </p>
          <div className='flex flex-col sm:flex-row gap-3'>
            <button
              type='button'
              onClick={onBuyClick}
              className='inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-[#B83800] font-bold text-[14px] hover:bg-brand-tint transition-colors shadow-2xl shadow-brand/20'
            >
              <Gift className='w-4 h-4' /> Buy a Gift Card
              <ArrowRight className='w-4 h-4' />
            </button>
            <button
              type='button'
              onClick={onRedeemClick}
              className='inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl border border-white/20 text-white font-semibold text-[14px] hover:bg-white/5 transition-colors'
            >
              <RotateCcw className='w-4 h-4' /> Redeem a Code
            </button>
          </div>
        </div>

        <div className='shrink-0 w-full lg:w-auto flex flex-col gap-4 lg:items-end'>
          <div className='w-full lg:w-72 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 text-white'>
            <div className='flex items-start justify-between mb-5'>
              <div>
                <p className='text-[11px] font-semibold text-white/80 uppercase tracking-widest mb-1'>PassPrivé Coins</p>
                <p className='text-[56px] font-black leading-none'>{balance.toLocaleString()}</p>
              </div>
              <div className='w-12 h-12 rounded-2xl bg-brand/50 border border-brand/30 flex items-center justify-center'>
                <Coins className='w-6 h-6 text-white/80' />
              </div>
            </div>
            <div className='flex items-center justify-between pt-4 border-t border-white/10'>
              <span className='text-[12px] text-white/80'>1 Coin = ₨1</span>
              <span className='text-[11px] text-brand/70'>Redeemable at checkout</span>
            </div>
          </div>

          <div className='w-full lg:w-72 grid grid-cols-3 gap-2'>
            {[
              { label: 'Occasions', value: eventsCount || '—' },
              { label: 'Brands',    value: brandsCount || '—' },
              { label: '1 Coin',    value: '= ₨1' },
            ].map(s => (
              <div key={s.label} className='rounded-2xl bg-white/5 border border-white/8 px-3 py-2.5 text-center'>
                <p className='text-[16px] font-black text-white'>{s.value}</p>
                <p className='text-[10px] text-brand/70 mt-0.5'>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
