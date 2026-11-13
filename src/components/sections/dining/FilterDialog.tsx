'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  AVAILABILITY_OPTIONS,
  CATEGORY_OPTIONS,
  COST_BUCKETS,
  DIALOG_SORT_OPTIONS,
  DIET_OPTIONS,
  DISTANCE_OPTIONS,
  OFFER_OPTIONS,
  RATING_OPTIONS,
  VIBE_OPTIONS,
  type FeedFilters,
} from '@/lib/restaurantFilters'

export type FilterDraft = Pick<
  FeedFilters,
  | 'sort'
  | 'cuisines'
  | 'minRating'
  | 'cost'
  | 'veg'
  | 'openNow'
  | 'openLate'
  | 'hasOffer'
  | 'vibes'
  | 'distance'
  | 'categories'
  | 'diets'
  | 'offers'
  | 'availability'
>

type ListKey = 'cuisines' | 'vibes' | 'categories' | 'diets' | 'offers' | 'availability'

const EMPTY: FilterDraft = {
  sort: undefined,
  cuisines: [],
  minRating: undefined,
  cost: undefined,
  veg: false,
  openNow: false,
  openLate: false,
  hasOffer: false,
  vibes: [],
  distance: undefined,
  categories: [],
  diets: [],
  offers: [],
  availability: [],
}

const SECTIONS = [
  'Sort',
  'Availability',
  'Distance',
  'Ratings',
  'Restaurant Category',
  'Dietary Preferences',
  'Cost for two',
  'Cuisines',
  'Vibe & Ambience',
  'Special Offers',
] as const
export type Section = (typeof SECTIONS)[number]

/**
 * Figma "Explore more restaurants – filter pop-up" (1920 frame). Exact design
 * px at 1920, proportional on other desktop widths; phone sizes below lg.
 * Portalled, so the unit lives on the popup itself.
 */
const UNIT = '[--u:1px] lg:[--u:calc(100vw/1920)] [--spacing:var(--u)]'

/** One option row: radio (single choice) or filled check circle (multi choice). */
export function FilterOption({
  label,
  selected,
  multi,
  onClick,
}: {
  label: React.ReactNode
  selected: boolean
  multi?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onClick}
      className="flex h-48 w-full shrink-0 items-center gap-12 py-12 text-left max-lg:h-44 max-lg:gap-10"
    >
      <span
        aria-hidden
        className={cn(
          'flex size-20 shrink-0 items-center justify-center rounded-full border border-[#D9D9D9] bg-white max-lg:size-18',
          selected && !multi && 'border-[length:var(--b)] border-[#FF4800] [--b:calc(5*var(--u))] max-lg:[--b:4.5px]',
          selected && multi && 'border-[#FF4800] bg-[#FF4800]',
        )}
      >
        {selected && multi && <Check className="size-12 text-white max-lg:size-11" strokeWidth={3.5} />}
      </span>
      <span className="min-w-0 flex-1 text-[length:var(--t)] leading-24 font-normal text-[#48464C] [--t:calc(16*var(--u))] max-lg:leading-20 max-lg:[--t:14px]">
        {label}
      </span>
    </button>
  )
}

/**
 * Restaurant filter dialog — app parity: DininHome/FilterModal.jsx (sidebar of
 * ten sections, single-choice radios / multi-choice checks, "Reset" /
 * "Apply Filters"), laid out to the website Figma.
 */
export function FilterDialog({
  open,
  onClose,
  initial,
  cuisineOptions,
  sections: only,
  onApply,
}: {
  open: boolean
  onClose: () => void
  initial: FilterDraft
  cuisineOptions: string[]
  /** limit the sidebar to these sections (lists filtered locally can't apply them all) */
  sections?: readonly Section[]
  onApply: (draft: FilterDraft) => void
}) {
  const [draft, setDraft] = useState<FilterDraft>(initial)
  const sections = SECTIONS.filter((s) => (!only || only.includes(s)) && (s !== 'Cuisines' || cuisineOptions.length > 0))
  const [section, setSection] = useState<Section>(sections[0] ?? 'Sort')

  const has = (key: ListKey, v: string) => !!draft[key]?.includes(v)
  const toggle = (key: ListKey, v: string) =>
    setDraft((d) => {
      const cur = d[key] ?? []
      return { ...d, [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] }
    })
  /** single-choice: tapping the selected option clears it, like the app */
  const pick = <K extends 'sort' | 'distance' | 'cost' | 'minRating'>(key: K, v: FilterDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: d[key] === v ? undefined : v }))
  const flag = (key: 'openNow' | 'veg') => setDraft((d) => ({ ...d, [key]: !d[key] }))

  const multi = (key: ListKey, options: readonly string[]) =>
    options.map((o) => <FilterOption key={o} multi label={o} selected={has(key, o)} onClick={() => toggle(key, o)} />)

  function options() {
    switch (section) {
      case 'Sort':
        return DIALOG_SORT_OPTIONS.map((o) => (
          <FilterOption
            key={o.label}
            label={o.label}
            selected={(draft.sort ?? null) === o.key}
            onClick={() => setDraft((d) => ({ ...d, sort: o.key ?? undefined }))}
          />
        ))
      case 'Availability':
        return (
          <>
            <FilterOption multi label="Open Now" selected={!!draft.openNow} onClick={() => flag('openNow')} />
            {multi('availability', AVAILABILITY_OPTIONS)}
          </>
        )
      case 'Distance':
        return DISTANCE_OPTIONS.map((o) => (
          <FilterOption key={o.key} label={o.label} selected={draft.distance === o.key} onClick={() => pick('distance', o.key)} />
        ))
      case 'Ratings':
        return RATING_OPTIONS.map((r) => (
          <FilterOption
            key={r}
            label={`★ ${r.toFixed(1)} & above`}
            selected={draft.minRating === r}
            onClick={() => pick('minRating', r)}
          />
        ))
      case 'Restaurant Category':
        return multi('categories', CATEGORY_OPTIONS)
      case 'Dietary Preferences':
        return (
          <>
            <FilterOption multi label="Pure Veg" selected={!!draft.veg} onClick={() => flag('veg')} />
            {multi('diets', DIET_OPTIONS)}
          </>
        )
      case 'Cost for two':
        return COST_BUCKETS.map((b) => (
          <FilterOption key={b.key} label={b.label} selected={draft.cost === b.key} onClick={() => pick('cost', b.key)} />
        ))
      case 'Cuisines':
        return multi('cuisines', cuisineOptions)
      case 'Vibe & Ambience':
        return multi('vibes', VIBE_OPTIONS)
      case 'Special Offers':
        return multi('offers', OFFER_OPTIONS)
    }
  }

  return (
    <FilterShell
      open={open}
      onClose={onClose}
      sections={sections}
      section={section}
      onSection={setSection}
      single={section === 'Sort' || ['Distance', 'Ratings', 'Cost for two'].includes(section)}
      onReset={() => setDraft(EMPTY)}
      onApply={() => onApply(draft)}
    >
      {options()}
    </FilterShell>
  )
}

/**
 * The filter popup's frame — Figma "Explore more restaurants – filter pop-up":
 * header with close, section list on the left, the active section's options
 * on the right, "Reset" / "Apply Filters". Dining, Stores and Wellness share it.
 */
export function FilterShell<S extends string>({
  open,
  onClose,
  sections,
  section,
  onSection,
  single,
  onReset,
  onApply,
  children,
}: {
  open: boolean
  onClose: () => void
  sections: readonly S[]
  section: S
  onSection: (s: S) => void
  /** the active section is single-choice (radios) */
  single: boolean
  onReset: () => void
  onApply: () => void
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/33 supports-backdrop-filter:backdrop-blur-none"
        className={cn(
          UNIT,
          'flex flex-col gap-0 overflow-hidden rounded-[length:var(--r)] bg-white p-0 font-(family-name:--font-dm-sans) text-[#322F35] shadow-[0_4px_12px_rgba(0,0,0,0.08)] ring-0',
          'h-[var(--h)] w-[var(--w)] max-w-none sm:max-w-none [--h:calc(688*var(--u))] [--r:calc(24*var(--u))] [--w:calc(880*var(--u))]',
          'max-lg:max-h-[85vh] max-lg:[--h:600px] max-lg:[--r:20px] max-lg:[--w:calc(100vw-32px)]',
        )}
      >
        {/* header */}
        <div className="flex h-80 shrink-0 items-center justify-between border-b border-[#F5EFF7] pr-24 pl-32 max-lg:h-56 max-lg:pr-10 max-lg:pl-16">
          <DialogTitle className="text-[length:var(--t)] leading-28 font-bold text-[#322F35] [--t:calc(20*var(--u))] max-lg:leading-24 max-lg:[--t:18px]">
            Filter
          </DialogTitle>
          <DialogClose
            aria-label="Close"
            className="flex size-40 items-center justify-center rounded-full text-[#322F35] hover:bg-[#F5EFF7] max-lg:size-36"
          >
            <X className="size-32 max-lg:size-24" strokeWidth={1.75} />
          </DialogClose>
        </div>

        {/* body: section list + options */}
        <div className="flex min-h-0 flex-1">
          <nav
            aria-label="Filter sections"
            className="flex w-240 shrink-0 flex-col overflow-y-auto bg-[#FFFBFF] py-20 max-lg:w-124 max-lg:py-8"
          >
            {sections.map((s) => {
              const active = s === section
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSection(s)}
                  aria-current={active}
                  className={cn(
                    'relative flex h-48 w-full shrink-0 items-center pr-20 pl-28 text-left text-[length:var(--t)] leading-20 [--t:calc(14*var(--u))] max-lg:h-auto max-lg:min-h-44 max-lg:py-8 max-lg:pr-8 max-lg:pl-14 max-lg:leading-16 max-lg:[--t:12.5px]',
                    active
                      ? 'bg-white font-bold text-[#FF4800] before:absolute before:inset-y-0 before:left-0 before:w-[calc(4*var(--u))] before:bg-[#FF4800] max-lg:before:w-[3px]'
                      : 'font-medium text-[#48464C] hover:text-[#322F35]',
                  )}
                >
                  {s}
                </button>
              )
            })}
          </nav>

          <div
            role={single ? 'radiogroup' : 'group'}
            aria-label={section}
            className="flex min-w-0 flex-1 flex-col gap-8 overflow-y-auto bg-white px-32 py-28 max-lg:gap-4 max-lg:px-16 max-lg:py-16"
          >
            <h3 className="shrink-0 text-[length:var(--t)] leading-26 font-bold text-[#322F35] [--t:calc(18*var(--u))] max-lg:leading-22 max-lg:[--t:16px]">
              {section}
            </h3>
            {children}
          </div>
        </div>

        {/* actions */}
        <div className="flex h-88 shrink-0 items-center justify-end gap-12 border-t border-[#F5EFF7] px-32 max-lg:h-72 max-lg:gap-10 max-lg:px-16">
          <button
            type="button"
            onClick={onReset}
            className="flex h-54 w-120 items-center justify-center rounded-full border border-[#FF4800] text-[length:var(--t)] leading-21 font-semibold tracking-[-0.02em] text-[#FF4800] [--t:calc(16*var(--u))] hover:bg-[#FFF3EE] max-lg:h-44 max-lg:flex-1 max-lg:[--t:15px]"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex h-54 w-168 items-center justify-center rounded-full bg-[#FF4800] text-[length:var(--t)] leading-21 font-semibold tracking-[-0.02em] text-white [--t:calc(16*var(--u))] hover:bg-[#E84100] max-lg:h-44 max-lg:flex-[1.4] max-lg:[--t:15px]"
          >
            Apply Filters
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
