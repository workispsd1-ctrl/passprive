'use client'

import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { useLocation } from '@/lib/context/LocationContext'
import { useUserPlan } from '@/lib/context/PlanContext'
import { formatDistanceKm, haversineKm } from '@/lib/utils'
import { getCardBadge } from '@/lib/cashback'
import { HScroll } from '@/components/sections/home/HScroll'
import { MerchantCard } from '@/components/sections/home/MerchantCard'
import type { StoreRow } from '@/lib/types/stores'

// the salons / spas this browser opened, newest first (a per-viewer convenience)
const KEY = 'pp_recent_wellness'
const MAX = 10
const EVENT = 'pp:recent-wellness'

function read(): string {
  try { return localStorage.getItem(KEY) ?? '[]' } catch { return '[]' }
}
function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

/** Put on a wellness detail page — remembers the visit for "Continue where you left off". */
export function RecordWellnessView({ id }: { id: string }) {
  useEffect(() => {
    try {
      const ids = (JSON.parse(read()) as string[]).filter(x => x !== id)
      localStorage.setItem(KEY, JSON.stringify([id, ...ids].slice(0, MAX)))
      window.dispatchEvent(new Event(EVENT))
    } catch { /* storage unavailable — nothing to remember */ }
  }, [id])
  return null
}

/**
 * "Continue where you left off" — Figma Wellness page_Web, the first rail:
 * the salons and spas this browser opened most recently. Hidden until there
 * is one.
 */
export function ContinueWhereLeftOff({ stores }: { stores: StoreRow[] }) {
  const raw = useSyncExternalStore(subscribe, read, () => '[]')
  const { location } = useLocation()
  const plan = useUserPlan()

  const list = useMemo(() => {
    let ids: string[] = []
    try { ids = JSON.parse(raw) as string[] } catch { /* ignore */ }
    const byId = new Map(stores.map(s => [s.id, s]))
    return ids.map(id => byId.get(id)).filter((s): s is StoreRow => !!s)
  }, [raw, stores])

  if (!list.length) return null

  return (
    <HScroll title='Continue where you left off'>
      {list.map(s => {
        const dist =
          location.lat != null && location.lng != null && s.lat != null && s.lng != null
            ? haversineKm(location.lat, location.lng, s.lat, s.lng)
            : null
        const meta = [formatDistanceKm(dist), s.location_name ?? s.city].filter(Boolean).join(' • ')
        return (
          <MerchantCard
            key={s.id}
            href={`/wellness/${s.slug ?? s.id}`}
            saveId={s.id}
            saveType='STORE'
            image={s.cover_image ?? s.logo_url}
            name={s.name}
            meta={meta || undefined}
            tagline={s.description ?? ([s.category, s.subcategory].filter(Boolean).join(', ') || undefined)}
            offerLabel={s.store_offers?.[0]?.badge_text ?? undefined}
            cardBadge={getCardBadge(s, plan)}
          />
        )
      })}
    </HScroll>
  )
}
