import type { MerchantCapabilityFields } from '@/lib/cashback'
import type { DiscountCaps } from '@/lib/services/membershipCaps'
import { cn } from '@/lib/utils'
import { DealRevealSection } from '@/components/shared/deals/DealRevealSection'
import { DealCashbackConnector } from '@/components/shared/deals/DealTicket'
import { ReceiptCashbackBanner } from '@/components/shared/receipts/ReceiptCashbackBanner'
import { SnapPager } from '@/components/shared/detail/SnapPager'
import { UpsellBannerPager } from '@/components/shared/detail/UpsellBannerPager'

/**
 * Deal Reveal tickets, "+ Additional", then the cashback row (receipt
 * cashback + the tier upsell banners, paged) — app parity: RestaurantDetails
 * DealRevealSection → DealCashbackConnector → CashbackRow. Figma "Restaurant
 * details": the stack under Book table / Pay bill in the sidebar; phones
 * show the same stack under the title card.
 *
 * Every piece loads on the client and hides itself while it has nothing, so
 * the connector only shows while both the tickets and a cashback card do.
 */
export function RestaurantRewards({
  merchant,
  name,
  offerPct,
  caps,
  className,
}: {
  merchant: MerchantCapabilityFields & { id: string }
  name: string
  offerPct: number
  caps: DiscountCaps
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col empty:hidden',
        // hide the whole block while neither side has anything
        'has-[[data-cashback]>.hidden]:[&:not(:has([data-deals]>*))]:hidden',
        // "+ Additional" only between two non-empty sides
        'has-[[data-deals]>*]:has-[[data-cashback]>:not(.hidden)]:[&_[data-connector]]:block',
        className,
      )}
    >
      <div data-deals className='empty:hidden'>
        <DealRevealSection restaurantId={merchant.id} merchantName={name} variant='ticket' />
      </div>
      <div data-connector className='my-1 hidden'>
        <DealCashbackConnector />
      </div>
      <div data-cashback>
        <SnapPager label='Cashback'>
          <ReceiptCashbackBanner merchant={merchant} kind='restaurant' />
          <UpsellBannerPager merchantType={merchant.merchant_type} merchantId={merchant.id} kind='restaurant' offerPct={offerPct} caps={caps} bare />
        </SnapPager>
      </div>
    </div>
  )
}
