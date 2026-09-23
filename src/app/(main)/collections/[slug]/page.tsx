import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { getEditorialCollectionBySlug } from '@/lib/services/stores'
import { getCashbackBadgeArt } from '@/lib/cashback'
import { getCurrentUser } from '@/lib/services/user'
import { getUserPlan } from '@/lib/services/subscription'
import { FeedRestaurantCard } from '@/components/sections/dining/FeedRestaurantCard'
import { MerchantCard } from '@/components/sections/home/MerchantCard'

const fetchCollection = cache((slug: string) => getEditorialCollectionBySlug(slug))

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await fetchCollection(slug)
  if (!data) return {}
  return {
    title: data.collection.title,
    description: data.collection.subtitle ?? data.collection.description ?? undefined,
  }
}

/**
 * Editorial collection ("Hot on Passprivé") detail — app parity:
 * OfferRestaurantsScreen with `filterType: 'editorial_collection'`. Restaurants
 * and stores appear in the collection's curated rank order.
 */
export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [data, user] = await Promise.all([fetchCollection(slug), getCurrentUser()])
  if (!data) notFound()
  const plan = await getUserPlan(user?.id)
  const { collection, restaurants, stores } = data
  const empty = restaurants.length === 0 && stores.length === 0

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-8 2xl:max-w-394">
      {collection.cover_image_url && (
        <div className="relative mb-6 aspect-21/9 w-full overflow-hidden rounded-[20px] bg-gray-100">
          <Image
            src={collection.cover_image_url}
            alt={collection.title}
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1536px) 1576px, 100vw"
          />
        </div>
      )}
      <h1 className="font-(family-name:--font-dm-sans) text-2xl font-bold text-[#0D141C]">
        {collection.title}
      </h1>
      {collection.subtitle && (
        <p className="mt-1 text-sm font-medium text-[#383838]">{collection.subtitle}</p>
      )}
      {collection.description && (
        <p className="mt-2 max-w-3xl text-sm text-[#878787]">{collection.description}</p>
      )}

      {empty ? (
        <p className="py-16 text-center text-sm text-gray-500">
          Nothing in this collection yet.
        </p>
      ) : (
        <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
          {restaurants.map((r) => (
            <FeedRestaurantCard key={r.id} r={r} />
          ))}
          {stores.map((s) => (
            <MerchantCard
              key={s.id}
              href={`/stores/${s.slug ?? s.id}`}
              saveId={s.id}
              saveType="STORE"
              image={s.cover_image ?? s.logo_url}
              name={s.name}
              meta={[s.location_name, s.city].filter(Boolean).join(' • ') || undefined}
              tagline={s.description ?? undefined}
              offerLabel={s.store_offers?.[0]?.badge_text ?? undefined}
              cashbackArt={getCashbackBadgeArt(s, plan)}
            />
          ))}
        </div>
      )}
    </main>
  )
}
