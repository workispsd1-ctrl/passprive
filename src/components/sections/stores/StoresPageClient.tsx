'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { CategoryBar } from './CategoryBar'
import { AllStoresSection } from './AllStoresSection'
import type { StoreRow } from '@/app/stores/page'

interface Props {
  categories: string[]
  stores: StoreRow[]
  districtSection: ReactNode
}

export function StoresPageClient({ categories, stores, districtSection }: Props) {
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredStores =
    activeCategory === 'all'
      ? stores
      : stores.filter(s =>
          (s.category ?? '')
            .split(',')
            .map(c => c.trim())
            .includes(activeCategory),
        )

  return (
    <>
      <CategoryBar
        categories={categories}
        active={activeCategory}
        onSelect={setActiveCategory}
      />
      {districtSection}
      <AllStoresSection stores={filteredStores} />
    </>
  )
}
