'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Heart } from 'lucide-react'
import { SaveListSheet } from '@/components/SaveListSheet'
import { CardChips } from '@/components/shared/CardChips'
import { useSaved } from '@/lib/context/SavedContext'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCashbackPct, type MerchantCapabilityFields } from '@/lib/cashback'
import type { CardChipKey } from '@/lib/cardChips'
import { cn, formatDistanceKm } from '@/lib/utils'

/*
 * Cards of Figma "Mall Flow" (1920 frames). Every desktop class is the exact
 * Figma value in design px (`--u`, see unit.ts); `max-lg:` is the phone size.
 */

/** A restaurant or store inside the mall, flattened for the cards. */
export type MallPlace = {
  id: string
  saveType: 'RESTAURANT' | 'STORE'
  href: string
  name: string
  image: string | null
  logo: string | null
  /** best offer's strip text */
  offer: string | null
  /** offers beyond the first */
  more: number
  rating: number
  distance: number | null
  area: string | null
  floor: string | null
  /** cuisines, or the store's category */
  tagline: string | null
  /** every cuisine (restaurants) — the Dining tab's "Cozy Cafés" / "Quick Bites" */
  cuisines: string[]
  costForTwo: number | null
  chips: CardChipKey[]
  caps: MerchantCapabilityFields
  topBrand: boolean
  /** the order it came in — "Sort By: Relevance" */
  rank: number
}

const floorText = (p: MallPlace) => (p.floor ? `${p.floor} floor` : null)
const join = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' • ')
const cost = (p: MallPlace) => (p.costForTwo ? `Rs.${p.costForTwo.toLocaleString('en-IN')} for two` : null)

// ─── Shared bits ─────────────────────────────────────────────────────────

/** Splits "Flat 15% OFF + bank benefits" into a bold head and a regular tail. */
function OfferText({ text }: { text: string }) {
  const i = text.indexOf(' + ')
  if (i === -1) return <span className='font-bold'>{text}</span>
  return (
    <>
      <span className='font-bold'>{text.slice(0, i)}</span>
      <span className='font-medium'>{text.slice(i)}</span>
    </>
  )
}

/** Heart that saves to a list; `outline` is the grey stroke of the "Shop and shine" rows. */
export function SaveHeart({ place, className, iconClassName, outline }: { place: MallPlace; className: string; iconClassName: string; outline?: boolean }) {
  const { isSaved, toggle, setSaved } = useSaved()
  const [open, setOpen] = useState(false)
  const saved = isSaved(place.id)
  return (
    <>
      <button
        type='button'
        aria-label={saved ? 'Edit saved lists' : `Save ${place.name}`}
        aria-pressed={saved}
        onClick={async (e) => {
          e.preventDefault()
          if (!saved && (await toggle(place.id, place.saveType)) === null) return // logged out — login prompt shown
          setOpen(true)
        }}
        className={cn('z-20 transition-transform hover:scale-110', className)}
      >
        <Heart
          className={cn(
            iconClassName,
            saved ? 'fill-[#FF4800] text-[#FF4800]' : outline ? 'fill-transparent text-[#B2B2B2]' : 'fill-black/30 text-[#E5E5E5]',
          )}
          strokeWidth={2.3}
        />
      </button>
      <SaveListSheet
        open={open}
        onClose={() => setOpen(false)}
        entityId={place.id}
        entityType={place.saveType}
        entityName={place.name}
        onSavedChange={(anywhere) => setSaved(place.id, anywhere)}
      />
    </>
  )
}

function RatingPill({ rating, className }: { rating: number; className?: string }) {
  if (!(rating > 0)) return null
  return (
    <span className={cn('flex shrink-0 items-center gap-3 rounded-full bg-[#217C00] font-bold text-white max-lg:h-[22px] max-lg:px-[7px] max-lg:text-[12px]', className)}>
      {rating.toFixed(1)} <span aria-hidden>★</span>
    </span>
  )
}

/** White "4% Cashback" pill with the orange coin — Figma 146×32. */
function CashbackPill({ pct }: { pct: number }) {
  return (
    <span className='absolute top-16 left-11 z-10 flex h-32 items-center gap-7 rounded-full bg-white/77 pr-14 pl-7 max-lg:top-[8px] max-lg:left-[8px] max-lg:h-[26px] max-lg:gap-[4px] max-lg:pr-[8px] max-lg:pl-[3px]'>
      <span aria-hidden className='size-[calc(26*var(--u))] rounded-[calc(6.8*var(--u))] bg-[radial-gradient(circle_at_35%_30%,#FFB27A,#E8521A_60%,#B83A0C)] max-lg:size-[20px] max-lg:rounded-[5px]' />
      <span className='text-[calc(15.52*var(--u))] leading-[calc(22*var(--u))] font-semibold text-[#454040] max-lg:text-[11px] max-lg:leading-[16px]'>{pct}% Cashback</span>
    </span>
  )
}

// ─── Place card: rail 376 wide, grid 509 wide ────────────────────────────

/**
 * Figma "Passion Coffee" / "Nu Zil Spa": photo on an orange frame whose bottom
 * edge is the offer strip, then name, one meta line and the chips. `grid` is
 * the 509-wide "Dining grid" card (cashback pill, two meta lines).
 */
export function PlaceCard({ place, variant = 'rail' }: { place: MallPlace; variant?: 'rail' | 'grid' }) {
  const plan = useUserPlan()
  const grid = variant === 'grid'
  const pct = grid ? getCashbackPct(place.caps, plan) : 0
  const line1 = grid ? join(formatDistanceKm(place.distance), place.area) : join(floorText(place) ?? formatDistanceKm(place.distance), place.tagline)
  const line2 = grid ? join(floorText(place), place.tagline, cost(place)) : null
  const meta = 'truncate font-medium text-[#717171] max-lg:text-[13px] max-lg:leading-[19px]'

  return (
    <div
      className={cn(
        'relative shrink-0 snap-start border border-white bg-white [filter:drop-shadow(0_calc(4*var(--u))_calc(13*var(--u))_rgba(0,0,0,0.12))] max-lg:rounded-[18px] max-lg:p-[8px] max-lg:pb-[12px]',
        grid ? 'w-full rounded-[calc(21.7*var(--u))] px-11 pt-15 pb-18' : 'w-376 rounded-[calc(19.34*var(--u))] px-9 pt-7 pb-16 max-lg:w-[280px]',
      )}
    >
      <Link href={place.href} aria-label={place.name} className='absolute inset-0 z-10' />
      <div className={cn('overflow-hidden bg-[#FF6A30] max-lg:rounded-[14px]', grid ? 'rounded-[calc(17.18*var(--u))]' : 'rounded-[calc(15.31*var(--u))]')}>
        <div
          className={cn(
            'relative overflow-hidden bg-[#EBEBEB] max-lg:rounded-[14px]',
            grid ? 'rounded-[calc(17.21*var(--u))]' : 'rounded-[calc(15.34*var(--u))]',
            place.offer ? (grid ? 'h-282' : 'h-319') : grid ? 'h-310' : 'h-351',
            place.offer ? 'max-lg:h-[180px]' : 'max-lg:h-[200px]',
          )}
        >
          {place.image && <Image src={place.image} alt='' fill sizes={grid ? '(min-width: 1024px) 27vw, 100vw' : '(min-width: 1024px) 20vw, 280px'} className='object-cover' />}
          {pct > 0 && <CashbackPill pct={pct} />}
          <SaveHeart
            place={place}
            className={cn('absolute max-lg:top-[8px] max-lg:right-[8px]', grid ? 'top-10 right-14' : 'top-7 right-9')}
            iconClassName={cn('max-lg:size-[26px]', grid ? 'size-44' : 'size-40')}
          />
        </div>
        {place.offer ? (
          <div className='flex h-29 items-center justify-between gap-12 px-14 text-white max-lg:h-[24px] max-lg:px-[10px]'>
            <span className='truncate text-[calc(16*var(--u))] leading-[calc(20*var(--u))] max-lg:text-[12px] max-lg:leading-[16px]'>
              <OfferText text={place.offer} />
            </span>
            {place.more > 0 && (
              <span className='shrink-0 text-[calc(16*var(--u))] leading-[calc(20*var(--u))] font-bold max-lg:text-[12px]'>
                + {place.more} offer{place.more > 1 ? 's' : ''}
              </span>
            )}
          </div>
        ) : (
          <div className='h-5' />
        )}
      </div>

      <div className={cn('max-lg:px-[6px] max-lg:pt-[8px]', grid ? 'px-10 pt-10' : 'px-16 pt-10')}>
        <div className='flex items-start justify-between gap-12'>
          <p
            className={cn(
              'truncate font-bold text-[#383838] max-lg:text-[16px] max-lg:leading-[24px]',
              grid ? 'text-[calc(22.57*var(--u))] leading-[calc(34*var(--u))]' : 'text-[calc(20.12*var(--u))] leading-[calc(30*var(--u))]',
            )}
          >
            {place.name}
          </p>
          <RatingPill
            rating={place.rating}
            className={grid ? 'mt-3 h-29 px-11 text-[calc(17.63*var(--u))] leading-[calc(25*var(--u))]' : 'mt-2 h-26 px-10 text-[calc(15.71*var(--u))] leading-[calc(22*var(--u))]'}
          />
        </div>
        {line1 && <p className={cn(meta, grid ? 'text-[calc(19.62*var(--u))] leading-[calc(28*var(--u))]' : 'text-[calc(17.48*var(--u))] leading-[calc(25*var(--u))]')}>{line1}</p>}
        {line2 && <p className={cn(meta, 'text-[calc(19.62*var(--u))] leading-[calc(28*var(--u))]')}>{line2}</p>}
        <CardChips
          chips={place.chips}
          height={grid ? 'max(20px, calc(29.63 * var(--u)))' : 'max(20px, calc(26.41 * var(--u)))'}
          className={cn('gap-8 max-lg:mt-[8px]', grid ? 'mt-12' : 'mt-8')}
        />
      </div>
    </div>
  )
}

// ─── "Best offers" — Figma "SuperKicks offer" 509×436 ────────────────────

export function BestOfferCard({ place }: { place: MallPlace }) {
  return (
    <div className='relative h-436 w-509 shrink-0 snap-start overflow-hidden rounded-[calc(16*var(--u))] bg-white shadow-[0_calc(4*var(--u))_calc(13*var(--u))_rgba(0,0,0,0.12)] max-lg:h-[300px] max-lg:w-[300px] max-lg:rounded-[16px]'>
      <Link href={place.href} aria-label={place.name} className='absolute inset-0 z-10' />
      <div className='relative h-310 bg-[#EBEBEB] max-lg:h-[200px]'>
        {place.image && <Image src={place.image} alt='' fill sizes='(min-width: 1024px) 27vw, 300px' className='object-cover' />}
        {place.offer && (
          <p className='absolute inset-x-0 bottom-0 flex h-32 items-center bg-[#FF4901] px-16 text-[calc(16*var(--u))] leading-[calc(18*var(--u))] font-semibold text-white max-lg:h-[28px] max-lg:px-[12px] max-lg:text-[12px]'>
            <span className='truncate'>
              {place.offer}
              {place.more > 0 && ` + ${place.more} more`}
            </span>
          </p>
        )}
        <SaveHeart place={place} className='absolute top-16 right-20 max-lg:top-[10px] max-lg:right-[10px]' iconClassName='size-28 max-lg:size-[24px]' />
      </div>
      <div className='px-20 pt-20 max-lg:px-[14px] max-lg:pt-[12px]'>
        <p className='truncate text-[calc(20*var(--u))] leading-[calc(28*var(--u))] font-bold text-[#322F35] max-lg:text-[16px] max-lg:leading-[24px]'>{place.name}</p>
        <p className='mt-10 truncate text-[calc(14*var(--u))] leading-[calc(20*var(--u))] font-medium text-[#322F35] max-lg:mt-[4px] max-lg:text-[13px] max-lg:leading-[18px]'>
          {join(floorText(place), formatDistanceKm(place.distance), place.area)}
        </p>
      </div>
    </div>
  )
}

// ─── "Discover top brands" — Figma "Nike brand collection" 376×453 ───────

const BRAND_FALLBACK = ['#E03535', '#C8285A', '#7B4FD6', '#E07020', '#1A9C7B', '#2870C8']

export function BrandTile({ place, index }: { place: MallPlace; index: number }) {
  return (
    <Link
      href={place.href}
      className='relative block h-453 w-376 shrink-0 snap-start overflow-hidden rounded-[calc(28.99*var(--u))] border-[calc(1.53*var(--u))] border-white max-lg:h-[300px] max-lg:w-[250px] max-lg:rounded-[20px]'
      style={{ backgroundColor: BRAND_FALLBACK[index % BRAND_FALLBACK.length] }}
    >
      {place.image && <Image src={place.image} alt={place.name} fill sizes='(min-width: 1024px) 20vw, 250px' className='object-cover' />}
      {place.logo && (
        <span className='absolute top-25 right-24 flex h-74 w-75 items-center justify-center overflow-hidden rounded-[calc(16.82*var(--u))] bg-white max-lg:top-[14px] max-lg:right-[14px] max-lg:size-[52px] max-lg:rounded-[12px]'>
          <Image src={place.logo} alt='' width={75} height={74} className='size-full object-contain' />
        </span>
      )}
      <span className='absolute bottom-38 left-1/2 flex h-44 w-192 -translate-x-1/2 items-center justify-center gap-8 rounded-full bg-white text-[calc(21.84*var(--u))] leading-[calc(31*var(--u))] font-medium whitespace-nowrap text-[#2247FF] max-lg:bottom-[16px] max-lg:h-[34px] max-lg:w-[140px] max-lg:text-[15px]'>
        Explore Now <ArrowRight className='size-22 max-lg:size-[16px]' strokeWidth={2.2} />
      </span>
    </Link>
  )
}

// ─── "Shop and shine" — Figma "Shop and shine deals" 776×454 panel ───────

function ShopRow({ place }: { place: MallPlace }) {
  return (
    <li className='relative flex gap-21 max-lg:gap-[12px]'>
      <Link href={place.href} aria-label={place.name} className='absolute inset-0 z-10' />
      <span className='relative h-74 w-75 shrink-0 overflow-hidden rounded-[calc(13.04*var(--u))] bg-[#F4F4F4] max-lg:size-[56px] max-lg:rounded-[10px]'>
        {(place.logo ?? place.image) && <Image src={(place.logo ?? place.image)!} alt='' fill sizes='75px' className='object-cover' />}
      </span>
      <div className='min-w-0 flex-1 pt-2'>
        <p className='truncate pr-48 text-[calc(20*var(--u))] leading-[calc(28*var(--u))] font-bold text-[#322F35] max-lg:pr-[36px] max-lg:text-[15px] max-lg:leading-[22px]'>{place.name}</p>
        <p className='mt-4 truncate text-[calc(16*var(--u))] leading-[calc(20*var(--u))] font-medium text-[#322F35] max-lg:mt-[2px] max-lg:text-[12px] max-lg:leading-[17px]'>
          {join(floorText(place), place.tagline) || join(formatDistanceKm(place.distance), place.area)}
        </p>
        {place.offer && (
          <p className='mt-8 flex items-center justify-between gap-12 text-[calc(14*var(--u))] leading-[calc(18*var(--u))] font-semibold text-[#322F35] max-lg:mt-[4px] max-lg:text-[12px] max-lg:leading-[16px]'>
            <span className='truncate'>+ {place.offer}</span>
            {place.more > 0 && <span className='shrink-0'>+ {place.more} offer{place.more > 1 ? 's' : ''}</span>}
          </p>
        )}
      </div>
      <SaveHeart place={place} outline className='absolute top-0 right-0' iconClassName='size-31 max-lg:size-[24px]' />
    </li>
  )
}

export function ShopPanel({ places }: { places: MallPlace[] }) {
  return (
    <div className='min-w-0 rounded-[calc(16*var(--u))] border border-[#E8E8E8] bg-white p-24 max-lg:rounded-[16px] max-lg:p-[16px]'>
      <p className='text-[calc(16*var(--u))] leading-[calc(24*var(--u))] font-medium text-[#322F35] max-lg:text-[14px] max-lg:leading-[20px]'>Shop from the season’s best deals!</p>
      <ul className='mt-32 flex flex-col gap-46 max-lg:mt-[16px] max-lg:gap-[20px]'>
        {places.map((p) => <ShopRow key={p.id} place={p} />)}
      </ul>
    </div>
  )
}
