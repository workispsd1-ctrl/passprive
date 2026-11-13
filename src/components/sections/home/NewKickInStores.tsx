'use client'

import { HScroll } from './HScroll'
import { getCardChips } from '@/lib/cardChips'
import { MerchantCard } from './MerchantCard'
import type { NewKickInStore } from '@/lib/types/stores'
import { getCardBadge, type MerchantCapabilityFields } from '@/lib/cashback'
import { useUserPlan } from '@/lib/context/PlanContext'

export function NewKickInStores({
  stores,
  capabilities = {},
}: {
  stores: NewKickInStore[]
  /**
   * The get_new_kick_in_stores RPC doesn't return the merchant's capability
   * fields, so the page looks them up from the active-stores catalog by id —
   * app parity: every store card draws CashbackBadge.
   */
  capabilities?: Record<string, MerchantCapabilityFields>
}) {
  const plan = useUserPlan()
  if (!stores.length) return null

  return (
    <HScroll title="New Kicks in Store">
      {stores.map((store) => {
        const meta = [
          store.distance_km != null ? `${store.distance_km}km` : null,
          store.location_name ?? store.city,
        ]
          .filter(Boolean)
          .join(' • ')

        return (
          <MerchantCard
            key={store.store_id}
            href={`/stores/${store.store_id}`}
            saveId={store.store_id}
            saveType="STORE"
            image={store.cover_image_url}
            name={store.store_name}
            meta={meta}
            tagline={store.description ?? undefined}
            offerLabel={store.offers?.[0]?.badge_text ?? undefined}
            cardBadge={capabilities[store.store_id] ? getCardBadge(capabilities[store.store_id], plan) : null}
            chips={getCardChips({ store_type: 'PRODUCT', store_offers: store.offers })}
          />
        )
      })}
    </HScroll>
  )
}
