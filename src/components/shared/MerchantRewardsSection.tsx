'use client'

import { useState } from 'react'
import type { MerchantCapabilityFields } from '@/lib/cashback'
import { cn } from '@/lib/utils'
import { DetailSection } from './detail/DetailSection'
import { DealRevealSection } from './deals/DealRevealSection'
import { ReceiptCashbackBanner } from './receipts/ReceiptCashbackBanner'
import { TierPills, type PreviewTier } from './TierPills'

/**
 * Deal Reveal + receipt-upload cashback on a merchant detail page — app
 * parity: StoreDetails / ServiceStoreDetails, which put OffersSectionTitle
 * (title + TierPills) over DealRevealSection and ReceiptCashbackBanner, both
 * following the previewed plan. Both load on the client, so the whole section
 * (heading included) hides itself while it has nothing.
 */
export function MerchantRewardsSection({
  merchant,
  kind,
  name,
  offersTitle = 'Offers for you',
  className,
}: {
  merchant: MerchantCapabilityFields & { id: string }
  kind: 'restaurant' | 'store'
  name: string
  /** app parity: OffersSectionTitle — "Offers for you" on stores, "Offers for today" on salons */
  offersTitle?: string
  className?: string
}) {
  // app parity: StoreDetails / ServiceStoreDetails previewTier — the plan the offers are shown for
  const [previewTier, setPreviewTier] = useState<PreviewTier | null>(null)
  return (
    <DetailSection
      id='deals'
      title='Deals & cashback'
      subtitle='Member-only savings at this place'
      // phones follow the app: the deals sit straight under the title card, no heading
      className={cn('has-[[data-rewards]:empty]:hidden max-md:mt-5 max-md:border-t-0 max-md:pt-0', className)}
      headerClassName='max-md:hidden'
    >
      <p className='mb-3 font-(family-name:--font-dm-sans) text-[18px] font-bold text-[#1C1C1E] md:hidden'>{offersTitle}</p>
      <TierPills value={previewTier} onChange={setPreviewTier} className='mb-4 md:max-w-80' />
      {/* Phones follow the app's stack — unlocks card, ticket rail, receipt card.
          Desktop puts the unlocks card and the receipt card side by side (each
          keeps its phone-card proportions) with the rail on its own row below. */}
      <div data-rewards className='grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5'>
        <DealRevealSection
          restaurantId={kind === 'restaurant' ? merchant.id : undefined}
          storeId={kind === 'store' ? merchant.id : undefined}
          merchantName={name}
          previewTier={previewTier}
        />
        <ReceiptCashbackBanner merchant={merchant} kind={kind} previewTier={previewTier} className='self-center md:order-2' />
      </div>
    </DetailSection>
  )
}
