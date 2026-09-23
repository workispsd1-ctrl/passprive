'use client'

import { useState } from 'react'
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
  const [activeSlug, setActiveSlug] = useState('all-stores')

  return (
    <>
      <CategoryBar
        moodCategories={moodCategories}
        active={activeSlug}
        onSelect={setActiveSlug}
      />
      <DiscoverTopBrandsSection stores={topBrands} />
      <TopBrandCirclesSection stores={topBrands} />
      <StorePromotionalCardsSection collections={promoCollections} stores={stores} />
      <AllStoresSection
        stores={stores}
        moodCategories={moodCategories}
        activeCategorySlug={activeSlug}
        onCategoryChange={setActiveSlug}
      />
    </>
  )
}
