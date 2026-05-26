'use client'

import { cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  Accessories: 'bg-sky-100',
  Apparel: 'bg-red-100',
  Beauty: 'bg-pink-100',
  Footwear: 'bg-gray-100',
  'Home Furniture': 'bg-yellow-100',
  Jewellery: 'bg-amber-100',
  'Salon & Wellness': 'bg-teal-100',
}

const DEFAULT_COLOR = 'bg-purple-100'

interface Props {
  categories: string[]
  active: string
  onSelect: (category: string) => void
}

export function CategoryBar({ categories, active, onSelect }: Props) {
  const all = [{ id: 'all', label: 'All Stores', color: 'bg-brand/10' }]
  const items = [
    ...all,
    ...categories.map(cat => ({
      id: cat,
      label: cat,
      color: CATEGORY_COLORS[cat] ?? DEFAULT_COLOR,
    })),
  ]

  return (
    <section className="relative  bg-white pt-5 pb-4 overflow-hidden">
      <div className="px-4 md:px-6">
        <h2 className="text-[15px] font-bold text-gray-900 mb-3">Shop by Category</h2>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1 md:mx-0 md:px-0 md:overflow-visible md:grid md:grid-cols-[repeat(auto-fit,minmax(90px,1fr))]">
          {items.map(({ id, label, color }) => (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={cn(
                'flex flex-col shrink-0 rounded-xl border overflow-hidden w-24 md:w-full text-left transition-all',
                active === id ? 'border-brand' : 'border-gray-200',
              )}
            >
              <span className="text-[11px] md:text-[12px] font-medium text-gray-600 px-2 pt-2 pb-1 leading-tight">
                {label}
              </span>
              <div className={cn('w-full h-16 md:h-20', color)} />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
