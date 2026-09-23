'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  COST_BUCKETS,
  RATING_OPTIONS,
  VIBE_OPTIONS,
  type FeedFilters,
} from '@/lib/restaurantFilters'

type Draft = Pick<
  FeedFilters,
  'cuisines' | 'minRating' | 'cost' | 'veg' | 'openNow' | 'openLate' | 'hasOffer' | 'vibes'
>

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-[#FF6A19] bg-[#FFF1EA] text-[#FF6A19]'
          : 'border-gray-200 text-gray-700 hover:bg-gray-50',
      )}
    >
      {children}
    </button>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 px-5 py-4">
      <p className="mb-2.5 text-[13px] font-bold text-[#0D141C]">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

/**
 * Filter sheet — app parity: DininHome/FilterModal.jsx (cuisines, rating,
 * cost, availability, dietary, vibes; "Reset" / "Apply Filters"). Sort lives in
 * its own menu, as in the app.
 */
export function FilterDialog({
  open,
  onClose,
  initial,
  cuisineOptions,
  onApply,
}: {
  open: boolean
  onClose: () => void
  initial: Draft
  cuisineOptions: string[]
  onApply: (draft: Draft) => void
}) {
  const [draft, setDraft] = useState<Draft>(initial)

  const toggleIn = (key: 'cuisines' | 'vibes', value: string) =>
    setDraft((d) => {
      const cur = d[key] ?? []
      return { ...d, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] }
    })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-gray-100 px-5 py-4">
          <DialogTitle className="text-[15px] font-bold text-[#0D141C]">Filters</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {cuisineOptions.length > 0 && (
            <Group title="Cuisines">
              {cuisineOptions.slice(0, 24).map((c) => (
                <Chip key={c} active={!!draft.cuisines?.includes(c)} onClick={() => toggleIn('cuisines', c)}>
                  {c}
                </Chip>
              ))}
            </Group>
          )}

          <Group title="Rating">
            {RATING_OPTIONS.map((r) => (
              <Chip
                key={r}
                active={draft.minRating === r}
                onClick={() => setDraft((d) => ({ ...d, minRating: d.minRating === r ? undefined : r }))}
              >
                {r.toFixed(1)}+ ★
              </Chip>
            ))}
          </Group>

          <Group title="Cost for two">
            {COST_BUCKETS.map((b) => (
              <Chip
                key={b.key}
                active={draft.cost === b.key}
                onClick={() => setDraft((d) => ({ ...d, cost: d.cost === b.key ? undefined : b.key }))}
              >
                {b.label}
              </Chip>
            ))}
          </Group>

          <Group title="More">
            <Chip active={!!draft.openNow} onClick={() => setDraft((d) => ({ ...d, openNow: !d.openNow }))}>
              Open now
            </Chip>
            <Chip active={!!draft.openLate} onClick={() => setDraft((d) => ({ ...d, openLate: !d.openLate }))}>
              Open late
            </Chip>
            <Chip active={!!draft.veg} onClick={() => setDraft((d) => ({ ...d, veg: !d.veg }))}>
              Pure veg
            </Chip>
            <Chip active={!!draft.hasOffer} onClick={() => setDraft((d) => ({ ...d, hasOffer: !d.hasOffer }))}>
              Has offers
            </Chip>
          </Group>

          <Group title="Vibe & amenities">
            {VIBE_OPTIONS.map((v) => (
              <Chip key={v} active={!!draft.vibes?.includes(v)} onClick={() => toggleIn('vibes', v)}>
                {v}
              </Chip>
            ))}
          </Group>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-3">
          <button
            type="button"
            onClick={() =>
              setDraft({ cuisines: [], minRating: undefined, cost: undefined, veg: false, openNow: false, openLate: false, hasOffer: false, vibes: [] })
            }
            className="text-sm font-semibold text-gray-500 hover:text-gray-800"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="rounded-full bg-[#FF6A19] px-6 py-2 text-sm font-semibold text-white hover:bg-[#E85A0F]"
          >
            Apply Filters
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
