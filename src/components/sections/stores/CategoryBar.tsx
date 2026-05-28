'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { StoreMoodCategory } from '@/lib/types/stores'

interface Props {
  moodCategories: StoreMoodCategory[]
  active: string
  onSelect: (slug: string) => void
}

export function CategoryBar({ moodCategories, active, onSelect }: Props) {
  return (
    <section className="relative bg-white pt-5 pb-4 overflow-hidden">
      <div className="px-4 md:px-6">
        <h2 className="text-[15px] font-bold text-gray-900 mb-3">Shop by Category</h2>
        <div className="flex gap-6 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1 md:mx-0 md:px-0 md:overflow-visible md:grid md:grid-cols-[repeat(auto-fit,minmax(90px,1fr))]">
          {moodCategories.map(cat => {
            const imgUrl = cat.light_theme_image_url ?? cat.image_url
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => onSelect(cat.slug)}
                className={cn(
                  'relative shrink-0 rounded-xl overflow-hidden w-24 aspect-square md:w-full transition-all',
                  active === cat.slug ? 'ring-2 ring-inset ring-brand' : 'ring-2 ring-inset ring-transparent',
                )}
              >
                {imgUrl && (
                  <Image
                    src={imgUrl}
                    alt={cat.title}
                    fill
                    className="object-fill"
                    sizes="(max-width: 768px) 96px, 20vw"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
