'use client'

import { CategoryBar } from './CategoryBar'
import { AllStoresSection } from './AllStoresSection'
import { DiscoverTopBrandsSection } from './DiscoverTopBrandsSection'
import { TopBrandCirclesSection } from './TopBrandCirclesSection'
import { StorePromotionalCardsSection } from './StorePromotionalCardsSection'
import type { StoreRow, StoreMoodCategory } from '@/lib/types/stores'
import type { StorePromotionalCollection } from '@/lib/services/stores'

interface Props {
  moodCategories: StoreMoodCategory[]
  stores: StoreRow[]
  topBrands: StoreRow[]
  promoCollections: StorePromotionalCollection[]
}

export function StoresPageClient({ moodCategories, stores, topBrands, promoCollections }: Props) {
  return (
    <>
      <CategoryBar moodCategories={moodCategories} />
      <DiscoverTopBrandsSection stores={topBrands} />
      <TopBrandCirclesSection stores={topBrands} />
      <StorePromotionalCardsSection collections={promoCollections} stores={stores} />
      <AllStoresSection
        stores={stores}
        moodCategories={moodCategories}
        activeCategorySlug="all-stores"
      />
    </>
  )
}
