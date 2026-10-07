'use client'

import { useMemo } from 'react'
import { useLocation } from '@/lib/context/LocationContext'
import { useUserPlan } from '@/lib/context/PlanContext'
import { formatDistanceKm, haversineKm, scopeByLocation, sortByMerchant } from '@/lib/utils'
import { getCashbackBadgeArt } from '@/lib/cashback'
import { HScroll } from '@/components/sections/home/HScroll'
import { MerchantCard, type MerchantCardTag } from '@/components/sections/home/MerchantCard'
import type { StoreRow } from '@/lib/types/stores'

const MAX_CARDS = 15
// app parity: TrendingWellness.jsx's `matchesUserLocation(s, locationMeta, userCoords, 50)`
const RADIUS_KM = 50

/** "Trending now" — app parity: components/WellnessHome/TrendingWellness.jsx. */
export function TrendingWellnessSection({ stores }: { stores: StoreRow[] }) {
  const { location } = useLocation()
  const plan = useUserPlan()
  const userCoords = useMemo(
    () => location.lat != null && location.lng != null
      ? { lat: location.lat, lng: location.lng }
      : null,
    [location.lat, location.lng],
  )

  const list = useMemo(() => {
    const scoped = scopeByLocation(stores, userCoords, location.city, RADIUS_KM)
    return sortByMerchant(scoped).slice(0, MAX_CARDS)
  }, [stores, userCoords, location.city])

  if (!list.length) return null

  return (
    <HScroll title="Trending now">
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
