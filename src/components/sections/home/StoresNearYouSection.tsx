import Link from 'next/link'
import Image from 'next/image'
import { HScroll } from './HScroll'
import type { StoreRow } from '@/lib/types/stores'

export function StoresNearYouSection({ stores }: { stores: StoreRow[] }) {
  if (!stores.length) return null
  const items = stores.slice(0, 10)

  return (
    <HScroll title="Shop this weekend">
      {items.map((store) => (
        <Link
          key={store.id}
          href={`/stores/${store.slug}`}
          className="relative block aspect-420/548 w-80 shrink-0 overflow-hidden rounded-[20px] bg-gray-900 2xl:w-105"
        >
          {store.cover_image ? (
            <Image
              src={store.cover_image}
              alt={store.name}
              fill
              className="object-cover"
              sizes="(min-width: 1536px) 420px, 320px"
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-gray-700 to-gray-900" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />

          {store.logo_url && (
            <span className="absolute right-7 top-7 h-15 w-15 overflow-hidden rounded-xl shadow-md 2xl:right-9 2xl:top-9 2xl:h-20 2xl:w-20">
              <Image
                src={store.logo_url}
                alt={store.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </span>
          )}

          <p className="absolute left-4 top-4 text-[15px] font-bold text-white drop-shadow">
            {store.name}
          </p>

          {/* DM Sans 500 / 19.6 / 28 — #2247FF on white, radius 19.6 */}
          <span className="absolute bottom-5 left-1/2 flex h-8 w-33 -translate-x-1/2 items-center justify-center rounded-full bg-white font-(family-name:--font-dm-sans) text-[15px] font-medium leading-7 text-[#2247FF] 2xl:h-10 2xl:w-43 2xl:text-[19.6px]">
            Explore Now
          </span>
        </Link>
      ))}
    </HScroll>
  )
}
