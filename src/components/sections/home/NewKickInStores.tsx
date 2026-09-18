import { HScroll } from './HScroll'
import { MerchantCard } from './MerchantCard'
import type { NewKickInStore } from '@/lib/types/stores'

// New Kicks uses its own frame/offer-strip palette (not the shared one).
const FRAME_COLORS = ['#676360', '#D74E06', '#1D1D19', '#A05C1F']

export function NewKickInStores({ stores }: { stores: NewKickInStore[] }) {
  if (!stores.length) return null

  return (
    <HScroll title="New Kicks in Store">
      {stores.map((store, i) => {
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
            // pay_bill_enabled, so cashback eligibility can't be evaluated here.
            cashback={false}
            frameColor={FRAME_COLORS[i % FRAME_COLORS.length]}
          />
        )
      })}
    </HScroll>
  )
}
