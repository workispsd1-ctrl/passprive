import Link from 'next/link'
import Image from 'next/image'
import { HScroll } from './HScroll'
import type { EditorialCollection } from '@/lib/types/stores'

/**
 * "Hot on Passprivé" — mirrors the app's `WhatsHotOnPassPrive`
 * (`components/Home/WhatsHotOnPassPrive.jsx`): editorial collections from
 * `editorial_collections`, rendered as a cover image + title + "by PassPrivé".
 */
export function HotOnPassprive({
  collections,
}: {
  collections: EditorialCollection[]
}) {
  if (!collections.length) return null

  return (
    <HScroll title="Hot on Passprivé">
      {collections.map((c) => (
        <Link
          key={c.id}
          // TODO(design): no collection detail route on web yet
          href="#"
          className="w-81.5 shrink-0"
        >
          <div className="relative aspect-326/218 overflow-hidden rounded-[16px] bg-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            {c.cover_image_url && (
              <Image
                src={c.cover_image_url}
                alt={c.title}
                fill
                className="object-cover"
                sizes="326px"
              />
            )}
          </div>
          <p className="mt-2 truncate text-[14px] font-bold text-[#0D141C]">
            {c.title}
          </p>
          <p className="text-[12px] text-gray-500">by PassPrivé</p>
        </Link>
      ))}
    </HScroll>
  )
}
