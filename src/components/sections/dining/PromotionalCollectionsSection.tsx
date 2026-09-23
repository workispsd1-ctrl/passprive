import { HScroll } from '@/components/sections/home/HScroll'
import { FeedRestaurantCard } from './FeedRestaurantCard'
import type { PromotionalCollection } from '@/lib/services/dining'

/**
 * CMS promo banner with its mood-matched restaurant strip — app parity:
 * components/Home/PromotionalCards.jsx. The banner is a tall poster image
 * (390:587 in the app) with the restaurant rail anchored over its lower part;
 * there is no separate section heading, the artwork carries the title.
 */
export function PromotionalCollectionsSection({
  collections,
}: {
  collections: PromotionalCollection[]
}) {
  return (
    <>
      {collections.map((c) => (
        <section key={c.id} className="mx-auto max-w-7xl px-4 py-4 md:px-8 2xl:max-w-394">
          <div className="relative flex min-h-[520px] flex-col justify-end overflow-hidden rounded-[20px] bg-linear-to-br from-[#FF6A19] to-[#FF9A5C] md:min-h-[600px]">
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
                <p className="text-xl font-bold">{c.title}</p>
                {c.subtitle && <p className="mt-1 text-sm">{c.subtitle}</p>}
              </div>
            )}
            {c.restaurants.length > 0 && (
              <div className="relative">
                <HScroll>
                  {c.restaurants.map((r) => (
                    <FeedRestaurantCard key={r.id} r={r} />
                  ))}
                </HScroll>
              </div>
            )}
          </div>
        </section>
      ))}
    </>
  )
}
