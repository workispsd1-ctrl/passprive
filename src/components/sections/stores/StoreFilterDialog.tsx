'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  DISTANCE_OPTIONS,
  OFFER_OPTIONS,
  STORE_FILTER_SECTIONS,
  STORE_SORT_OPTIONS,
  type StoreFilterSection,
  type StoreFilters,
} from '@/lib/storeFilters'

function Option({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onClick}
      className="flex w-full items-center gap-3 py-2.5 text-left"
    >
      <span
        className={cn(
          'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2',
          selected ? 'border-brand-light' : 'border-gray-300',
        )}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-brand-light" />}
      </span>
      <span className={cn('text-[13px]', selected ? 'font-semibold text-[#0D141C]' : 'text-gray-700')}>{children}</span>
    </button>
  )
}

/**
 * Store filter sheet — app parity: DininHome/FilterModal.jsx opened with
 * STORE_FILTER_SECTIONS (Sort, Distance, Store Category, Special Offers):
 * section list on the left, options on the right, "Reset" / "Apply Filters".
 * Store Category is hidden when there are no categories, as in the app.
 */
export function StoreFilterDialog({
  open,
  onClose,
  initial,
  categoryOptions,
  onApply,
  onReset,
}: {
  open: boolean
  onClose: () => void
  initial: StoreFilters
  categoryOptions: string[]
  onApply: (filters: StoreFilters) => void
  onReset: () => void
}) {
  const sections = STORE_FILTER_SECTIONS.filter((s) => s !== 'Store Category' || categoryOptions.length > 0)
  const [active, setActive] = useState<StoreFilterSection>(sections[0])
  const [draft, setDraft] = useState<StoreFilters>(initial)

  const single = (key: 'sort' | 'distance', value: string) =>
    setDraft((d) => ({ ...d, [key]: d[key] === value ? null : value }))
  const toggleMore = (value: string) =>
    setDraft((d) => ({ ...d, more: d.more.includes(value) ? d.more.filter((m) => m !== value) : [...d.more, value] }))

  const options = (() => {
    switch (active) {
      case 'Sort':
        return STORE_SORT_OPTIONS.map((o) => (
          <Option key={o} selected={draft.sort === o} onClick={() => single('sort', o)}>{o}</Option>
        ))
      case 'Distance':
        return DISTANCE_OPTIONS.map((o) => (
          <Option key={o} selected={draft.distance === o} onClick={() => single('distance', o)}>{o}</Option>
        ))
      case 'Store Category':
        return categoryOptions.map((o) => (
          <Option key={o} selected={draft.more.includes(o)} onClick={() => toggleMore(o)}>{o}</Option>
        ))
      case 'Special Offers':
        return OFFER_OPTIONS.map((o) => (
          <Option key={o} selected={draft.more.includes(o)} onClick={() => toggleMore(o)}>{o}</Option>
        ))
    }
  })()

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-gray-100 px-5 py-4">
          <DialogTitle className="text-[15px] font-bold text-[#0D141C]">Filter</DialogTitle>
        </DialogHeader>

        <div className="flex h-[min(60vh,420px)]">
          <nav className="w-[36%] shrink-0 overflow-y-auto bg-gray-50" aria-label="Filter sections">
            {sections.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setActive(s)}
                aria-current={s === active ? 'true' : undefined}
                className={cn(
                  'block w-full border-l-[3px] px-4 py-3.5 text-left text-[13px] transition-colors',
                  s === active
                    ? 'border-brand-light bg-white font-semibold text-[#0D141C]'
                    : 'border-transparent text-gray-600 hover:bg-white/60',
                )}
              >
                {s}
              </button>
            ))}
          </nav>
          <div className="min-w-0 flex-1 overflow-y-auto px-5 py-2">{options}</div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-3">
          <button
            type="button"
            onClick={() => {
              onReset()
              onClose()
            }}
            className="text-sm font-semibold text-gray-500 hover:text-gray-800"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="rounded-full bg-brand-light px-6 py-2 text-sm font-semibold text-white hover:bg-[#E85A0F]"
          >
            Apply Filters
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
