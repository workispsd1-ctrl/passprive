'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLocation } from '@/lib/context/LocationContext'
import { formatDistanceKm, haversineKm, scopeByLocation } from '@/lib/utils'
import { HScroll } from '@/components/sections/home/HScroll'
import type { StoreRow } from '@/lib/types/stores'

const MAX_CARDS = 15
// app parity: SpaNearYou.jsx's `matchesUserLocation(s, locationMeta, userCoords, 50)`
const RADIUS_KM = 50

// App parity: components/WellnessHome/SpaNearYou.jsx SPA_KEYWORDS (data logic
// only — the app itself renders rectangular cards here, but the web design
// uses the circular "Foodie front row" style instead).
const SPA_KEYWORDS = ['spa', 'massage', 'relaxation', 'hammam', 'facial', 'therapy', 'ayurvedic']

function isSpaStore(s: StoreRow): boolean {
  const text = [s.category, s.subcategory, s.description, s.name]
    .map((v) => String(v ?? '').toLowerCase())
    .join(' ')
  return SPA_KEYWORDS.some((kw) => text.includes(kw))
}

const RING =
  'linear-gradient(253.56deg, rgba(255,72,0,0.29) 9.31%, rgba(0,68,255,0.29) 99.66%)'

/** "Spa near you" — app parity: components/WellnessHome/SpaNearYou.jsx (data);
 * circular avatar design matching the Figma spec. */
export function SpaNearYouSection({ stores }: { stores: StoreRow[] }) {
  const { location } = useLocation()
  const userCoords = useMemo(
    () => location.lat != null && location.lng != null
      ? { lat: location.lat, lng: location.lng }
      : null,
    [location.lat, location.lng],
  )

  const list = useMemo(() => {
    const spas = stores.filter(isSpaStore)
    const pool = spas.length ? spas : stores
    const scoped = scopeByLocation(pool, userCoords, location.city, RADIUS_KM)
    return scoped
      .map((s) => ({
        s,
        dist: userCoords && s.lat != null && s.lng != null
          ? haversineKm(userCoords.lat, userCoords.lng, s.lat, s.lng)
          : null,
      }))
      .sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity))
      .slice(0, MAX_CARDS)
  }, [stores, userCoords, location.city])

  if (!list.length) return null

  return (
    <HScroll title="Spa near you">
      {list.map(({ s, dist }) => (
        <Link
          key={s.id}
          href={`/wellness/${s.slug ?? s.id}`}
          className="flex w-40 shrink-0 flex-col items-center text-center 2xl:w-52"
        >
          <div className="relative aspect-square w-full">
            <div
              className="absolute inset-0 translate-y-1.5 rounded-full 2xl:translate-y-2.25"
              style={{ background: RING }}
            />
            <div className="absolute inset-0 overflow-hidden rounded-full bg-gray-100">
              {(s.cover_image ?? s.logo_url) && (
                <Image
                  src={(s.cover_image ?? s.logo_url) as string}
                  alt={s.name}
                  fill
                  className="object-cover"
                  sizes="208px"
                />
              )}
            </div>
          </div>
          <p className="mt-4 w-full truncate text-sm font-bold leading-none text-[#0D141C] 2xl:mt-5">
            {s.name}
          </p>
          <p className="mt-1.5 w-full truncate text-xs font-medium leading-none text-[#717171]">
            {[formatDistanceKm(dist), s.location_name ?? s.city].filter(Boolean).join(' • ')}
          </p>
        </Link>
      ))}
    </HScroll>
  )
}
