'use client'

import { useState } from 'react'
import { FilterOption, FilterShell } from '@/components/sections/dining/FilterDialog'
import {
  DISTANCE_OPTIONS,
  EMPTY_STORE_FILTERS,
  OFFER_OPTIONS,
  STORE_FILTER_SECTIONS,
  STORE_SORT_OPTIONS,
  type StoreFilterSection,
  type StoreFilters,
} from '@/lib/storeFilters'

/**
 * Store / wellness filter popup — app parity: DininHome/FilterModal.jsx opened
 * with STORE_FILTER_SECTIONS (Sort, Distance, Store Category, Special Offers),
 * drawn in the dining filter pop-up's design. The category section is hidden
 * when there are no categories, as in the app.
 */
export function StoreFilterDialog({
  open,
  onClose,
  initial,
  categoryOptions,
  categoryLabel = 'Store Category',
  onApply,
}: {
  open: boolean
  onClose: () => void
  initial: StoreFilters
  categoryOptions: string[]
  /** the category section's name (wellness lists services) */
  categoryLabel?: string
  onApply: (filters: StoreFilters) => void
}) {
  const sections = STORE_FILTER_SECTIONS.filter((s) => s !== 'Store Category' || categoryOptions.length > 0)
  const [active, setActive] = useState<StoreFilterSection>(sections[0])
  const [draft, setDraft] = useState<StoreFilters>(initial)
  const label = (s: StoreFilterSection) => (s === 'Store Category' ? categoryLabel : s)

  // single-choice: tapping the selected option clears it, like the app
  const single = (key: 'sort' | 'distance', value: string) =>
    setDraft((d) => ({ ...d, [key]: d[key] === value ? null : value }))
  const toggleMore = (value: string) =>
    setDraft((d) => ({ ...d, more: d.more.includes(value) ? d.more.filter((m) => m !== value) : [...d.more, value] }))

  const options = (() => {
    switch (active) {
      case 'Sort':
        return STORE_SORT_OPTIONS.map((o) => <FilterOption key={o} label={o} selected={draft.sort === o} onClick={() => single('sort', o)} />)
      case 'Distance':
        return DISTANCE_OPTIONS.map((o) => <FilterOption key={o} label={o} selected={draft.distance === o} onClick={() => single('distance', o)} />)
      case 'Store Category':
        return categoryOptions.map((o) => <FilterOption key={o} multi label={o} selected={draft.more.includes(o)} onClick={() => toggleMore(o)} />)
      case 'Special Offers':
        return OFFER_OPTIONS.map((o) => <FilterOption key={o} multi label={o} selected={draft.more.includes(o)} onClick={() => toggleMore(o)} />)
    }
  })()

  // the shell titles the options with the section name, so pass the display names through
  const names = sections.map(label)
  return (
    <FilterShell
      open={open}
      onClose={onClose}
      sections={names}
      section={label(active)}
      onSection={(name) => setActive(sections[names.indexOf(name)])}
      single={active === 'Sort' || active === 'Distance'}
      onReset={() => setDraft(EMPTY_STORE_FILTERS)}
      onApply={() => onApply(draft)}
    >
      {options}
    </FilterShell>
  )
}
