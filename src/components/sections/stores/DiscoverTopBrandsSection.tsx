'use client'

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
    <HScroll title="Discover top brands">
      {stores.map((store, i) => (
        <Link
          key={store.id}
          href={`/stores/${store.slug ?? store.id}`}
          // phones: ~2.3 tiles in view so "Explore Now" fits; from md the same
          // sizes as the home page's tile (StoresNearYouSection)
          className="relative block aspect-420/548 w-[42%] shrink-0 overflow-hidden rounded-[20px] [--badge-inset:50px] md:w-80 md:[--badge-inset:70px] 2xl:w-105 2xl:[--badge-inset:78px]"
          style={{ backgroundColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
        >
          {store.cover_image && (
            <Image
              src={store.cover_image}
              alt={store.name}
              fill
              className="object-cover"
              sizes="(min-width: 1536px) 420px, (min-width: 768px) 320px, 42vw"
            />
          )}
          <div className="absolute inset-0 bg-black/15" />

          {/* Card badges (cashback art, Promoted, Book Now — app: DiscoverTopBrands.jsx CashbackBadge)
              are hidden on these cards. To restore: re-import CardBadgeArt / getCardBadge / useUserPlan and render
              <CardBadgeArt badge={getCardBadge(store, plan)} radius={20} bottomInset="var(--badge-inset)" /> */}

          {store.logo_url && (
            <div className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-[0_2px_6px_rgba(0,0,0,0.1)] md:top-7 md:right-7 md:h-15 md:w-15 2xl:top-9 2xl:right-9 2xl:h-20 2xl:w-20">
              <Image
                src={store.logo_url}
                alt=""
                width={64}
                height={64}
                className="h-8 w-8 object-contain md:h-11 md:w-11 2xl:h-15 2xl:w-15"
              />
            </div>
          )}

          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[11.5px] font-semibold whitespace-nowrap text-[#2247FF] shadow-[0_2px_6px_rgba(0,0,0,0.15)] md:bottom-5 md:flex md:h-8 md:w-33 md:items-center md:justify-center md:px-0 md:py-0 md:font-(family-name:--font-dm-sans) md:text-[15px] md:leading-7 md:font-medium 2xl:h-10 2xl:w-43 2xl:text-[19.6px]">
            Explore Now &rarr;
          </span>
        </Link>
      ))}
    </HScroll>
  )
}
