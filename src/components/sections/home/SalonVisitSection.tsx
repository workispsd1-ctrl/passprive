'use client'

import { useMemo } from 'react'
import { useLocation } from '@/lib/context/LocationContext'
import { useUserPlan } from '@/lib/context/PlanContext'
import { formatDistanceKm, haversineKm, scopeByLocation } from '@/lib/utils'
import { getCashbackBadgeArt } from '@/lib/cashback'
import { HScroll } from './HScroll'
import { MerchantCard } from './MerchantCard'
import type { StoreRow } from '@/lib/types/stores'

const MAX_CARDS = 12

// App parity: components/Home/PlanYourSalonVisit.jsx → isSalonStore()
function isSalonStore(s: StoreRow): boolean {
  const text = [s.category, s.subcategory, s.description]
    .map((v) => String(v ?? '').toLowerCase())
    .join(' ')
  return (
    text.includes('salon') ||
    text.includes('beauty') ||
    text.includes('barber')
  )
}

/**
 * "Plan your salon visit" — mirrors the app's `loadSalonStores`: from the active
 * store list, keep the salon / beauty / barber stores (falling back to all
 * active stores when none match), scope to stores within `radiusKm` (falling
 * back to a same-city match, per `matchesUserLocation`), then cap.
 *
 * `radiusKm` defaults to Home/PlanYourSalonVisit.jsx's 15km; the wellness page
 * (reusing this component) passes 50 to match WellnessHome/PlanSalonVisit.jsx.
 * `plain` drops the peach full-bleed band (the wellness page shows it on white).
 */
export function SalonVisitSection({
  stores,
  radiusKm = 15,
  plain = false,
}: {
  stores: StoreRow[]
  radiusKm?: number
  plain?: boolean
}) {
  const { location } = useLocation()
  const plan = useUserPlan()
  const userCity = location.city.trim().toLowerCase()
  const { lat: userLat, lng: userLng } = location
  const userCoords = useMemo(
    () => (userLat != null && userLng != null ? { lat: userLat, lng: userLng } : null),
    [userLat, userLng],
  )

  const list = useMemo(() => {
    const salon = stores.filter(isSalonStore)
    const pool = salon.length ? salon : stores
    const scoped = scopeByLocation(pool, userCoords, location.city, radiusKm)

    return [...scoped]
      .sort((a, b) => {
        const ac = (a.city ?? '').trim().toLowerCase() === userCity ? 0 : 1
        const bc = (b.city ?? '').trim().toLowerCase() === userCity ? 0 : 1
        return ac - bc
      })
      .slice(0, MAX_CARDS)
  }, [stores, userCity, userCoords, location.city, radiusKm])

  if (!list.length) return null

  return (
    <HScroll
      title="Plan your salon visit"
      className={plain ? undefined : 'relative left-1/2 w-screen -translate-x-1/2 bg-[#FFF7F2]'}
    >
      {list.map((s) => {
        const dist =
          userLat != null && userLng != null && s.lat != null && s.lng != null
            ? haversineKm(userLat, userLng, s.lat, s.lng)
            : null
        const meta = [formatDistanceKm(dist), s.location_name ?? s.city]
          .filter(Boolean)
          .join(' • ')

        return (
          <MerchantCard
            key={s.id}
            href={`/wellness/${s.slug ?? s.id}`}
            saveId={s.id}
            saveType="STORE"
            image={s.cover_image ?? s.logo_url}
            name={s.name}
            meta={meta || undefined}
            tagline={s.description ?? undefined}
            offerLabel={s.store_offers?.[0]?.badge_text ?? undefined}
            cashbackArt={getCashbackBadgeArt(s, plan)}
          />
        )
      })}
    </HScroll>
  )
}
