'use client'

import { usePlatformFlags } from '@/lib/context/PlatformFlagsContext'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Heart, Star } from 'lucide-react'
import { canPayBill, getCashbackPct } from '@/lib/cashback'
import { useSaved } from '@/lib/context/SavedContext'
import { useUserPlan } from '@/lib/context/PlanContext'
import { cn } from '@/lib/utils'
import type { SearchItem } from './searchItems'

/*
 * Search discovery — Figma "Search - Website" (desktop) on top of the app's
 * data (components/Search/SearchDiscovery.jsx): recent searches, "Are you
 * here?", "Popular spots near you", "Recommended by us", the typed-query result
 * cards and the "Popular searches" tiles. All sizes are design px on the page's
 * `--u` unit (see components/search/unit.ts); `max-lg:` is the phone layout.
 */

const A = '/assets/search'
/** desktop grids show two rows of three */
const GRID_MAX = 6

type Open = (item: SearchItem) => void

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className='text-[calc(24*var(--u))] leading-[calc(32*var(--u))] font-bold text-[#1D1B20] max-lg:text-[20px] max-lg:leading-[28px]'>{children}</h2>
}

const distanceLabel = (km: number | null) => (km != null && km > 0 ? `${km.toFixed(1)} km` : '')
const metaLabel = (item: SearchItem) =>
  [item.distanceKm != null && item.distanceKm > 0 ? `${item.distanceKm.toFixed(1)}km` : '', item.area].filter(Boolean).join(' • ')
const offerLabel = (item: SearchItem) =>
  item.offer ? `+ ${item.offer}${item.offerCount > 1 ? ` + ${item.offerCount - 1} offers` : ''}` : ''

/** Green "0.5% Cashback" pill: translucent mint on white with an inner highlight. */
function CashbackChip({ item }: { item: SearchItem }) {
  const plan = useUserPlan()
  const pct = getCashbackPct(item.raw, plan)
  if (!pct) return null
  return (
    <span className='inline-flex h-[calc(26.45*var(--u))] w-fit shrink-0 items-center rounded-full bg-[linear-gradient(rgba(192,248,200,0.4),rgba(192,248,200,0.4)),linear-gradient(#fff,#fff)] px-[calc(5.6*var(--u))] text-[calc(12.65*var(--u))] leading-[calc(18*var(--u))] font-semibold text-[#19482C] shadow-[inset_0_calc(4.6*var(--u))_calc(4.6*var(--u))_#ECFBF0] [filter:drop-shadow(calc(2.3*var(--u))_calc(2.3*var(--u))_calc(4.6*var(--u))_rgba(0,0,0,0.2))]'>
      {pct}% Cashback
    </span>
  )
}

/** Card photo: white category notch top-left, optional offer strip or rating pill. */
function Photo({ item, className, offerStrip, rating, sizes }: { item: SearchItem; className: string; offerStrip?: boolean; rating?: boolean; sizes: string }) {
  const icon = item.type === 'RESTAURANT' ? 'dining' : item.wellness ? 'wellness' : 'shopping'
  const score = Number(item.rating) || 0
  return (
    <span className={cn('relative block shrink-0 overflow-hidden rounded-[calc(12*var(--u))] bg-[#EBEBEB]', className)}>
      {item.image && <Image src={item.image} alt='' fill sizes={sizes} className='object-cover' />}
      <Image src={`${A}/card-bg.webp`} alt='' width={73} height={68} className='absolute top-0 left-0 h-[calc(68.4*var(--u))] w-[calc(73.2*var(--u))]' />
      <Image
        src={`${A}/${icon}.webp`}
        alt=''
        width={31}
        height={35}
        className='absolute top-[calc(1.7*var(--u))] left-6 h-[calc(33.6*var(--u))] w-[calc(31.2*var(--u))] object-contain object-left [filter:drop-shadow(0_calc(1.76*var(--u))_calc(1.76*var(--u))_rgba(0,0,0,0.1))]'
      />
      {offerStrip && item.offer && (
        <span className='absolute inset-x-0 bottom-0 flex h-28 items-start justify-center rounded-b-[calc(12*var(--u))] bg-[#FF4901] px-8 pt-5'>
          <span className='truncate text-[calc(12*var(--u))] leading-[calc(18*var(--u))] font-bold text-white'>{item.offer}</span>
        </span>
      )}
      {rating && score > 0 && (
        <span className='absolute right-[calc(6.6*var(--u))] bottom-[calc(6.4*var(--u))] flex h-[calc(21.6*var(--u))] w-[calc(44.4*var(--u))] items-center justify-center gap-[calc(3*var(--u))] rounded-full bg-[#2C9F03] font-(family-name:--font-inter) text-[calc(12.97*var(--u))] leading-[calc(19*var(--u))] font-bold tracking-[calc(0.23*var(--u))] text-white'>
          <Star className='size-[calc(9*var(--u))] fill-white' strokeWidth={0} />
          {score.toFixed(1)}
        </span>
      )}
    </span>
  )
}

/** Pay bill (orange) when the place takes bill payments, otherwise an outlined View — both open the place (app parity). */
function CardAction({ item, onOpen, className }: { item: SearchItem; onOpen: Open; className?: string }) {
  const pay = canPayBill(item.raw)
  return (
    <Link
      href={item.href}
      onClick={() => onOpen(item)}
      className={cn(
        'relative z-1 box-border flex h-48 w-fit shrink-0 items-center justify-center rounded-full border px-16 font-(family-name:--font-be-vietnam-pro) text-[calc(16*var(--u))] leading-[calc(24*var(--u))] font-semibold tracking-[calc(0.15*var(--u))] transition-colors',
        pay ? 'border-[#FF4901] bg-[#FF4901] text-white hover:bg-[#E64200]' : 'border-[#FF4901] bg-white text-[#FF4901] hover:bg-[#FFF3EE]',
        className,
      )}
    >
      {pay ? 'Pay bill' : 'View'}
    </Link>
  )
}

function SaveButton({ item, className }: { item: SearchItem; className: string }) {
  const { isSaved, toggle } = useSaved()
  const saved = isSaved(item.id)
  return (
    <button
      type='button'
      aria-label={saved ? 'Saved' : 'Save'}
      aria-pressed={saved}
      onClick={() => toggle(item.id, item.type === 'RESTAURANT' ? 'RESTAURANT' : 'STORE')}
      className={cn('absolute z-1 flex size-24 items-center justify-center', className)}
    >
      <Heart className={cn('size-24', saved ? 'fill-[#FF4901] text-[#FF4901]' : 'text-[#B2B2B2]')} strokeWidth={2} />
    </button>
  )
}

const CARD = 'relative flex rounded-[calc(18*var(--u))] bg-white p-8 shadow-[0_calc(3*var(--u))_calc(16*var(--u))_rgba(0,0,0,0.07)]'
const NAME = 'block truncate font-bold text-[#1D1B20]'
const META = 'block truncate text-[calc(14*var(--u))] leading-[calc(20*var(--u))] text-[#605D64]'
const OFFER = 'block truncate text-[calc(12*var(--u))] leading-[calc(18*var(--u))] font-medium text-[#48464C]'

function CardLink({ item, onOpen }: { item: SearchItem; onOpen: Open }) {
  return <Link href={item.href} onClick={() => onOpen(item)} aria-label={item.name} className='absolute inset-0 rounded-[calc(18*var(--u))]' />
}

/** 509×236 card ("Are you here?", "Recommended by us"): tall photo with offer strip, name, distance, cashback, Pay bill. */
function PayBillCard({ item, onOpen }: { item: SearchItem; onOpen: Open }) {
  return (
    <div className={cn(CARD, 'h-236 gap-20 max-lg:h-196 max-lg:w-[340px] max-lg:shrink-0')}>
      <CardLink item={item} onOpen={onOpen} />
      <Photo item={item} offerStrip sizes='(min-width: 1024px) 10vw, 140px' className='h-220 w-190 max-lg:h-180 max-lg:w-140' />
      <span className='flex min-w-0 flex-1 flex-col pt-16 pb-16 max-lg:pt-8 max-lg:pb-0'>
        <span className={cn(NAME, 'text-[calc(20*var(--u))] leading-[calc(28*var(--u))]')}>{item.name}</span>
        <span className={cn(META, 'mt-10')}>{distanceLabel(item.distanceKm)}</span>
        <span className='mt-18'><CashbackChip item={item} /></span>
        <CardAction item={item} onOpen={onOpen} className='mt-auto' />
      </span>
    </div>
  )
}

/** 509×160 card ("Popular spots near you"): photo with rating, name + heart, distance • area, cashback, offers. */
function SpotCard({ item, onOpen }: { item: SearchItem; onOpen: Open }) {
  return (
    <div className={cn(CARD, 'h-160 gap-20')}>
      <CardLink item={item} onOpen={onOpen} />
      <Photo item={item} rating sizes='(min-width: 1024px) 7vw, 136px' className='h-144 w-136' />
      <span className='flex min-w-0 flex-1 flex-col pt-8 pr-40'>
        <span className={cn(NAME, 'text-[calc(18*var(--u))] leading-[calc(26*var(--u))]')}>{item.name}</span>
        <span className={cn(META, 'mt-6')}>{metaLabel(item)}</span>
        <span className='mt-14'><CashbackChip item={item} /></span>
        <span className={cn(OFFER, 'mt-[calc(11.55*var(--u))]')}>{offerLabel(item)}</span>
      </span>
      <SaveButton item={item} className='top-16 right-16' />
    </div>
  )
}

/** 776×180 typed-query result: photo with rating, name + heart, distance • area, cashback, offers, Pay bill / View. */
export function ResultCard({ item, onOpen }: { item: SearchItem; onOpen: Open }) {
  return (
    <div className={cn(CARD, 'h-180 gap-24 max-lg:h-auto max-lg:gap-16')}>
      <CardLink item={item} onOpen={onOpen} />
      <Photo item={item} rating sizes='(min-width: 1024px) 8vw, 120px' className='h-164 w-156 max-lg:w-120' />
      <span className='flex min-w-0 flex-1 flex-col pt-14 pr-44 max-lg:pb-8'>
        <span className={cn(NAME, 'text-[calc(20*var(--u))] leading-[calc(28*var(--u))] max-lg:text-[18px] max-lg:leading-[26px]')}>{item.name}</span>
        <span className={cn(META, 'mt-10')}>{metaLabel(item)}</span>
        <span className='mt-22 max-lg:mt-12'><CashbackChip item={item} /></span>
        <span className={cn(OFFER, 'mt-[calc(9.55*var(--u))] lg:max-w-[calc(405*var(--u))]')}>{offerLabel(item)}</span>
        <CardAction item={item} onOpen={onOpen} className='absolute top-112 left-617 max-lg:static max-lg:mt-12' />
      </span>
      <SaveButton item={item} className='top-22 right-20' />
    </div>
  )
}

/** Recent-search chips: clock + term, one wrapping row (sideways scroll on phones). */
export function RecentSearches({ items, onSelect }: { items: string[]; onSelect: (term: string) => void }) {
  if (!items.length) return null
  return (
    <section className='flex flex-col gap-12'>
      <SectionTitle>Recent searches</SectionTitle>
      <div className='scrollbar-hide flex flex-wrap gap-16 py-8 max-lg:-mx-16 max-lg:flex-nowrap max-lg:gap-10 max-lg:overflow-x-auto max-lg:px-16'>
        {items.map(term => (
          <button
            key={term}
            type='button'
            onClick={() => onSelect(term)}
            className='flex h-[calc(37.7*var(--u))] max-w-[calc(320*var(--u))] shrink-0 items-center gap-[calc(7.8*var(--u))] rounded-full border-[calc(1.3*var(--u))] border-[#B0B0B0] bg-[rgba(255,255,255,0.77)] pr-[calc(15.5*var(--u))] pl-[calc(15.6*var(--u))] [filter:drop-shadow(calc(3*var(--u))_calc(3*var(--u))_calc(6*var(--u))_rgba(0,0,0,0.05))] hover:bg-[#F7F7F7] max-lg:max-w-[240px]'
          >
            <Clock className='size-[calc(14.3*var(--u))] shrink-0 text-[#454040]' strokeWidth={2.6} />
            <span className='truncate text-[calc(15.6*var(--u))] leading-[calc(24*var(--u))] font-semibold text-[#454040]'>{term}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

/** Three columns on desktop; a sideways rail on phones. */
function CardGrid({ title, items, onOpen }: { title: string; items: SearchItem[]; onOpen: Open }) {
  if (!items.length) return null
  return (
    <section className='flex flex-col gap-12'>
      <SectionTitle>{title}</SectionTitle>
      <div className='scrollbar-hide grid grid-cols-3 gap-24 py-12 max-lg:-mx-16 max-lg:flex max-lg:gap-16 max-lg:overflow-x-auto max-lg:px-16'>
        {items.slice(0, GRID_MAX).map(item => <PayBillCard key={item.key} item={item} onOpen={onOpen} />)}
      </div>
    </section>
  )
}

/*
 * "Popular searches" tiles: blue gradient, two-line title on the left
 * (DM Sans over Libre Baskerville italic, per-tile sizes from Figma), art on
 * the right. The app's filter pick stays on screen only (its list ignores it).
 */
const TILES = [
  {
    key: 'instant',
    label: 'Instant book',
    top: 'Instant',
    bottom: 'Book',
    topCls: 'text-[calc(27.96*var(--u))] leading-[calc(27*var(--u))] tracking-[calc(-1.48*var(--u))] [text-shadow:0_calc(3.47*var(--u))_calc(3.47*var(--u))_rgba(0,0,0,0.25)]',
    bottomCls: 'mt-[calc(-4.34*var(--u))] text-[calc(30.57*var(--u))] leading-[calc(33*var(--u))] tracking-[calc(-1.55*var(--u))]',
  },
  {
    key: 'cashback',
    label: 'Cashback',
    top: 'Guaranteed',
    bottom: 'Cash Back',
    topCls: 'text-[calc(21.95*var(--u))] leading-[calc(21*var(--u))] tracking-[calc(-1.12*var(--u))] [text-shadow:0_calc(2.62*var(--u))_calc(2.62*var(--u))_rgba(0,0,0,0.25)]',
    bottomCls: 'mt-[calc(0.26*var(--u))] text-[calc(24.27*var(--u))] leading-[calc(26*var(--u))] tracking-[calc(-1.23*var(--u))]',
  },
  {
    key: 'exclusive',
    label: 'Exclusive',
    top: 'Exclusive',
    bottom: 'Only',
    topCls: 'text-[calc(23.28*var(--u))] leading-[calc(23*var(--u))] tracking-[calc(-1.26*var(--u))] [text-shadow:0_calc(2.95*var(--u))_calc(2.95*var(--u))_rgba(0,0,0,0.25)]',
    bottomCls: 'mt-[calc(-1.73*var(--u))] text-[calc(26.02*var(--u))] leading-[calc(28*var(--u))] tracking-[calc(-1.32*var(--u))]',
  },
  {
    key: 'booking',
    label: 'Booking available',
    top: 'Request',
    bottom: 'Booking',
    topCls: 'text-[calc(26.36*var(--u))] leading-[calc(26*var(--u))] tracking-[calc(-1.4*var(--u))] [text-shadow:0_calc(3.27*var(--u))_calc(3.27*var(--u))_rgba(0,0,0,0.25)]',
    bottomCls: 'mt-[calc(-3.76*var(--u))] text-[calc(26.09*var(--u))] leading-[calc(28*var(--u))] tracking-[calc(-1.32*var(--u))]',
  },
  {
    key: 'stamps',
    label: 'Collect stamps',
    top: 'Collect',
    bottom: 'Stamps',
    topCls: 'text-[calc(24.59*var(--u))] leading-[calc(24*var(--u))] tracking-[calc(-1.3*var(--u))] [text-shadow:0_calc(3.05*var(--u))_calc(3.05*var(--u))_rgba(0,0,0,0.25)]',
    bottomCls: 'mt-[calc(-4.16*var(--u))] text-[calc(24.33*var(--u))] leading-[calc(26*var(--u))] tracking-[calc(-1.23*var(--u))]',
  },
] as const

function PopularSearches() {
  const [picked, setPicked] = useState<string | null>(null)
  const { stampsVisible } = usePlatformFlags()
  return (
    <section className='flex flex-col gap-20 max-lg:gap-12'>
      <SectionTitle>Popular searches</SectionTitle>
      <div className={cn('scrollbar-hide grid gap-24 max-lg:-mx-16 max-lg:flex max-lg:gap-12 max-lg:overflow-x-auto max-lg:px-16', stampsVisible ? 'grid-cols-5' : 'grid-cols-4')}>
        {/* "Collect stamps" only while the admin repeat-rewards switch is on */}
        {TILES.filter(t => stampsVisible || t.key !== 'stamps').map(t => {
          const on = picked === t.key
          return (
            <button
              key={t.key}
              type='button'
              aria-pressed={on}
              aria-label={t.label}
              onClick={() => setPicked(on ? null : t.key)}
              className={cn(
                'relative flex h-168 items-center overflow-hidden rounded-[calc(16*var(--u))] bg-[linear-gradient(180deg,#0044FF_0%,#002280_100%)] pl-32 transition-[filter,opacity] max-lg:w-[260px] max-lg:shrink-0 max-lg:h-[148px]',
                picked && !on && 'opacity-60 grayscale',
              )}
            >
              <Image src={`${A}/tile-${t.key}.webp`} alt='' width={380} height={324} className='absolute top-9 right-0 h-150 w-176 max-lg:top-[6px] max-lg:h-[136px] max-lg:w-[160px]' />
              <span className='relative flex flex-col items-center text-center whitespace-nowrap'>
                <span className={cn('font-normal text-[#BFF6FC]', t.topCls)}>{t.top}</span>
                <span className={cn('font-(family-name:--font-libre-baskerville) font-bold text-white italic [text-shadow:0_calc(2.5*var(--u))_calc(2.5*var(--u))_rgba(0,0,0,0.1)]', t.bottomCls)}>
                  {t.bottom}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function SearchDiscovery({ nearby, popular, recommended, onOpen }: { nearby: SearchItem[]; popular: SearchItem[]; recommended: SearchItem[]; onOpen: Open }) {
  return (
    <>
      <CardGrid title='Are you here?' items={nearby} onOpen={onOpen} />
      {popular.length > 0 && (
        <section className='flex flex-col gap-12'>
          <SectionTitle>Popular spots near you</SectionTitle>
          <div className='grid grid-cols-3 gap-24 py-12 max-lg:grid-cols-1 max-lg:gap-16'>
            {popular.slice(0, GRID_MAX).map(item => <SpotCard key={item.key} item={item} onOpen={onOpen} />)}
          </div>
        </section>
      )}
      <CardGrid title='Recommended by us' items={recommended} onOpen={onOpen} />
      <PopularSearches />
    </>
  )
}
