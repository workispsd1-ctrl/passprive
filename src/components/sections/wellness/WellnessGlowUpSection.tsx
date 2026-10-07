'use client'

import { useMemo } from 'react'
import { useLocation } from '@/lib/context/LocationContext'
import { useUserPlan } from '@/lib/context/PlanContext'
import { formatDistanceKm, haversineKm, sortByMerchant } from '@/lib/utils'
import { getCashbackBadgeArt } from '@/lib/cashback'
import { HScroll } from '@/components/sections/home/HScroll'
import { MerchantCard, type MerchantCardTag } from '@/components/sections/home/MerchantCard'
import type { StoreRow } from '@/lib/types/stores'
import type { StorePromotionalCollection } from '@/lib/services/stores'

const MAX_CARDS = 12

/**
 * "Time for a Glow Up" — app parity: WellnessPromotionalCards.jsx (the
 * `glow-up` promotional_collections row). The app anchors a photo-banner
 * card here; the web design instead uses the same peach-band + rail
 * treatment as "Plan your salon visit" for this slot.
 */
export function WellnessGlowUpSection({
  collections,
  stores,
}: {
  collections: StorePromotionalCollection[]
  stores: StoreRow[]
}) {
  const { location } = useLocation()
  const plan = useUserPlan()
  const userCoords = useMemo(
    () => location.lat != null && location.lng != null
      ? { lat: location.lat, lng: location.lng }
      : null,
    [location.lat, location.lng],
  )

  const list = useMemo(() => sortByMerchant(stores).slice(0, MAX_CARDS), [stores])

  if (!collections.length || !list.length) return null
  const collection = collections[0]

  return (
    <HScroll
      title={collection.title}
      subtitle={collection.subtitle ?? undefined}
      className="relative left-1/2 w-screen -translate-x-1/2 bg-[#FFF7F2]"
    >
      {list.map((s) => {
        const dist =
          userCoords && s.lat != null && s.lng != null
            ? haversineKm(userCoords.lat, userCoords.lng, s.lat, s.lng)
            : null
        const meta = [formatDistanceKm(dist), s.location_name ?? s.city]
          .filter(Boolean)
          .join(' • ')

        const tags: MerchantCardTag[] = []
        if (s.store_offers?.length) tags.push({ label: 'Sale is live' })
        if (s.merchant_type === 'preferred') tags.push({ label: 'Exclusive', icon: 'exclusive' })

        return (
          <MerchantCard
            key={s.id}
            href={`/wellness/${s.slug ?? s.id}`}
            saveId={s.id}
            saveType="STORE"
            image={s.cover_image ?? s.logo_url}
            name={s.name}
            meta={meta || undefined}
            tagline={s.description ?? ([s.category, s.subcategory].filter(Boolean).join(', ') || undefined)}
            offerLabel={s.store_offers?.[0]?.badge_text ?? undefined}
            cashbackArt={getCashbackBadgeArt(s, plan)}
            tags={tags}
          />
        )
      })}
    </HScroll>
  )
}
