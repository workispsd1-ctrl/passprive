'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Flame, Grid2x2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSaved } from '@/lib/context/SavedContext'
import { SaveListSheet } from '@/components/SaveListSheet'

interface Props {
  id: string
  slug: string | null
  name: string
  image: string | null
  /** app parity: getEntityCashbackBadge / getCashbackBadgeArt — null hides the badge */
  cashbackArt: string | null
  offerLabel?: string
  trending: boolean
  /** repeat-rewards / "stamp" mood tag — app parity: RestaurantCard.jsx getTags() */
  stampSheet: boolean
  rating?: number
  ratingCount?: number
  meta?: string
  tagline?: string
}

/** Frame + offer-strip colour — fixed across every card, no per-card variation. */
const FRAME_COLOR = 'rgba(255, 106, 48, 1)'

/** Splits "Flat 15% OFF + bank benefits" into a bold head and a regular tail. */
function OfferText({ text }: { text: string }) {
  const i = text.indexOf(' + ')
  if (i === -1) return <>{text}</>
  return (
    <>
      <span className="font-bold">{text.slice(0, i)}</span>
      <span className="font-normal">{text.slice(i)}</span>
    </>
  )
}

/**
 * Dining restaurant card, restyled to match the home page's `MerchantCard`
 * (coloured frame + offer strip + white info panel, per "Plan your salon
 * visit") instead of the flat DiningRestaurantCard look. Adds the
 * restaurant-specific rating badge and Stamp sheet/Trending tags on top of
 * that shared layout — app parity: DininHome/RestaurantCard.jsx.
 *
 * Not ported: the "Exclusive" tag (app parity: item.subscribed) — the
 * `restaurant_feed` RPC doesn't expose subscription status to anonymous
 * callers, same as the app's own public-data behaviour.
 */
export function DiningMerchantCard({
  id,
  slug,
  name,
  image,
  cashbackArt,
  offerLabel,
  trending,
  stampSheet,
  rating,
  ratingCount,
  meta,
  tagline,
}: Props) {
  const { isSaved, toggle, setSaved } = useSaved()
  const saved = isSaved(id)
  const [sheetOpen, setSheetOpen] = useState(false)
  const href = `/dining/${slug ?? id}`

  async function handleHeart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isSaved(id)) {
      const res = await toggle(id, 'RESTAURANT')
      if (res === null) return // logged out — login prompt shown
    }
    setSheetOpen(true)
  }

  return (
    <div className="group relative w-75 shrink-0 overflow-hidden rounded-[18px] border border-white bg-white font-(family-name:--font-dm-sans) shadow-[0px_4.8px_20.4px_0px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0px_8px_26px_0px_rgba(0,0,0,0.16)] 2xl:w-95">
      <Link
        href={href}
        aria-label={name}
        className="absolute inset-0 z-10 rounded-[18px]"
      />

      <div
        className="relative mx-2 mt-1.75 overflow-hidden rounded-[15px]"
        style={{ backgroundColor: FRAME_COLOR }}
      >
        <div className="relative aspect-87/100 overflow-hidden rounded-[15px]">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
              sizes="361px"
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-gray-200 to-gray-300" />
          )}

          {cashbackArt && (
            <>
              {/* White curved backdrop the badge sits on — app parity:
                  CashbackBadge.jsx's CardBg.webp (736×224), rounded to match
                  the card's own top-left corner. */}
              <div className="pointer-events-none absolute top-0 left-0 aspect-736/224 w-60 overflow-hidden rounded-tl-[15px] 2xl:w-73">
                <Image
                  src="/cashback-badge-backdrop.webp"
                  alt=""
                  fill
                  className="object-cover object-top-left"
                  sizes="240px"
                />
              </div>
              <Image
                src={cashbackArt}
                alt="Cashback"
                width={492}
                height={172}
                className="pointer-events-none absolute left-1.5 top-1.5 w-30 2xl:w-36.25"
                style={{ height: 'auto' }}
              />
            </>
          )}

          <button
            type="button"
            aria-label={saved ? 'Edit saved lists' : 'Save'}
            aria-pressed={saved}
            onClick={handleHeart}
            className={cn(
              'absolute right-2.5 top-2.5 z-20 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] transition-transform hover:scale-110 active:scale-125',
              saved ? 'scale-110 text-[#FF4800]' : 'text-white',
            )}
          >
            <Heart className={cn('h-6 w-6', saved && 'fill-current')} />
          </button>
        </div>

        {offerLabel ? (
          <div className="px-3.5 py-1.5 text-[12px] leading-4 text-white">
            <OfferText text={offerLabel} />
          </div>
        ) : (
          <div className="h-1.25" />
        )}
      </div>

      <div className="px-5.25 pt-2.5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-bold leading-6 text-[#383838]">
            {name}
          </p>
          {!!rating && rating > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-[#2C9F03] px-2 py-0.5 text-[11px] font-bold text-white">
              {rating.toFixed(1)} <span aria-hidden="true">★</span>
              <span className="sr-only">
                {ratingCount ? `(${ratingCount} reviews)` : ''}
              </span>
            </span>
          )}
        </div>
        {meta && (
          <p className="line-clamp-2 text-xs font-medium leading-5 text-[#383838]">
            {meta}
          </p>
        )}
        {tagline && (
          <p className="line-clamp-1 text-xs font-normal leading-5 text-[#878787]">
            {tagline}
          </p>
        )}

        {(stampSheet || trending) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {stampSheet && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E84A00]/8 px-2.5 py-1 text-[11px] font-medium text-[#E84A00]">
                <Grid2x2 className="h-3 w-3" /> Stamp sheet
              </span>
            )}
            {trending && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E84A00]/8 px-2.5 py-1 text-[11px] font-medium text-[#E84A00]">
                <Flame className="h-3 w-3 fill-current" /> Trending
              </span>
            )}
          </div>
        )}
      </div>

      <SaveListSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        entityId={id}
        entityType="RESTAURANT"
        entityName={name}
        onSavedChange={(anywhere) => setSaved(id, anywhere)}
      />
    </div>
  )
}
