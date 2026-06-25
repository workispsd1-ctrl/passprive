import { CreditCard } from 'lucide-react'
import type { DiningOffer } from '@/lib/types/dining'

interface Props {
  mainOffers: DiningOffer[]
  bankOffers: DiningOffer[]
}

export function RestaurantOffersSection({ mainOffers, bankOffers }: Props) {
  if (mainOffers.length === 0 && bankOffers.length === 0) return null

  return (
    <section className='mt-8 border-t border-gray-100 pt-6'>
      <h2 className='text-[22px] font-bold text-gray-900 mb-4'>Offers</h2>

      <div className='flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1'>
        {mainOffers.map(offer => (
          <div key={offer.id} className='shrink-0 w-80 relative'>
            <div className='flex h-[100px] rounded-2xl overflow-hidden'>
              <div className='w-[140px] shrink-0 bg-linear-to-br from-violet-600 via-purple-500 to-purple-400 flex flex-col justify-center px-4 py-3'>
                <p className='text-white font-black text-[18px] leading-tight'>{offer.title}</p>
                {offer.badge_text && (
                  <span className='mt-1.5 text-[10px] font-semibold text-white/80 bg-white/20 rounded px-1.5 py-0.5 inline-block w-fit'>
                    {offer.badge_text}
                  </span>
                )}
              </div>
              <div className='flex-1 bg-violet-50 flex flex-col justify-center px-4 py-3'>
                {offer.description && (
                  <p className='text-[13px] font-semibold text-gray-900 leading-snug'>{offer.description}</p>
                )}
                {offer.min_spend != null && (
                  <p className='text-[12px] text-gray-500 mt-0.5'>
                    Min spend ₨{offer.min_spend.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <div className='absolute top-0 left-[140px] -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border border-gray-200 z-10' />
            <div className='absolute bottom-0 left-[140px] -translate-x-1/2 translate-y-1/2 w-5 h-5 rounded-full bg-white border border-gray-200 z-10' />
          </div>
        ))}
      </div>

      {bankOffers.length > 0 && (
        <div className='mt-5'>
          <p className='flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 mb-3'>
            <span className='w-1.5 h-1.5 rounded-full bg-gray-400 inline-block' />
            Additional offers
          </p>
          <div className='flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1'>
            {bankOffers.map(offer => (
              <div
                key={offer.id}
                className='shrink-0 w-52 border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-start gap-2.5'
              >
                <div className='w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0'>
                  <CreditCard className='w-4 h-4 text-gray-400' />
                </div>
                <p className='text-[12px] text-gray-700 leading-snug font-medium line-clamp-3'>{offer.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
