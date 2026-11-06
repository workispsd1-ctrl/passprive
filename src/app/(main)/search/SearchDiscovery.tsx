'use client'

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
 * app parity: components/Search/SearchDiscovery.jsx — recent searches, "Are
 * you here?", "Popular spots near you", "Recommended by us" and the "Popular
 * searches" badges, at the app's sizes.
 */

const A = '/assets/search'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className='mb-2.75 px-4 text-[18px] leading-5.75 font-bold text-[#1A1A1A]'>{children}</h2>
}

const distanceLabel = (km: number | null) => (km != null && km > 0 ? `${km.toFixed(1)} km` : '')

function CashbackChip({ item }: { item: SearchItem }) {
  const plan = useUserPlan()
  const pct = getCashbackPct(item.raw, plan)
  if (!pct) return null
  return (
    <span className='flex h-4.5 shrink-0 items-center rounded-2xl bg-[rgba(192,248,200,0.4)] px-1.5 text-[9.5px] leading-3.25 font-semibold text-[#19482C]'>
      {pct}% Cashback
    </span>
  )
}

/** Two rows of clock chips, scrolling sideways together. */
export function RecentSearches({ items, onSelect }: { items: string[]; onSelect: (term: string) => void }) {
  if (!items.length) return null
  const half = Math.ceil(items.length / 2)
  const rows = [items.slice(0, half), items.slice(half)].filter(r => r.length)
  return (
    <section className='mt-6.5'>
      <SectionTitle>Recent searches</SectionTitle>
      <div className='scrollbar-hide overflow-x-auto px-4'>
        <div className='flex w-max flex-col gap-2'>
          {rows.map((row, i) => (
            <div key={i} className='flex gap-2'>
              {row.map(term => (
                <button
                  key={term}
                  type='button'
                  onClick={() => onSelect(term)}
                  className='flex h-7.25 max-w-55 items-center gap-1.5 rounded-full border border-[#E5E5EA] px-3 hover:bg-gray-50'
                >
                  <Clock className='size-3.25 shrink-0 text-[#8E8E93]' strokeWidth={2} />
                  <span className='truncate text-[13px] leading-4.75 font-medium text-[#1A1A1A]'>{term}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** 160-wide card: orange-framed photo with the offer strip, category notch, cashback chip, then name / distance / Pay bill. */
function PayBillCard({ item, onOpen }: { item: SearchItem; onOpen: (item: SearchItem) => void }) {
  const icon = item.type === 'RESTAURANT' ? 'dining' : item.wellness ? 'wellness' : 'shopping'
  return (
    <div className='w-40 shrink-0 rounded-2xl bg-white p-1.5 pb-0 shadow-[0_1px_6px_rgba(0,0,0,0.06)]'>
      <Link href={item.href} onClick={() => onOpen(item)} className='block'>
        <span className='relative block h-37 rounded-xl bg-[#FF4800]'>
          <span className={cn('relative block overflow-hidden rounded-xl bg-white', item.offer ? 'h-32' : 'h-35.75')}>
            {item.image && <Image src={item.image} alt='' fill sizes='160px' className='object-cover' />}
          </span>
          {item.offer && (
            <span className='absolute inset-x-0 bottom-0 flex h-5 items-center justify-center px-2.5 text-center text-[11px] leading-3.75 font-semibold text-white'>
              <span className='truncate'>{item.offer}</span>
            </span>
          )}
          <Image src={`${A}/card-bg.webp`} alt='' width={50} height={47} className='absolute top-0 left-0 z-1 h-11.75 w-12.5' />
          <Image src={`${A}/${icon}.webp`} alt='' width={20} height={22} className='absolute top-0.75 left-1.25 z-2 h-5.5 w-5 object-contain' />
          <span className='absolute top-1.25 right-2 z-3'><CashbackChip item={item} /></span>
        </span>
        <span className='mx-1.5 mt-3 block truncate text-[14px] leading-4.5 font-bold text-[#1A1A1A]'>{item.name}</span>
        <span className='mx-1.5 mt-1 block h-3.5 truncate text-[11px] leading-3.5 text-[#6B7280]'>{distanceLabel(item.distanceKm)}</span>
      </Link>
      {canPayBill(item.raw) ? (
        // app parity: the search card's Pay bill opens the place (handlePayBill → handleResultPress)
        <Link
          href={item.href}
          onClick={() => onOpen(item)}
          className='mx-1.5 mt-1 mb-3 flex h-7.5 items-center justify-center rounded-full bg-[#FF4800] text-[10.5px] leading-3.5 font-semibold text-white hover:bg-brand-dark'
        >
          Pay bill
        </Link>
      ) : (
        <span className='mt-1 mb-3 block h-7.5' />
      )}
    </div>
  )
}

function CardRail({ title, items, onOpen }: { title: string; items: SearchItem[]; onOpen: (item: SearchItem) => void }) {
  if (!items.length) return null
  return (
    <section className='mt-6.5'>
      <SectionTitle>{title}</SectionTitle>
      <div className='scrollbar-hide flex gap-3 overflow-x-auto px-3.75 pt-1.5 pb-3.5'>
        {items.map(item => <PayBillCard key={item.key} item={item} onOpen={onOpen} />)}
      </div>
    </section>
  )
}

/** 95-tall white row: thumb, name + heart, rating pill + distance / area, cashback + offer. */
function SpotRow({ item, onOpen }: { item: SearchItem; onOpen: (item: SearchItem) => void }) {
  const { isSaved, toggle } = useSaved()
  const saved = isSaved(item.id)
  const rating = Number(item.rating) || 0
  return (
    <div className='relative flex h-23.75 gap-2.25 rounded-2xl bg-white pt-1.5 pr-3 pl-1.75 shadow-[0_1px_6px_rgba(0,0,0,0.05)]'>
      <Link href={item.href} onClick={() => onOpen(item)} aria-label={item.name} className='absolute inset-0 rounded-2xl' />
      <span className='relative h-20.5 w-20.75 shrink-0 overflow-hidden rounded-xl bg-[#EBEBEB]'>
        {item.image && <Image src={item.image} alt='' fill sizes='83px' className='object-cover' />}
      </span>
      <span className='min-w-0 flex-1 pt-0.5'>
        <span className='flex items-center justify-between gap-2'>
          <span className='truncate text-[15px] leading-5 font-bold text-[#1A1A1A]'>{item.name}</span>
          <button
            type='button'
            aria-label={saved ? 'Saved' : 'Save'}
            aria-pressed={saved}
            onClick={() => toggle(item.id, item.type === 'RESTAURANT' ? 'RESTAURANT' : 'STORE')}
            className='relative z-1 shrink-0'
          >
            <Heart className={cn('size-5', saved ? 'fill-[#FF4800] text-[#FF4800]' : 'text-[#C9C9CE]')} strokeWidth={1.8} />
          </button>
        </span>
        <span className='mt-1.25 flex items-center gap-2'>
          {rating > 0 && (
            <span className='flex h-4.5 w-9.25 shrink-0 items-center justify-center gap-0.75 rounded-full bg-[#2E9E4F] text-[11px] leading-4 font-bold text-white'>
              <Star className='size-2.5 fill-white' strokeWidth={0} />
              {rating.toFixed(1)}
            </span>
          )}
          <span className='truncate text-[12px] leading-5 font-medium text-[#8E8E93]'>
            {[distanceLabel(item.distanceKm), item.area].filter(Boolean).join('  •  ')}
          </span>
        </span>
        <span className='mt-1.5 flex items-center gap-1.5'>
          <CashbackChip item={item} />
          {item.offer && <span className='truncate text-[12px] leading-5 font-medium text-[#C2410C]'>{item.offer}</span>}
          {item.offerCount > 1 && <span className='shrink-0 text-[12px] leading-5 font-bold text-[#C2410C]'>+ {item.offerCount - 1} offers</span>}
        </span>
      </span>
    </div>
  )
}

/** app parity: AllRestaurantBadges.jsx BADGE_FILTERS — coloured when picked, grey otherwise. */
const BADGES = ['cashback', 'booking', 'instant', 'stamps', 'exclusive'] as const
const BADGE_LABEL: Record<(typeof BADGES)[number], string> = {
  cashback: 'Cashback',
  booking: 'Booking available',
  instant: 'Instant book',
  stamps: 'Collect stamps',
  exclusive: 'Exclusive',
}

export function SearchDiscovery({ nearby, popular, recommended, onOpen }: { nearby: SearchItem[]; popular: SearchItem[]; recommended: SearchItem[]; onOpen: (item: SearchItem) => void }) {
  // the app keeps the pick on screen only (its search list ignores these filters)
  const [badge, setBadge] = useState<string | null>(null)
  return (
    <div>
      <CardRail title='Are you here?' items={nearby} onOpen={onOpen} />
      {popular.length > 0 && (
        <section className='mt-6.5'>
          <SectionTitle>Popular spots near you</SectionTitle>
          <div className='flex flex-col gap-4.5 px-4 pt-0.5 pb-2.5'>
            {popular.map(item => <SpotRow key={item.key} item={item} onOpen={onOpen} />)}
          </div>
        </section>
      )}
      <CardRail title='Recommended by us' items={recommended} onOpen={onOpen} />
      <section className='mt-6.5'>
        <SectionTitle>Popular searches</SectionTitle>
        <div className='scrollbar-hide flex gap-2.25 overflow-x-auto px-3.25 py-3.5'>
          {BADGES.map(key => {
            const on = badge === key
            return (
              <button key={key} type='button' aria-pressed={on} aria-label={BADGE_LABEL[key]} onClick={() => setBadge(on ? null : key)} className='shrink-0'>
                <Image
                  src={`${A}/badge-${key}${on || !badge ? '' : '-gray'}.${on || !badge ? 'webp' : 'png'}`}
                  alt=''
                  width={106}
                  height={120}
                  className='h-30 w-26.5 rounded-2xl'
                />
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
