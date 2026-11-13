'use client'

import Link from 'next/link'
import { getCardChips } from '@/lib/cardChips'
import { CardChips } from '@/components/shared/CardChips'
import Image from 'next/image'
import { HScroll } from './HScroll'
import type { StoreRow } from '@/lib/types/stores'

export function StoresNearYouSection({ stores }: { stores: StoreRow[] }) {
  if (!stores.length) return null
  const items = stores.slice(0, 10)

  return (
    <HScroll title="Shop this weekend">
      {items.map((store) => {
        return (
        <Link
          key={store.id}
          href={`/stores/${store.slug ?? store.id}`}
          className="relative block aspect-420/548 w-80 max-md:w-[60vw] shrink-0 overflow-hidden rounded-[20px] bg-gray-900 [--badge-inset:70px] 2xl:w-105 2xl:[--badge-inset:78px]"
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

          {/* Card badges (cashback art, Promoted, Book Now — app: ShopThisWeekend.jsx CashbackBadge)
              are hidden on these cards. To restore: re-import CardBadgeArt / getCardBadge / useUserPlan / cn,
              render <CardBadgeArt badge={getCardBadge(store, plan)} radius={20} bottomInset="var(--badge-inset)" />
              and push the name/chips down (top-20 2xl:top-24 / top-27 2xl:top-31) when it has cashback art. */}

          <p className="absolute top-4 left-4 text-[15px] font-bold text-white drop-shadow">
            {store.name}
          </p>
          {/* app parity: ShopThisWeekend.jsx CardChips, under the name */}
          <CardChips chips={getCardChips(store)} className="absolute top-11 left-4" />

          {/* DM Sans 500 / 19.6 / 28 — #2247FF on white, radius 19.6 */}
          <span className="absolute bottom-5 left-1/2 flex h-8 w-33 -translate-x-1/2 items-center justify-center rounded-full bg-white font-(family-name:--font-dm-sans) text-[15px] font-medium leading-7 text-[#2247FF] 2xl:h-10 2xl:w-43 2xl:text-[19.6px]">
            Explore Now
          </span>
        </Link>
        )
      })}
    </HScroll>
  )
}
