import Image from 'next/image'
import Link from 'next/link'
import { HScroll } from '@/components/sections/home/HScroll'
import type { StoreMoodCategory } from '@/lib/types/stores'

interface Props {
  moodCategories: StoreMoodCategory[]
}

/**
 * "What's on your mind?" — same rail as the dining page's MoodCategoriesSection
 * (image-only tiles, no label). A tap opens that category's store list
 * (`/stores/category/[slug]`), like the app's `handleSelectCategory` →
 * StoreCategoryResults.
 */
export function CategoryBar({ moodCategories }: Props) {
  if (!moodCategories.length) return null

  return (
    <HScroll
      title="What&rsquo;s on your mind?"
      maxWidthClassName="max-w-7xl 2xl:max-w-394"
      gapClassName="gap-2 2xl:gap-4"
    >
      {moodCategories.map((cat) => {
        const imgUrl = cat.light_theme_image_url ?? cat.image_url

        return (
          <Link
            key={cat.slug}
            href={`/stores/category/${encodeURIComponent(cat.slug)}`}
            aria-label={cat.title}
            className="w-32.75 shrink-0 transition-transform hover:-translate-y-0.5 2xl:w-45.75"
          >
            <div className="relative h-34.5 w-full overflow-hidden rounded-[17px] 2xl:h-47.5 2xl:rounded-[24px]">
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
          </Link>
        )
      })}
    </HScroll>
  )
}
