'use client'

import { useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import { CategoryBar } from './CategoryBar'
import { AllStoresSection } from './AllStoresSection'
import type { StoreRow, StoreMoodCategory } from '@/lib/types/stores'

interface Props {
  moodCategories: StoreMoodCategory[]
  stores: StoreRow[]
  districtSection: ReactNode
}

export function StoresPageClient({ moodCategories, stores, districtSection }: Props) {
  const [activeSlug, setActiveSlug] = useState('all-stores')

  const filteredStores = useMemo(() => {
    if (activeSlug === 'all-stores') return stores
    const activeTitle = moodCategories.find(c => c.slug === activeSlug)?.title
    if (!activeTitle) return stores
    return stores.filter(s =>
      (s.category ?? '')
        .split(',')
        .map(c => c.trim())
        .includes(activeTitle),
    )
  }, [stores, moodCategories, activeSlug])

  return (
    <>
      <CategoryBar
        moodCategories={moodCategories}
        active={activeSlug}
        onSelect={setActiveSlug}
      />
      {districtSection}
      <AllStoresSection stores={filteredStores} />
    </>
  )
}
