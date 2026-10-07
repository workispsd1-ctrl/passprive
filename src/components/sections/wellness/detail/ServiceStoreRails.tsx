'use client'

import { useMemo } from 'react'
import { useLocation } from '@/lib/context/LocationContext'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCashbackBadgeArt } from '@/lib/cashback'
import { formatDistanceKm, haversineKm } from '@/lib/utils'
import { HScroll } from '@/components/sections/home/HScroll'
import { MerchantCard } from '@/components/sections/home/MerchantCard'
import type { StoreRow } from '@/lib/types/stores'

const MAX_CARDS = 12

type WithDist = StoreRow & { dist: number | null }

function Rail({ title, stores }: { title: string; stores: WithDist[] }) {
  const plan = useUserPlan()
  if (!stores.length) return null

  return (
    <HScroll title={title}>
      {stores.map(s => {
        const offer = s.store_offers?.[0]
        return (
          <MerchantCard
            key={s.id}
            href={`/wellness/${s.slug ?? s.id}`}
            saveId={s.id}
            saveType='STORE'
            image={s.cover_image}
            name={s.name}
            meta={[s.dist != null ? formatDistanceKm(s.dist) : null, s.location_name ?? s.city].filter(Boolean).join(' • ') || undefined}
            tagline={[s.category, s.subcategory].filter(Boolean).join(', ') || undefined}
            offerLabel={offer?.discount_value ? `Flat ${offer.discount_value}% OFF` : offer?.badge_text ?? undefined}
            cashbackArt={getCashbackBadgeArt(s, plan)}
          />
        )
      })}
    </HScroll>
  )
}

/**
 * app parity: ServiceStoreDetails.jsx `exploreMoreSalons` (same category, then
 * same subcategory, then the rest — each by distance) and `nearbySalons`
 * (purely by distance), both excluding the current store.
 */
export function ServiceStoreRails({
  stores,
  currentId,
  category,
  subcategory,
}: {
  stores: StoreRow[]
  currentId: string
  category: string | null
  subcategory: string | null
}) {
  const { location } = useLocation()
  const { lat, lng } = location

  const { explore, nearby } = useMemo(() => {
    const cat = (category ?? '').trim().toLowerCase()
    const sub = (subcategory ?? '').trim().toLowerCase()
    const matches = (a: string, b: string) => !!a && !!b && (a === b || a.includes(b) || b.includes(a))
    const rank = (s: StoreRow) =>
      matches(cat, (s.category ?? '').trim().toLowerCase())
        ? 0
        : matches(sub, (s.subcategory ?? '').trim().toLowerCase())
          ? 1
          : 2

    const pool: WithDist[] = stores
      .filter(s => s.id !== currentId)
      .map(s => ({
        ...s,
        dist: lat != null && lng != null && s.lat != null && s.lng != null ? haversineKm(lat, lng, s.lat, s.lng) : null,
      }))
    const byDist = (a: WithDist, b: WithDist) => (a.dist ?? Infinity) - (b.dist ?? Infinity)

    return {
      explore: [...pool].sort((a, b) => rank(a) - rank(b) || byDist(a, b)).slice(0, MAX_CARDS),
      nearby: [...pool].sort(byDist).slice(0, MAX_CARDS),
    }
  }, [stores, currentId, category, subcategory, lat, lng])

  return (
    <div className='mt-4'>
      <Rail title='Explore more services' stores={explore} />
      <Rail title='Nearby services' stores={nearby} />
    </div>
  )
}
