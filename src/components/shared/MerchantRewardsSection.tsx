import type { MerchantCapabilityFields } from '@/lib/cashback'
import { cn } from '@/lib/utils'
import { DetailSection } from './detail/DetailSection'
import { DealRevealSection } from './deals/DealRevealSection'
import { ReceiptCashbackBanner } from './receipts/ReceiptCashbackBanner'

/**
 * Deal Reveal + receipt-upload cashback on a merchant detail page — app
 * parity: RestaurantDetails / StoreDetails / ServiceStoreDetails, which stack
 * DealRevealSection over ReceiptCashbackBanner. Both load on the client, so
 * the whole section (heading included) hides itself while it has nothing.
 */
export function MerchantRewardsSection({
  merchant,
  kind,
  name,
  className,
}: {
  merchant: MerchantCapabilityFields & { id: string }
  kind: 'restaurant' | 'store'
  name: string
  className?: string
}) {
  return (
    <DetailSection
      id='deals'
      title='Deals & cashback'
      subtitle='Member-only savings at this place'
      // phones follow the app: the deals sit straight under the title card, no heading
      className={cn('has-[[data-rewards]:empty]:hidden max-md:mt-5 max-md:border-t-0 max-md:pt-0', className)}
      headerClassName='max-md:hidden'
    >
      {/* Phones follow the app's stack — unlocks card, ticket rail, receipt card.
          Desktop puts the unlocks card and the receipt card side by side (each
          keeps its phone-card proportions) with the rail on its own row below. */}
      <div data-rewards className='grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5'>
        <DealRevealSection
          restaurantId={kind === 'restaurant' ? merchant.id : undefined}
          storeId={kind === 'store' ? merchant.id : undefined}
          merchantName={name}
        />
        <ReceiptCashbackBanner merchant={merchant} kind={kind} className='self-center md:order-2' />
      </div>
    </DetailSection>
  )
}
