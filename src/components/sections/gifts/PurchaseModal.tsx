'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronRight, Loader2 } from 'lucide-react'
import type { GiftEvent, GiftBrand, GiftDiscount } from '@/lib/types/gifts'
import { GiftEventCard } from './GiftEventCard'
import { GiftBrandCard } from './GiftBrandCard'

const ONLINE_GIFT_FEE = 50
const PRESET_AMOUNTS = [500, 1000, 2000, 5000]

interface Props {
  events: GiftEvent[]
  brands: GiftBrand[]
  discounts: GiftDiscount[]
  onClose: () => void
}

type Step = 'occasion' | 'brand' | 'amount' | 'personalise' | 'confirm'

export function PurchaseModal({ events, brands, discounts, onClose }: Props) {
  const [step, setStep] = useState<Step>('occasion')
  const [selectedEvent, setSelectedEvent] = useState<GiftEvent | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<GiftBrand | null>(null)
  const [amount, setAmount] = useState<number>(1000)
  const [customAmount, setCustomAmount] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [giftTitle, setGiftTitle] = useState('')
  const [giftMessage, setGiftMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveAmount = customAmount ? Number(customAmount) : amount
  const discount = selectedBrand?.discount_percentage
    ?? discounts.find(d => !d.min_purchase_amount || effectiveAmount >= (d.min_purchase_amount ?? 0))?.discount_percentage
    ?? 0
  const discountAmount = Math.round(effectiveAmount * (discount / 100))
  const payable = effectiveAmount - discountAmount + ONLINE_GIFT_FEE

  const STEPS: Step[] = ['occasion', 'brand', 'amount', 'personalise', 'confirm']
  const stepIndex = STEPS.indexOf(step)

  function next() {
    setStep(STEPS[stepIndex + 1])
  }

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/gift/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: payable,
          original_amount: effectiveAmount,
          discount_amount: discountAmount,
          store_id: selectedBrand?.type === 'store' ? selectedBrand.id : undefined,
          restaurant_id: selectedBrand?.type === 'restaurant' ? selectedBrand.id : undefined,
          recipient_name: recipientName,
          gift_title: giftTitle,
          gift_message: giftMessage,
          event_image_url: selectedEvent?.image_url ?? undefined,
        }),
      })
      const data = await res.json() as { redirect_url?: string; error?: string }
      if (!res.ok || !data.redirect_url) {
        setError(data.error ?? 'Payment initiation failed.')
        return
      }
      // Persist personalisation for the return page to show success modal
      sessionStorage.setItem('gift_pending_recipient', recipientName)
      sessionStorage.setItem('gift_pending_title', giftTitle || selectedEvent?.title || '')
      sessionStorage.setItem('gift_pending_message', giftMessage)
      sessionStorage.setItem('gift_pending_image', selectedEvent?.image_url ?? '')
      window.location.href = data.redirect_url
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4'>
      <div className='w-full max-w-lg bg-white rounded-3xl shadow-2xl max-h-[90vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0'>
          <div className='flex items-center gap-2'>
            {stepIndex > 0 && (
              <button type='button' onClick={() => setStep(STEPS[stepIndex - 1])} className='mr-1 text-gray-400 hover:text-gray-600'>
                ←
              </button>
            )}
            <h2 className='text-[17px] font-bold text-gray-900'>
              {step === 'occasion' && 'Pick an Occasion'}
              {step === 'brand' && 'Choose a Brand'}
              {step === 'amount' && 'Select Amount'}
              {step === 'personalise' && 'Personalise'}
              {step === 'confirm' && 'Confirm Order'}
            </h2>
          </div>
          <button type='button' onClick={onClose} className='p-1.5 rounded-full hover:bg-gray-100'>
            <X className='w-4 h-4 text-gray-500' />
          </button>
        </div>

        {/* Step indicator */}
        <div className='flex gap-1 px-6 pt-3 shrink-0'>
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${i <= stepIndex ? 'bg-violet-500' : 'bg-gray-100'}`} />
          ))}
        </div>

        {/* Body */}
        <div className='overflow-y-auto flex-1 px-6 py-5'>

          {step === 'occasion' && (
            <div className='grid grid-cols-3 gap-3'>
              {events.map(e => (
                <GiftEventCard
                  key={e.id}
                  event={e}
                  selected={selectedEvent?.id === e.id}
                  onSelect={ev => { setSelectedEvent(ev); next() }}
                />
              ))}
            </div>
          )}

          {step === 'brand' && (
            <div className='grid grid-cols-2 gap-3'>
              {brands.map(b => (
                <GiftBrandCard
                  key={b.id}
                  brand={b}
                  selected={selectedBrand?.id === b.id}
                  onSelect={br => { setSelectedBrand(br); next() }}
                />
              ))}
            </div>
          )}

          {step === 'amount' && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-3'>
                {PRESET_AMOUNTS.map(a => (
                  <button
                    key={a}
                    type='button'
                    onClick={() => { setAmount(a); setCustomAmount('') }}
                    className={`py-4 rounded-2xl border-2 font-bold text-[15px] transition-all ${
                      amount === a && !customAmount ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-100 text-gray-700 hover:border-violet-200'
                    }`}
                  >
                    ₨{a.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className='relative'>
                <span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold'>₨</span>
                <input
                  type='number'
                  placeholder='Custom amount'
                  value={customAmount}
                  onChange={e => { setCustomAmount(e.target.value); setAmount(0) }}
                  className='w-full pl-8 pr-4 py-3 rounded-2xl border border-gray-200 text-[14px] focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
                  min={100}
                />
              </div>
            </div>
          )}

          {step === 'personalise' && (
            <div className='space-y-4'>
              <input
                type='text'
                placeholder='Recipient name'
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                className='w-full px-4 py-3 rounded-2xl border border-gray-200 text-[14px] focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
              />
              <input
                type='text'
                placeholder='Gift title (e.g. Happy Birthday!)'
                value={giftTitle}
                onChange={e => setGiftTitle(e.target.value)}
                className='w-full px-4 py-3 rounded-2xl border border-gray-200 text-[14px] focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
              />
              <textarea
                placeholder='Personal message (optional)'
                value={giftMessage}
                onChange={e => setGiftMessage(e.target.value)}
                rows={3}
                className='w-full px-4 py-3 rounded-2xl border border-gray-200 text-[14px] focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none'
              />
            </div>
          )}

          {step === 'confirm' && (
            <div className='space-y-4'>
              {/* Card preview */}
              <div className='relative w-full aspect-[3/2] rounded-2xl overflow-hidden bg-gradient-to-br from-violet-800 to-violet-600'>
                {selectedEvent?.image_url && (
                  <Image src={selectedEvent.image_url} alt='' fill className='object-cover opacity-30' sizes='500px' />
                )}
                <div className='absolute inset-0 flex flex-col justify-between p-5'>
                  <div>
                    <p className='text-violet-200 text-[11px] font-semibold uppercase tracking-wider'>PassPrivé Gift</p>
                    <p className='text-white font-bold text-[18px] mt-1'>{giftTitle || selectedEvent?.title || 'Gift Card'}</p>
                    {recipientName && <p className='text-violet-200 text-[13px] mt-0.5'>For {recipientName}</p>}
                  </div>
                  <div>
                    {selectedBrand && <p className='text-violet-200 text-[12px]'>{selectedBrand.name}</p>}
                    <p className='text-white font-black text-[28px]'>₨{effectiveAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Price breakdown */}
              <div className='rounded-2xl border border-gray-100 divide-y divide-gray-50'>
                <div className='flex justify-between px-4 py-3 text-[13px]'>
                  <span className='text-gray-500'>Gift value</span>
                  <span className='font-semibold text-gray-900'>₨{effectiveAmount.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className='flex justify-between px-4 py-3 text-[13px]'>
                    <span className='text-green-600'>Discount ({discount}%)</span>
                    <span className='font-semibold text-green-600'>−₨{discountAmount}</span>
                  </div>
                )}
                <div className='flex justify-between px-4 py-3 text-[13px]'>
                  <span className='text-gray-500'>Online gifting fee</span>
                  <span className='font-semibold text-gray-900'>₨{ONLINE_GIFT_FEE}</span>
                </div>
                <div className='flex justify-between px-4 py-3 text-[14px]'>
                  <span className='font-bold text-gray-900'>Total payable</span>
                  <span className='font-black text-violet-700'>₨{payable.toLocaleString()}</span>
                </div>
              </div>

              {error && <p className='text-[12px] text-red-500 text-center'>{error}</p>}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {step !== 'occasion' && step !== 'brand' && (
          <div className='px-6 pb-6 pt-3 shrink-0 border-t border-gray-100'>
            {step === 'confirm' ? (
              <button
                type='button'
                onClick={handlePay}
                disabled={loading}
                className='w-full py-3.5 rounded-2xl bg-violet-600 text-white font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-60'
              >
                {loading ? <Loader2 className='w-4 h-4 animate-spin' /> : null}
                {loading ? 'Redirecting to payment…' : `Pay ₨${payable.toLocaleString()}`}
              </button>
            ) : (
              <button
                type='button'
                onClick={next}
                disabled={step === 'amount' && effectiveAmount < 100}
                className='w-full py-3.5 rounded-2xl bg-gray-900 text-white font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-40'
              >
                Continue <ChevronRight className='w-4 h-4' />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
