import type { Metadata } from 'next'
import { HeroSection } from '@/components/sections'
import { MoodCategoriesSection } from '@/components/sections/dining/MoodCategoriesSection'
import { QuickFilterTiles } from '@/components/sections/dining/QuickFilterTiles'
import { DiningDiscoverSection } from '@/components/sections/dining/DiningDiscoverSection'
import { NowTrendingSection } from '@/components/sections/home/NowTrendingSection'
import { OffersYoullLoveSection } from '@/components/sections/dining/OffersYoullLoveSection'
import { DiningPopularChainsSection } from '@/components/sections/dining/DiningPopularChainsSection'
import { BankOffersSection } from '@/components/sections/dining/BankOffersSection'
import { HotOnPassprive } from '@/components/sections/home/HotOnPassprive'
import { PromotionalCollectionsSection } from '@/components/sections/dining/PromotionalCollectionsSection'
import { RestaurantResults } from '@/components/sections/dining/RestaurantResults'
import {
  getCuisineFacets,
  getMoodCategories,
  getNewRestaurants,
  getPromotionalCollections,
  getRestaurantFeed,
} from '@/lib/services/dining'
import { getUserCoords } from '@/lib/location'
import { getOffersForYou } from '@/lib/services/offersForYou'
import { FEED_PAGE_SIZE, countActive, parseFilters } from '@/lib/restaurantFilters'
import { getEditorialCollections } from '@/lib/services/stores'

export const metadata: Metadata = {
  title: 'Dining Deals & Restaurants',
  description:
    'Explore top restaurants with exclusive dining deals, table bookings, and member discounts. Discover the best places to eat near you with PassPrivé.',
  openGraph: {
    title: 'Dining Deals & Restaurants | PassPrivé',
    description:
      'Find exclusive dining deals, book tables, and discover top restaurants near you.',
    url: '/dining',
  },
  alternates: {
    canonical: '/dining',
  },
}

export default async function Dining({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const coords = await getUserCoords()
  const { moodSlug, ...parsed } = parseFilters(params)
  const filtered = countActive({ ...parsed, moodSlug }) > 0

  // Filtered view — app parity: DineinHome hides the curated rails while any
  // filter is active and shows the paged "All restaurants" feed instead.
  if (filtered) {
    const [moodCategories, cuisineOptions] = await Promise.all([
      getMoodCategories(),
      getCuisineFacets(),
    ])
    const moodTitle = moodSlug
      ? moodCategories.find((m) => m.slug === moodSlug)?.title
      : undefined
    const rows = await getRestaurantFeed({ ...parsed, moodTitle }, 0, FEED_PAGE_SIZE, coords)
    const queryString = new URLSearchParams(
      Object.entries(params).flatMap(([k, v]) =>
        typeof v === 'string' ? [[k, v] as [string, string]] : [],
      ),
    ).toString()

    return (
      <main>
        <HeroSection />
        <MoodCategoriesSection categories={moodCategories} />
        <QuickFilterTiles cuisineOptions={cuisineOptions} />
        <RestaurantResults
          key={queryString}
          initialRows={rows}
          initialHasMore={rows.length >= FEED_PAGE_SIZE}
          queryString={queryString}
        />
      </main>
    )
  }

  const [moodCategories, restaurants, bankOffers, editorialCollections, cuisineOptions, promoCollections] =
    await Promise.all([
      getMoodCategories(),
      getNewRestaurants(20, coords),
      getOffersForYou(),
      getEditorialCollections('RESTAURANT'),
      getCuisineFacets(),
      getPromotionalCollections('dinein', coords),
    ])

  // "Football fanatics" is CMS-flagged for both 'home' and 'dinein', but it
  // should only show on the home page — hidden here rather than in the CMS
  // row so the 'home' placement is untouched.
  const diningPromoCollections = promoCollections.filter(
    (c) => c.title.trim().toLowerCase() !== 'football fanatics',
  )

  const featured = restaurants.slice(0, 10)

  const offersYoullLove = [...restaurants]
    .filter((r) => r.has_offer)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10)

  const popularChains = [...restaurants]
    .sort((a, b) => (a.cost_for_two ?? 0) - (b.cost_for_two ?? 0))
    .slice(0, 10)

  return (
    <main>
      <HeroSection />
      <MoodCategoriesSection categories={moodCategories} />
      <QuickFilterTiles cuisineOptions={cuisineOptions} />
      <PromotionalCollectionsSection collections={diningPromoCollections} />
      <DiningDiscoverSection restaurants={featured} />
      <NowTrendingSection restaurants={restaurants} title="Now trending" />
      <OffersYoullLoveSection restaurants={offersYoullLove} />
      <DiningPopularChainsSection restaurants={popularChains} />
      <BankOffersSection cards={bankOffers} />
      <HotOnPassprive collections={editorialCollections} />
    </main>
  )
}
