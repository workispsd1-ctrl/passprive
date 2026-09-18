import Link from 'next/link'
import Image from 'next/image'
import { HScroll } from '@/components/sections/home/HScroll'
import type { MoodCategory } from '@/lib/types/dining'

/**
 * "What's on your mind?" — app parity: components/DininHome/IntheMoodFor.jsx.
 * Same data source (restaurant_mood_categories, is_active, sort_order). The
 * app never renders `title` as text on the chip (image only) — matched here.
 *
 * TODO(design): the app navigates a tap to a mood-filtered restaurant list
 * (`filterType: 'mood_tag'`); the web has no such route yet, so these link to
 * `/dining` with a `mood` query param that isn't wired up to filter results.
 */
export function MoodCategoriesSection({
  categories,
}: {
  categories: MoodCategory[]
}) {
  if (!categories.length) return null

  return (
    <HScroll
      title="What&rsquo;s on your mind?"
      maxWidthClassName="max-w-7xl 2xl:max-w-394"
      gapClassName="gap-2 2xl:gap-4"
    >
      {categories.map((c) => (
        <Link
          key={c.key}
          href={`/dining?mood=${encodeURIComponent(c.slug)}`}
          aria-label={c.title}
          className="w-32.75 shrink-0 2xl:w-45.75"
        >
          <div className="relative h-34.5 w-full overflow-hidden rounded-[17px] 2xl:h-47.5 2xl:rounded-[24px]">
            {c.image_url && (
              <Image
                src={c.image_url}
                alt={c.title}
                fill
                className="object-cover"
                sizes="183px"
              />
            )}
          </div>
        </Link>
      ))}
    </HScroll>
  )
}
