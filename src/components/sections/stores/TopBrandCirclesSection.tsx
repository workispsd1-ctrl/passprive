import Link from 'next/link'
import Image from 'next/image'
import { HScroll } from '@/components/sections/home/HScroll'
import type { StoreRow } from '@/lib/types/stores'

// orange → blue translucent ring behind each avatar — same treatment as
// "Foodie front row" (NowTrendingSection.tsx).
const RING =
  'linear-gradient(253.56deg, rgba(255,72,0,0.29) 9.31%, rgba(0,68,255,0.29) 99.66%)'

/**
 * "Discover top brands" (circular variant) — matches the "Foodie front row"
 * design: a gradient ring behind a circular photo, name below, area below
 * that.
 */
export function TopBrandCirclesSection({ stores }: { stores: StoreRow[] }) {
  if (!stores.length) return null

  return (
    <HScroll title="Discover top brands">
      {stores.map((store) => (
        <Link
          key={store.id}
          href={`/stores/${store.slug ?? store.id}`}
          className="flex w-52 shrink-0 flex-col items-center text-center 2xl:w-72"
        >
          <div className="relative aspect-square w-full">
            <div
              className="absolute inset-0 translate-y-1.5 rounded-full 2xl:translate-y-2.25"
              style={{ background: RING }}
            />
            <div className="absolute inset-0 overflow-hidden rounded-full bg-gray-100">
              {store.logo_url && (
                <Image
                  src={store.logo_url}
                  alt={store.name}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1536px) 288px, 208px"
                />
              )}
            </div>
          </div>
          <p className="mt-4 w-full truncate text-sm font-bold leading-none text-[#0D141C] 2xl:mt-6">
            {store.name}
          </p>
          <p className="mt-1.5 w-full truncate text-xs font-medium leading-none text-[#717171]">
            {store.location_name ?? store.city}
          </p>
        </Link>
      ))}
    </HScroll>
  )
}
