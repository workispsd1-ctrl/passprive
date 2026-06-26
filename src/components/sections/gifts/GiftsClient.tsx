'use client'

import { useState } from 'react'
import type { GiftEvent, GiftBrand, GiftDiscount, GiftSummary } from '@/lib/types/gifts'
import { PurchaseModal } from './PurchaseModal'
import { GiftsHero } from './GiftsHero'
import { GiftsHowItWorks } from './GiftsHowItWorks'
import { OccasionsBrowser } from './OccasionsBrowser'
import { BrandsGrid } from './BrandsGrid'
import { BuyGiftCardSidebar } from './BuyGiftCardSidebar'
import { RedeemCodeCard } from './RedeemCodeCard'
import { GiftHistoryCard } from './GiftHistoryCard'

interface Props {
  events: GiftEvent[]
  brands: GiftBrand[]
  discounts: GiftDiscount[]
  summary: GiftSummary | null
}

export function GiftsClient({ events, brands, discounts, summary }: Props) {
  const [showPurchase, setShowPurchase] = useState(false)
  const [balance, setBalance] = useState(summary?.balance ?? 0)

  return (
    <>
      <GiftsHero
        balance={balance}
        eventsCount={events.length}
        brandsCount={brands.length}
        onBuyClick={() => setShowPurchase(true)}
        onRedeemClick={() => document.getElementById('redeem-section')?.scrollIntoView({ behavior: 'smooth' })}
      />

      <GiftsHowItWorks />

      <div className='bg-gray-50 min-h-screen'>
        <div className='max-w-7xl mx-auto px-4 md:px-6 py-10 pb-20'>
          <div className='flex flex-col lg:flex-row gap-8'>

            <div className='flex-1 min-w-0 space-y-10'>
              <OccasionsBrowser events={events} onSelect={() => setShowPurchase(true)} />
              <BrandsGrid brands={brands} onSelect={() => setShowPurchase(true)} />
            </div>

            <div className='w-full lg:w-[320px] shrink-0'>
              <div className='lg:sticky lg:top-6 space-y-4'>
                <BuyGiftCardSidebar onBuyClick={() => setShowPurchase(true)} />
                <RedeemCodeCard onRedeemSuccess={setBalance} />
                <GiftHistoryCard summary={summary} onBuyClick={() => setShowPurchase(true)} />
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
