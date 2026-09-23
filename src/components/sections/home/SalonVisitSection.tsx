'use client'

import { useMemo } from 'react'
import { useLocation } from '@/lib/context/LocationContext'
import { useUserPlan } from '@/lib/context/PlanContext'
import { formatDistanceKm, haversineKm } from '@/lib/utils'
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
 * active stores when none match), then cap. Location scoping is a same-city
 * bias here since SSR has no user GPS.
 */
export function SalonVisitSection({ stores }: { stores: StoreRow[] }) {
  const { location } = useLocation()
  const plan = useUserPlan()
  const userCity = location.city.trim().toLowerCase()
  const { lat: userLat, lng: userLng } = location

  const list = useMemo(() => {
    const salon = stores.filter(isSalonStore)
    const pool = salon.length ? salon : stores

    return [...pool]
      .sort((a, b) => {
        const ac = (a.city ?? '').trim().toLowerCase() === userCity ? 0 : 1
        const bc = (b.city ?? '').trim().toLowerCase() === userCity ? 0 : 1
        return ac - bc
      })
      .slice(0, MAX_CARDS)
  }, [stores, userCity])

  if (!list.length) return null

  return (
    <HScroll
      title="Plan your salon visit"
      className="relative left-1/2 w-screen -translate-x-1/2 bg-[#FFF7F2]"
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
            href={`/stores/${s.slug ?? s.id}`}
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
