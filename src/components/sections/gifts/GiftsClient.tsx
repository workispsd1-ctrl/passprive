'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Gift, Search, Sparkles, Copy, CheckCheck,
  Clock, ChevronRight, ArrowRight, Coins,
  RotateCcw, Ticket, Check, Star,
} from 'lucide-react'
import type {
  GiftEvent, GiftBrand, GiftDiscount,
  GiftSummary, GiftCode, GiftTransaction,
} from '@/lib/types/gifts'
import { PurchaseModal } from './PurchaseModal'

const EVENT_CATEGORIES = [
  { id: 'all',       label: 'All Occasions',       icon: '🎁' },
  { id: 'personal',  label: 'Personal Milestones',  icon: '🎂' },
  { id: 'life',      label: 'Life Events',           icon: '💝' },
  { id: 'festivals', label: 'Festivals & Holidays',  icon: '🎄' },
]

const HOW_IT_WORKS = [
  { icon: '🎉', title: 'Pick an occasion', body: 'Choose from birthdays, weddings, festivals and more.' },
  { icon: '🏪', title: 'Select a brand', body: 'Pick one or more restaurants or stores to attach.' },
  { icon: '💌', title: 'Send with a message', body: 'Add a personal note. The recipient redeems instantly.' },
]

type HistoryTab = 'codes' | 'activity'

interface Props {
  events: GiftEvent[]
  brands: GiftBrand[]
  discounts: GiftDiscount[]
  summary: GiftSummary | null
}

export function GiftsClient({ events, brands, discounts, summary }: Props) {
  const [showPurchase, setShowPurchase] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [balance, setBalance] = useState(summary?.balance ?? 0)

  const [redeemCode, setRedeemCode] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemError, setRedeemError] = useState<string | null>(null)
  const [redeemSuccess, setRedeemSuccess] = useState<{ amount: number; new_balance: number } | null>(null)

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

  const filteredEvents = events.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase())
  )

  async function handleRedeem() {
    if (!redeemCode.trim()) return
    setRedeemLoading(true)
    setRedeemError(null)
    setRedeemSuccess(null)
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
        setRedeemError(data.error ?? data.message ?? 'Invalid or already redeemed code.')
      } else {
        setRedeemSuccess({ amount: data.amount!, new_balance: data.new_balance! })
        setBalance(data.new_balance!)
        setRedeemCode('')
      }
    } catch {
      setRedeemError('Something went wrong. Please try again.')
    } finally {
      setRedeemLoading(false)
    }
  }

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code).catch(() => null)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <>
      {/* ─────────────────────────────────────────────
          HERO
      ───────────────────────────────────────────── */}
      <section className='relative overflow-hidden bg-[#0e0120] min-h-[480px] flex items-center'>
        {/* Decorative orbs */}
        <div className='pointer-events-none absolute inset-0'>
          <div className='absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full bg-violet-700/30 blur-[120px]' />
          <div className='absolute -bottom-20 right-0 w-[400px] h-[400px] rounded-full bg-fuchsia-600/20 blur-[100px]' />
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full bg-violet-500/10 blur-[80px]' />
        </div>

        {/* Grid overlay texture */}
        <div className='gifts-hero-grid pointer-events-none absolute inset-0 opacity-[0.04]' />

        <div className='relative w-full max-w-7xl mx-auto px-6 py-16 flex flex-col lg:flex-row items-center gap-12'>

          {/* Left — headline */}
          <div className='flex-1'>
            <div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 mb-6'>
              <Sparkles className='w-3 h-3 text-violet-300' />
              <span className='text-[11px] font-bold text-violet-300 tracking-widest uppercase'>Introducing</span>
            </div>

            <h1 className='text-[52px] md:text-[68px] font-black text-white leading-[0.95] mb-5'>
              PassPrivé<br />
              <span className='bg-linear-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent'>Gift</span>
            </h1>

            <p className='text-[16px] text-violet-200/80 max-w-md mb-8 leading-relaxed'>
              Send joy to the people who matter. Choose an occasion, pick a brand, personalise your message — and they spend it wherever they love.
            </p>

            <div className='flex flex-col sm:flex-row gap-3'>
              <button
                type='button'
                onClick={() => setShowPurchase(true)}
                className='inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-[#2d0a5e] font-bold text-[14px] hover:bg-violet-50 transition-colors shadow-2xl shadow-violet-500/20'
              >
                <Gift className='w-4 h-4' /> Buy a Gift Card
                <ArrowRight className='w-4 h-4' />
              </button>
              <button
                type='button'
                onClick={() => document.getElementById('redeem-section')?.scrollIntoView({ behavior: 'smooth' })}
                className='inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl border border-white/20 text-white font-semibold text-[14px] hover:bg-white/5 transition-colors'
              >
                <RotateCcw className='w-4 h-4' /> Redeem a Code
              </button>
            </div>
          </div>

          {/* Right — floating cards */}
          <div className='shrink-0 w-full lg:w-auto flex flex-col gap-4 lg:items-end'>

            {/* Coins balance card */}
            <div className='w-full lg:w-72 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 text-white'>
              <div className='flex items-start justify-between mb-5'>
                <div>
                  <p className='text-[11px] font-semibold text-violet-300 uppercase tracking-widest mb-1'>PassPrivé Coins</p>
                  <p className='text-[56px] font-black leading-none'>{balance.toLocaleString()}</p>
                </div>
                <div className='w-12 h-12 rounded-2xl bg-violet-600/50 border border-violet-400/30 flex items-center justify-center'>
                  <Coins className='w-6 h-6 text-violet-200' />
                </div>
              </div>
              <div className='flex items-center justify-between pt-4 border-t border-white/10'>
                <span className='text-[12px] text-violet-300'>1 Coin = ₨1</span>
                <span className='text-[11px] text-violet-400'>Redeemable at checkout</span>
              </div>
            </div>

            {/* Mini stats */}
            <div className='w-full lg:w-72 grid grid-cols-3 gap-2'>
              {[
                { label: 'Occasions', value: events.length || '—' },
                { label: 'Brands', value: brands.length || '—' },
                { label: '1 Coin', value: '= ₨1' },
              ].map(s => (
                <div key={s.label} className='rounded-2xl bg-white/5 border border-white/8 px-3 py-2.5 text-center'>
                  <p className='text-[16px] font-black text-white'>{s.value}</p>
                  <p className='text-[10px] text-violet-400 mt-0.5'>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          HOW IT WORKS
      ───────────────────────────────────────────── */}
      <section className='border-b border-gray-100 bg-white'>
        <div className='max-w-7xl mx-auto px-6 py-10'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className='flex items-start gap-4'>
                <div className='shrink-0 w-10 h-10 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-xl'>
                  {step.icon}
                </div>
                <div>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-[10px] font-black flex items-center justify-center'>{i + 1}</span>
                    <p className='text-[14px] font-bold text-gray-900'>{step.title}</p>
                  </div>
                  <p className='text-[13px] text-gray-500 leading-snug'>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          MAIN CONTENT
      ───────────────────────────────────────────── */}
      <div className='bg-gray-50 min-h-screen'>
        <div className='max-w-7xl mx-auto px-4 md:px-6 py-10 pb-20'>
          <div className='flex flex-col lg:flex-row gap-8'>

            {/* ── Left column ── */}
            <div className='flex-1 min-w-0 space-y-10'>

              {/* Search */}
              <div className='relative'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search by occasion…'
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className='w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-[14px] shadow-sm focus:outline-none focus:border-violet-400 focus:ring-3 focus:ring-violet-100'
                />
              </div>

              {/* Category pills */}
              <div>
                <p className='text-[11px] font-bold tracking-[0.18em] text-gray-400 uppercase mb-3'>Gifting Events</p>
                <div className='flex flex-wrap gap-2'>
                  {EVENT_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type='button'
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[13px] font-semibold transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/25'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600'
                      }`}
                    >
                      <span className='text-base'>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Occasions grid */}
              {filteredEvents.length > 0 && (
                <div>
                  <div className='flex items-center justify-between mb-5'>
                    <div className='flex items-center gap-2'>
                      <Star className='w-4 h-4 text-violet-500 fill-violet-500' />
                      <h2 className='text-[20px] font-black text-gray-900'>Choose an Occasion</h2>
                    </div>
                    <span className='text-[12px] text-gray-400'>{filteredEvents.length} occasions</span>
                  </div>
                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3'>
                    {filteredEvents.map(event => (
                      <button
                        key={event.id}
                        type='button'
                        onClick={() => setShowPurchase(true)}
                        className='group relative flex flex-col items-center rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-200'
                      >
                        <div className='relative w-full aspect-square bg-gradient-to-br from-violet-50 to-fuchsia-50'>
                          {event.image_url ? (
                            <Image
                              src={event.image_url}
                              alt={event.title}
                              fill
                              className='object-contain p-4 group-hover:scale-110 transition-transform duration-300'
                              sizes='180px'
                            />
                          ) : (
                            <div className='w-full h-full flex items-center justify-center'>
                              <span className='text-5xl group-hover:scale-110 transition-transform duration-300'>🎁</span>
                            </div>
                          )}
                          {/* Hover overlay */}
                          <div className='absolute inset-0 bg-violet-600/0 group-hover:bg-violet-600/8 transition-colors duration-200 flex items-center justify-center'>
                            <span className='opacity-0 group-hover:opacity-100 transition-opacity bg-violet-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full'>
                              Select
                            </span>
                          </div>
                        </div>
                        <div className='w-full px-3 py-2.5 border-t border-gray-50'>
                          <p className='text-[12px] font-semibold text-gray-800 text-center leading-tight'>{event.title}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Brands grid */}
              {brands.length > 0 && (
                <div>
                  <div className='flex items-center justify-between mb-5'>
                    <h2 className='text-[20px] font-black text-gray-900'>Gift at These Brands</h2>
                    <button
                      type='button'
                      onClick={() => setShowPurchase(true)}
                      className='flex items-center gap-1 text-[13px] text-violet-600 font-semibold hover:text-violet-700 transition-colors'
                    >
                      View all <ChevronRight className='w-3.5 h-3.5' />
                    </button>
                  </div>
                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
                    {brands.slice(0, 8).map(b => (
                      <button
                        key={b.id}
                        type='button'
                        onClick={() => setShowPurchase(true)}
                        className='group relative rounded-2xl overflow-hidden border border-gray-100 bg-white hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-200 text-left'
                      >
                        <div className='relative aspect-3/2 bg-gray-100 overflow-hidden'>
                          {b.gifting_card_image_url ?? b.image ? (
                            <Image
                              src={b.gifting_card_image_url ?? b.image ?? ''}
                              alt={b.name}
                              fill
                              className='object-cover group-hover:scale-105 transition-transform duration-300'
                              sizes='220px'
                            />
                          ) : (
                            <div className='w-full h-full bg-linear-to-br from-gray-700 to-gray-900 flex items-center justify-center'>
                              <span className='text-white font-bold text-[13px] px-3 text-center'>{b.name}</span>
                            </div>
                          )}
                          {/* Gradient overlay */}
                          <div className='absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent' />
                          {b.discount_percentage && b.discount_percentage > 0 && (
                            <div className='absolute top-2.5 left-2.5 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full'>
                              {b.discount_percentage}% OFF
                            </div>
                          )}
                          <div className='absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                            <ArrowRight className='w-3 h-3 text-violet-600' />
                          </div>
                        </div>
                        <div className='p-3'>
                          <p className='text-[13px] font-bold text-gray-900 truncate'>{b.name}</p>
                          <p className='text-[11px] text-gray-400 capitalize mt-0.5 flex items-center gap-1'>
                            <span className='w-1.5 h-1.5 rounded-full bg-gray-300 inline-block' />
                            {b.type}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right sticky sidebar ── */}
            <div className='w-full lg:w-[320px] shrink-0'>
              <div className='lg:sticky lg:top-6 space-y-4'>

                {/* Buy CTA card */}
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
                      onClick={() => setShowPurchase(true)}
                      className='w-full py-3 rounded-2xl bg-white text-violet-700 font-black text-[14px] hover:bg-violet-50 transition-colors flex items-center justify-center gap-2'
                    >
                      Get Started <ArrowRight className='w-4 h-4' />
                    </button>
                  </div>
                </div>

                {/* Redeem card */}
                <div id='redeem-section' className='rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'>
                  <div className='flex items-center gap-2.5 mb-4'>
                    <div className='w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center'>
                      <Ticket className='w-4 h-4 text-amber-600' />
                    </div>
                    <h3 className='text-[15px] font-bold text-gray-900'>Redeem a Gift Code</h3>
                  </div>

                  {redeemSuccess ? (
                    <div className='text-center py-3 px-2'>
                      <div className='w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3'>
                        <CheckCheck className='w-6 h-6 text-green-600' />
                      </div>
                      <p className='text-[15px] font-bold text-gray-900'>Code Redeemed!</p>
                      <p className='text-[13px] text-gray-500 mt-1'>
                        <span className='font-semibold text-green-600'>₨{redeemSuccess.amount}</span> added to your balance.
                      </p>
                      <p className='text-[12px] text-gray-400 mt-0.5'>New balance: ₨{redeemSuccess.new_balance}</p>
                      <button
                        type='button'
                        onClick={() => setRedeemSuccess(null)}
                        className='mt-3 text-[12px] text-violet-600 font-semibold hover:underline'
                      >
                        Redeem another code
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed mb-2 transition-colors ${
                        redeemError ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus-within:border-violet-400 focus-within:bg-white'
                      }`}>
                        <input
                          type='text'
                          placeholder='GIFT-XXXX'
                          value={redeemCode}
                          onChange={e => { setRedeemCode(e.target.value.toUpperCase()); setRedeemError(null) }}
                          onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                          className='flex-1 bg-transparent text-[14px] font-mono tracking-widest focus:outline-none uppercase placeholder:text-gray-300'
                        />
                      </div>
                      {redeemError && (
                        <p className='text-[11px] text-red-500 mb-2 px-1'>{redeemError}</p>
                      )}
                      <button
                        type='button'
                        onClick={handleRedeem}
                        disabled={redeemLoading || !redeemCode.trim()}
                        className='w-full py-2.5 rounded-xl bg-gray-900 text-white font-bold text-[13px] disabled:opacity-40 hover:bg-gray-800 transition-colors'
                      >
                        {redeemLoading ? 'Redeeming…' : 'Redeem Code'}
                      </button>
                    </>
                  )}
                </div>

                {/* History card */}
                <div className='rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'>
                  <h3 className='text-[15px] font-bold text-gray-900 mb-3'>History</h3>

                  {/* Tab underline */}
                  <div className='flex gap-1 mb-4'>
                    {([['codes', 'My Codes'], ['activity', 'Wallet Activity']] as [HistoryTab, string][]).map(([id, label]) => (
                      <button
                        key={id}
                        type='button'
                        onClick={() => setHistoryTab(id)}
                        className={`flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all ${
                          historyTab === id
                            ? 'bg-violet-50 text-violet-700'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Purchased Codes */}
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
                          onClick={() => setShowPurchase(true)}
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

                  {/* Wallet Activity */}
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

              </div>
            </div>

          </div>
        </div>
      </div>

      {showPurchase && (
        <PurchaseModal
          events={events}
          brands={brands}
          discounts={discounts}
          onClose={() => setShowPurchase(false)}
        />
      )}
    </>
  )
}
