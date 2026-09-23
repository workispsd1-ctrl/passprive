'use client'

import Image from 'next/image'
import { HScroll } from '@/components/sections/home/HScroll'
import { cn } from '@/lib/utils'
import type { StoreMoodCategory } from '@/lib/types/stores'

interface Props {
  moodCategories: StoreMoodCategory[]
  active: string
  onSelect: (slug: string) => void
}

/**
 * "What's on your mind?" — same rail as the dining page's MoodCategoriesSection
 * (image-only tiles, no label), reused here as filter buttons for the store
 * grid below instead of static links.
 */
export function CategoryBar({ moodCategories, active, onSelect }: Props) {
  if (!moodCategories.length) return null

  return (
    <HScroll
      title="What&rsquo;s on your mind?"
      maxWidthClassName="max-w-7xl 2xl:max-w-394"
      gapClassName="gap-2 2xl:gap-4"
    >
      {moodCategories.map((cat) => {
        const imgUrl = cat.light_theme_image_url ?? cat.image_url
        const isActive = active === cat.slug

        return (
          <button
            key={cat.slug}
            type="button"
            aria-label={cat.title}
            aria-pressed={isActive}
            onClick={() => onSelect(cat.slug)}
            className="w-32.75 shrink-0 2xl:w-45.75"
          >
            <div
              className={cn(
                'relative h-34.5 w-full overflow-hidden rounded-[17px] ring-2 ring-inset transition-colors 2xl:h-47.5 2xl:rounded-[24px]',
                isActive ? 'ring-brand' : 'ring-transparent',
              )}
            >
              {imgUrl && (
                <Image
                  src={imgUrl}
                  alt={cat.title}
                  fill
                  className="object-cover"
                  sizes="183px"
                />
              )}
            </div>
          </button>
        )
      })}
    </HScroll>
  )
}
