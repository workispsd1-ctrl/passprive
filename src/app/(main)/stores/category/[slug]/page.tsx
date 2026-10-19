import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { AllStoresSection } from '@/components/sections/stores/AllStoresSection'
import { PageBackTitle } from '@/components/shared/PolicyPage'
import { getHeaderLocation, getUserCoords } from '@/lib/location'
import { MAX_NEARBY_KM, scopeStoresToRadius } from '@/lib/nearby'
import { getActiveStores, getStoreMoodCategories } from '@/lib/services/stores'
import { cn } from '@/lib/utils'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = (await getStoreMoodCategories()).find((c) => c.slug === slug)
  if (!category) return {}
  return {
    title: `${category.title} stores`,
    description: `${category.title} stores near you on PassPrivé.`,
  }
}

/**
 * Store category results — app parity: StoreHome's `handleSelectCategory`
 * opens StoreCategoryResults with the nearby stores matching the mood
 * category.
 */
export default async function StoreCategoryPage({ params }: Props) {
  const { slug } = await params
  const [coords, headerLocation] = await Promise.all([getUserCoords(), getHeaderLocation()])
  // the place named in the header — every distance here is measured from it
  const place = headerLocation?.city || 'you'
  const [stores, categories] = await Promise.all([
    getActiveStores().then((all) => scopeStoresToRadius(all, coords, MAX_NEARBY_KM)),
    getStoreMoodCategories(),
  ])
  const category = categories.find((c) => c.slug === slug)
  if (!category) notFound()

  return (
    <main className="min-h-screen pb-20 md:pb-0">
      <div className="px-4 pt-6 md:px-8">
        <PageBackTitle title={category.title} />
        <p className="mt-2 text-[13px] text-[#605D64] md:text-[14px]">
          {coords
            ? `${category.title} stores within ${MAX_NEARBY_KM} km of ${place}`
            : `${category.title} stores — set your location to see the ones within ${MAX_NEARBY_KM} km`}
        </p>

        {/* switch category without going back — web addition */}
        <nav aria-label="Store categories" className="scrollbar-hide -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {categories.map((c) => {
            const active = c.slug === slug
            const img = c.light_theme_image_url ?? c.image_url
            return (
              <Link
                key={c.slug}
                href={`/stores/category/${encodeURIComponent(c.slug)}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-full border py-1 pr-4 pl-1 text-[13px] font-semibold transition-colors',
                  active
                    ? 'border-brand bg-brand-tint text-brand'
                    : 'border-gray-200 bg-white text-[#2C2D32] hover:border-brand/40',
                )}
              >
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100">
                  {img && <Image src={img} alt="" fill className="object-cover" sizes="32px" />}
                </span>
                {c.title}
              </Link>
            )
          })}
        </nav>
      </div>

      <AllStoresSection
        key={slug}
        stores={stores}
        moodCategories={categories}
        activeCategorySlug={slug}
        title={slug === 'all-stores' ? 'All stores' : `${category.title} stores`}
        layout="grid"
      />
    </main>
  )
}
