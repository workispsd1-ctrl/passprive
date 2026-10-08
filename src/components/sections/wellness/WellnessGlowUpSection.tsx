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

// app parity: WellnessPromotionalCards.jsx MAX_PER_CARD
const MAX_CARDS = 12

/**
 * "Time for a Glow Up" — app parity: components/WellnessHome/WellnessPromotionalCards.jsx.
 * Each active `glow-up` promotional_collections row renders as a banner card
 * (its `banner_image_url` as the background) with the nearest wellness
 * stores anchored along the bottom, like the app's PromoCard.
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
  const { lat, lng } = location

  // app parity: nearest first when we know where the user is; without a
  // location the app has no distances, so fall back to merchant ranking.
  const rail = useMemo(() => {
    if (lat == null || lng == null) {
      return sortByMerchant(stores).slice(0, MAX_CARDS).map(s => ({ s, dist: null as number | null }))
    }
    return stores
      .filter(s => s.lat != null && s.lng != null)
      .map(s => ({ s, dist: haversineKm(lat, lng, s.lat!, s.lng!) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, MAX_CARDS)
  }, [stores, lat, lng])

  if (!collections.length || !rail.length) return null

  return (
    <>
      {collections.map(c => (
        // Full-bleed: break out of the layout's max-w-7xl column.
        <section key={c.id} className='relative left-1/2 my-4 w-screen -translate-x-1/2'>
          <div className='relative overflow-hidden bg-[#FFF1E7]'>
            {c.hasBanner ? (
              // Banners are stored as inline data: URIs; the route decodes and caches them.
              // The art is a wide 7680×2896 band with its title top-left on flat
              // peach (#FFF1E7, the card fill). Desktop: cover from the top-left.
              // Mobile: scale it up so the title band spans the card width.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/promo-banner/${c.id}`}
                alt={c.title}
                className='absolute top-0 left-0 h-auto w-[280%] max-w-none md:inset-0 md:h-full md:w-full md:object-cover md:object-left-top'
                loading='lazy'
              />
            ) : (
              <div className='absolute inset-x-0 top-0 p-6 text-gray-900'>
                <p className='text-2xl font-bold'>{c.title}</p>
                {c.subtitle && <p className='mt-1 text-sm'>{c.subtitle}</p>}
              </div>
            )}

            {/* Start the rail just under the banner's title band. % padding tracks
                the banner's width-scaled title (~6.4% of width on desktop); the
                7rem floor covers narrow desktops where cover scales by height. */}
            <div className={c.hasBanner ? 'relative pt-[21%] pb-4 md:pt-[max(7rem,8%)]' : 'relative pt-24 pb-4'}>
              <HScroll>
                {rail.map(({ s, dist }) => {
                  const tags: MerchantCardTag[] = []
                  if (s.store_offers?.length) tags.push({ label: 'Sale is live' })
                  if (s.merchant_type === 'preferred') tags.push({ label: 'Exclusive', icon: 'exclusive' })

                  const offer = s.store_offers?.[0]
                  const offerLabel = offer?.discount_value ? `Flat ${offer.discount_value}% OFF` : offer?.badge_text ?? undefined

                  return (
                    <MerchantCard
                      key={s.id}
                      href={`/wellness/${s.slug ?? s.id}`}
                      saveId={s.id}
                      saveType='STORE'
                      image={s.cover_image ?? s.logo_url}
                      name={s.name}
                      meta={[dist != null ? formatDistanceKm(dist) : null, s.location_name ?? s.city].filter(Boolean).join(' • ') || undefined}
                      tagline={[s.category, s.subcategory].filter(Boolean).join(', ') || undefined}
                      offerLabel={offerLabel}
                      cashbackArt={getCashbackBadgeArt(s, plan)}
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
