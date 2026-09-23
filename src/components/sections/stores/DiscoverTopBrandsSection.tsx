import Link from 'next/link'
import Image from 'next/image'
import { HScroll } from '@/components/sections/home/HScroll'
import type { StoreRow } from '@/lib/types/stores'

// Fallback tile color when a brand has no cover image — app parity:
// components/StoresHome/DiscoverTopBrands.jsx BRAND_COLORS.
const FALLBACK_COLORS = [
  '#E03535',
  '#C8285A',
  '#7B4FD6',
  '#E07020',
  '#1A9C7B',
  '#2870C8',
]

/**
 * "Discover top brands" — app parity: components/StoresHome/DiscoverTopBrands.jsx.
 * Full-bleed brand cover image, a rounded logo badge top-right, and an
 * "Explore Now" pill over the bottom.
 */
export function DiscoverTopBrandsSection({ stores }: { stores: StoreRow[] }) {
  if (!stores.length) return null

  return (
    <HScroll
      title="Discover top brands"
      maxWidthClassName="max-w-7xl 2xl:max-w-394"
      gapClassName="gap-6 2xl:gap-10"
    >
      {stores.map((store, i) => (
        <Link
          key={store.id}
          href={`/stores/${store.slug ?? store.id}`}
          className="relative block aspect-420/548 w-[calc((100%-60px)/3.5)] shrink-0 overflow-hidden rounded-[20px] 2xl:w-[calc((100%-100px)/3.5)]"
          style={{ backgroundColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
        >
          {store.cover_image && (
            <Image
              src={store.cover_image}
              alt={store.name}
              fill
              className="object-cover"
              sizes="330px"
            />
          )}
          <div className="absolute inset-0 bg-black/15" />

          {store.logo_url && (
            <div className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-[0_2px_6px_rgba(0,0,0,0.1)]">
              <Image
                src={store.logo_url}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            </div>
          )}

          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold whitespace-nowrap text-[#2247FF] shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
            Explore Now &rarr;
          </span>
        </Link>
      ))}
    </HScroll>
  )
}
