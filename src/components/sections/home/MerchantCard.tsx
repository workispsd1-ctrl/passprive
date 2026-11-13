'use client'

import { useState } from 'react'
import { CardChips } from '@/components/shared/CardChips'
import type { CardChipKey } from '@/lib/cardChips'
import Link from 'next/link'
import Image from 'next/image'
import { CardBadgeArt } from '@/components/shared/CardBadgeArt'
import type { CardBadge } from '@/lib/cashback'
import { Heart, Flame, Gem, Grid2x2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSaved } from '@/lib/context/SavedContext'
import { SaveListSheet } from '@/components/SaveListSheet'
import type { SavedEntityType } from '@/lib/services/savedEntities'

export type MerchantCardTag = {
  label: string
  /** app parity: CardChips.jsx / getTags() icon keys */
  icon?: 'trending' | 'exclusive' | 'stamp'
}

const TAG_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  trending: Flame,
  exclusive: Gem,
  stamp: Grid2x2,
}

interface Props {
  href: string
  image: string | null
  name: string
  /** e.g. "5.3km · Louis Pasteur" */
  meta?: string
  tagline?: string
  /** entity id + type for the favourite (heart) toggle */
  saveId?: string
  saveType?: SavedEntityType
  /**
   * Corner badge — app parity: CashbackBadge.jsx via `getCardBadge`, computed
   * by the caller from the merchant's capabilities and the viewer's plan.
   * `null`/omitted hides it.
   */
  cardBadge?: CardBadge | null
  /** bottom strip inside the frame, e.g. "Flat 15% OFF + bank benefits" */
  offerLabel?: string
  /** small green pill on the image (used by salon cards) */
  badge?: string
  /** app parity: CardChips.jsx tag pills — "Sale is live", "Trending", "Exclusive" */
  tags?: MerchantCardTag[]
  /** app parity: CardChips.jsx chip artwork (Recommended, Best value…), drawn before the tags */
  chips?: CardChipKey[]
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
 * Home carousel card, matched to the PassPrivé app's "In the limelight" card
 * (`components/Home/InTheLimelight.jsx`): an orange frame around the image with
 * an orange offer strip, then a white info panel.
 */
export function MerchantCard({
  href,
  image,
  name,
  meta,
  tagline,
  saveId,
  saveType,
  cardBadge,
  offerLabel,
  badge,
  tags,
  chips,
}: Props) {
  const { isSaved, toggle, setSaved } = useSaved()
  const saved = saveId ? isSaved(saveId) : false
  const [sheetOpen, setSheetOpen] = useState(false)

  async function handleHeart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!saveId || !saveType) return
    // add to the default list first (so the heart fills), then open the sheet
    if (!isSaved(saveId)) {
      const res = await toggle(saveId, saveType)
      if (res === null) return // logged out — login prompt shown
    }
    setSheetOpen(true)
  }

  return (
    <div className="group relative w-75 max-md:w-[60vw] shrink-0 overflow-hidden rounded-[18px] border border-white bg-white font-(family-name:--font-dm-sans) shadow-[0px_4.8px_20.4px_0px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0px_8px_26px_0px_rgba(0,0,0,0.16)] 2xl:w-95">
      {/* full-card click target — kept as a sibling so the heart button isn't
          nested inside an <a> (invalid + swallows the click) */}
      <Link
        href={href}
        aria-label={name}
        className="absolute inset-0 z-10 rounded-[18px]"
      />

      {/* coloured frame */}
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

          <CardBadgeArt badge={cardBadge} />

          {badge && (
            <span className="absolute left-2 top-10 rounded-md bg-[#159D57] px-1.5 py-0.5 text-[9px] font-bold text-white">
              {badge}
            </span>
          )}

          <button
            type="button"
            aria-label={saved ? 'Edit saved lists' : 'Save'}
            aria-pressed={saved}
            onClick={handleHeart}
            className={cn(
              'absolute right-2.5 top-2.5 z-20 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] transition-transform hover:scale-110 active:scale-125',
              saved ? 'scale-110 text-brand' : 'text-white',
            )}
          >
            <Heart className={cn('h-6 w-6', saved && 'fill-current')} />
          </button>
        </div>

        {/* offer strip — shows the orange frame; a thin bar when there's no offer */}
        {offerLabel ? (
          <div className="px-3.5 py-1.5 text-[12px] leading-4 text-white 2xl:text-[13px] min-[120rem]:py-2 min-[120rem]:text-[16px] min-[120rem]:leading-5">
            <OfferText text={offerLabel} />
          </div>
        ) : (
          <div className="h-1.25" />
        )}
      </div>

      <div className="px-5.25 pt-2.5 pb-3">
        <p className="truncate text-sm font-bold leading-6 text-[#383838] 2xl:text-base min-[120rem]:text-[20px] min-[120rem]:leading-7">
          {name}
        </p>
        {meta && (
          <p className="line-clamp-2 text-xs font-medium leading-5 text-[#383838] 2xl:text-[13px] min-[120rem]:text-[16px] min-[120rem]:leading-6">
            {meta}
          </p>
        )}
        {tagline && (
          <p className="line-clamp-1 text-xs font-normal leading-5 text-[#878787] 2xl:text-[13px] min-[120rem]:text-[16px] min-[120rem]:leading-6">
            {tagline}
          </p>
        )}
        {((tags && tags.length > 0) || (chips && chips.length > 0)) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {chips && <CardChips chips={chips} />}
            {tags?.map((tag) => {
              const Icon = tag.icon ? TAG_ICONS[tag.icon] : null
              return (
                <span
                  key={tag.label}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-dark/8 px-2.5 py-1 text-[11px] font-medium text-brand-dark min-[120rem]:text-[14px]"
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  {tag.label}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {saveId && saveType && (
        <SaveListSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          entityId={saveId}
          entityType={saveType}
          entityName={name}
          onSavedChange={(anywhere) => setSaved(saveId, anywhere)}
        />
      )}
    </div>
  )
}
