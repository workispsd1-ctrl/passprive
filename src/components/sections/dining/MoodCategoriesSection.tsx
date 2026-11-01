import Link from 'next/link'
import Image from 'next/image'
import { HScroll } from '@/components/sections/home/HScroll'
import type { MoodCategory } from '@/lib/types/dining'

/**
 * "What's on your mind?" — app parity: components/DininHome/IntheMoodFor.jsx.
 * Same data source (restaurant_mood_categories, is_active, sort_order). The
 * app never renders `title` as text on the chip (image only) — matched here.
 *
 * A tap opens the mood's restaurant list (`/dining/mood/[slug]`), like the
 * app's `handleSelectMood` → OfferRestaurants with `filterType: 'mood_tag'`.
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
      gapClassName="gap-2 xl:gap-3 2xl:gap-5 min-[120rem]:gap-12"
    >
      {categories.map((c) => (
        <Link
          key={c.key}
          href={`/dining/mood/${encodeURIComponent(c.slug)}`}
          aria-label={c.title}
          className="w-32.75 shrink-0 transition-transform hover:-translate-y-0.5 2xl:w-45.75 min-[120rem]:w-62"
        >
          <div className="relative h-34.5 w-full overflow-hidden rounded-[17px] 2xl:h-47.5 2xl:rounded-[24px] min-[120rem]:h-71">
            {c.image_url && (
              <Image
                src={c.image_url}
                alt={c.title}
                fill
                className="object-cover"
                sizes="(min-width: 1920px) 248px, 183px"
              />
            )}
          </div>
        </Link>
      ))}
    </HScroll>
  )
}
