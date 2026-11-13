'use client'

import { cardOfferText } from '@/lib/deals'
import { useMemo } from 'react'
import { HScroll } from '@/components/sections/home/HScroll'
import { MerchantCard, type MerchantCardTag } from '@/components/sections/home/MerchantCard'
import { useLocation } from '@/lib/context/LocationContext'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCardBadge } from '@/lib/cashback'
import { haversineKm, sortByMerchant } from '@/lib/utils'
import type { StoreRow } from '@/lib/types/stores'
import type { StorePromotionalCollection } from '@/lib/services/stores'

const MAX_CARDS = 12

/**
 * "Shop the ___ Merch" — app parity: components/StoresHome/StorePromotionalCards.jsx.
 * Same banner + anchored rail layout as dining's PromotionalCollectionsSection,
 * but the app doesn't curate per-collection items — every active collection
 * just anchors the same distance-sorted store rail.
 */
export function StorePromotionalCardsSection({
  collections,
  stores,
}: {
  collections: StorePromotionalCollection[]
  stores: StoreRow[]
}) {
  const { location } = useLocation()
  const plan = useUserPlan()
  const userCoords = useMemo(
    () =>
      location.lat != null && location.lng != null
        ? { lat: location.lat, lng: location.lng }
        : null,
    [location.lat, location.lng],
  )

  const rail = useMemo(() => {
    const withDist = stores
      .filter((s) => s.lat != null && s.lng != null)
      .map((s) => ({
        s,
        dist: userCoords ? haversineKm(userCoords.lat, userCoords.lng, s.lat!, s.lng!) : null,
      }))
      .sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity))

    return sortByMerchant(withDist.map((x) => x.s)).slice(0, MAX_CARDS)
  }, [stores, userCoords])

  if (!collections.length || !rail.length) return null

  return (
    <>
      {collections.map((c) => (
        <section key={c.id} className="mx-auto max-w-7xl px-4 py-4 md:px-8">
          {/* phones need the extra height so the banner art shows above the card rail */}
          <div className="relative flex min-h-[680px] flex-col justify-end overflow-hidden rounded-[20px] bg-linear-to-br from-[#1E2A5A] to-[#0D1533] md:min-h-[600px]">
            {c.hasBanner ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/promo-banner/${c.id}`}
                alt={c.title}
                className="absolute inset-0 h-full w-full object-cover object-top"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-x-0 top-0 p-6 text-white">
                <p className="line-clamp-2 text-xl font-bold">{c.title}</p>
                {c.subtitle && <p className="mt-1 line-clamp-2 text-sm">{c.subtitle}</p>}
              </div>
            )}
            <div className="relative">
              <HScroll>
                {rail.map((store) => {
                  const dist =
                    userCoords && store.lat != null && store.lng != null
                      ? haversineKm(userCoords.lat, userCoords.lng, store.lat, store.lng)
                      : null
                  const meta = [
                    dist != null ? (dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`) : null,
                    store.location_name ?? store.city,
                  ]
                    .filter(Boolean)
                    .join(' • ')

                  const offerLabel = cardOfferText(store.store_offers, true)

                  const tags: MerchantCardTag[] = []
                  if (store.store_offers?.length) tags.push({ label: 'Sale is live' })
                  if (store.merchant_type === 'preferred') {
                    tags.push({ label: 'Exclusive', icon: 'exclusive' })
                  }

                  return (
                    <MerchantCard
                      key={store.id}
                      href={`/stores/${store.slug ?? store.id}`}
                      saveId={store.id}
                      saveType="STORE"
                      image={store.cover_image}
                      name={store.name}
                      meta={meta}
                      tagline={[store.category, store.subcategory].filter(Boolean).join(', ') || undefined}
                      offerLabel={offerLabel}
                      cardBadge={getCardBadge(store, plan)}
                      tags={tags}
                    />
                  )
                })}
              </HScroll>
            </div>
          </div>
        </section>
      ))}
    </>
  )
}
