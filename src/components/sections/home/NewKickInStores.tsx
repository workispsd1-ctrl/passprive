import { HScroll } from './HScroll'
import { MerchantCard } from './MerchantCard'
import type { NewKickInStore } from '@/lib/types/stores'

export function NewKickInStores({ stores }: { stores: NewKickInStore[] }) {
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
            // The get_new_kick_in_stores RPC doesn't return merchant_type /
            // pay_bill_enabled, so cashback eligibility can't be evaluated
            // here — cashbackArt omitted hides the badge.
          />
        )
      })}
    </HScroll>
  )
}
