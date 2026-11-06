'use client'

import { useMemo, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Gem, Heart } from 'lucide-react'
import { useLocation } from '@/lib/context/LocationContext'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCardBadge, getCashbackPct } from '@/lib/cashback'
import { cn, formatDistanceKm, haversineKm } from '@/lib/utils'
import { HScroll } from '@/components/sections/home/HScroll'
import { MerchantCard } from '@/components/sections/home/MerchantCard'
import { useSaveMerchant } from '@/components/shared/detail/MerchantActions'
import type { StoreRow } from '@/lib/types/stores'
import { storeCardTags } from '@/lib/storeBadges'
import { getCardChips } from '@/lib/cardChips'
import { CardChips } from '@/components/shared/CardChips'

const MAX_CARDS = 12

type WithDist = StoreRow & { dist: number | null }

/** The first offer's strip text — app parity: ServiceStoreDetails.jsx `exclusiveOfferItems`. */
function offerLabel(s: StoreRow) {
  const offer = s.store_offers?.[0]
  if (!offer) return undefined
  if (!offer.discount_value) return offer.badge_text ?? undefined
  return String(offer.offer_type ?? '').toLowerCase().startsWith('percent')
    ? `Flat ${offer.discount_value}% OFF`
    : `Flat MUR ${offer.discount_value} OFF`
}

function Rail({ title, stores }: { title: string; stores: WithDist[] }) {
  const plan = useUserPlan()
  if (!stores.length) return null

  return (
    <HScroll title={title}>
      {stores.map(s => (
          <MerchantCard
            key={s.id}
            href={`/wellness/${s.slug ?? s.id}`}
            saveId={s.id}
            saveType='STORE'
            image={s.cover_image}
            name={s.name}
            meta={[s.dist != null ? formatDistanceKm(s.dist) : null, s.location_name ?? s.city].filter(Boolean).join(' • ') || undefined}
            tagline={[s.category, s.subcategory].filter(Boolean).join(', ') || undefined}
            offerLabel={offerLabel(s)}
            cardBadge={getCardBadge(s, plan)}
            chips={getCardChips(s, 3)}
            tags={storeCardTags(s)}
          />
      ))}
    </HScroll>
  )
}

/** Highlight tag — 26 tall, #FFF1EB, 12/16 Medium #FF4800. */
function WideTag({ icon: Icon, label }: { icon?: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className='inline-flex h-[calc(26*var(--u))] items-center gap-[calc(5*var(--u))] rounded-full bg-[#fff1eb] px-[calc(12*var(--u))] text-[calc(12*var(--u))] leading-[calc(16*var(--u))] font-medium whitespace-nowrap text-[#ff4800]'>
      {Icon && <Icon className='size-[calc(12*var(--u))]' />}
      {label}
    </span>
  )
}

/** Figma draws the top "Stamp sheet" pill without an icon and "Exclusive" with the gem. */
const TAG_ICON: Record<string, React.ComponentType<{ className?: string }> | undefined> = { exclusive: Gem, stamp: undefined, trending: undefined }

const GLASS = 'flex items-center rounded-full bg-white/86 text-[calc(12*var(--u))] leading-[calc(18*var(--u))] font-medium text-[#454040] whitespace-nowrap'

/** Recommended salon — Figma: 10px-padded card, 250-tall photo, offer strip, then the details. */
function WideCard({ store }: { store: WithDist }) {
  const plan = useUserPlan()
  const saver = useSaveMerchant(store.id, 'STORE')
  const label = offerLabel(store)
  const extra = (store.store_offers?.length ?? 0) - 1
  const pct = getCardBadge(store, plan)?.arts.length ? getCashbackPct(store, plan) : 0
  const meta = [store.dist != null ? formatDistanceKm(store.dist) : null, store.location_name ?? store.city].filter(Boolean).join(' • ')
  const tagline = [store.category, store.subcategory].filter(Boolean).join(', ')
  // app parity: the detail page's rails draw StoresCard, whose tags are getTags()
  const tags = storeCardTags(store)
  return (
    <div className='group relative w-full shrink-0 snap-start rounded-[calc(18*var(--u))] bg-white p-[calc(10*var(--u))] shadow-[0_calc(4*var(--u))_calc(24*var(--u))_rgba(0,0,0,0.05)]'>
      <Link href={`/wellness/${store.slug ?? store.id}`} aria-label={store.name} className='absolute inset-0 z-10' />
      <div className={cn('relative h-[calc(250*var(--u))] overflow-hidden bg-gray-200', label ? 'rounded-t-[calc(12*var(--u))]' : 'rounded-[calc(12*var(--u))]')}>
        {store.cover_image && <Image src={store.cover_image} alt={store.name} fill sizes='40vw' className='object-cover' />}
        <div className='absolute inset-x-0 top-0 flex items-center gap-[calc(8*var(--u))] p-[calc(16*var(--u))]'>
          {pct > 0 && (
            <span className={cn(GLASS, 'gap-[calc(5*var(--u))] px-[calc(10*var(--u))] py-[calc(5*var(--u))]')}>
              <Image src='/assets/deals/deal-coin.png' alt='' width={21} height={21} className='size-[calc(21*var(--u))]' />
              {pct}% Cashback
            </span>
          )}
          <button
            type='button'
            aria-label={saver.saved ? 'Edit saved lists' : 'Save'}
            aria-pressed={saver.saved}
            onClick={saver.onSave}
            className='relative z-20 ml-auto flex size-[calc(40*var(--u))] items-center justify-center rounded-[calc(20*var(--u))] bg-[rgba(217,217,217,0.1)] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]'
          >
            <Heart className={cn('size-[calc(22*var(--u))]', saver.saved && 'fill-brand text-brand')} strokeWidth={1.4} />
          </button>
        </div>
      </div>
      {label && (
        <div className='flex items-start justify-between gap-[calc(8*var(--u))] rounded-b-[calc(12*var(--u))] bg-[#ff6a30] px-[calc(16*var(--u))] py-[calc(9*var(--u))] text-white'>
          <span className='truncate text-[calc(12*var(--u))] leading-[calc(18*var(--u))] font-medium'>{label}</span>
          {extra > 0 && <span className='shrink-0 text-[calc(12*var(--u))] leading-[calc(16*var(--u))] font-bold'>+ {extra} offer{extra > 1 ? 's' : ''}</span>}
        </div>
      )}
      <div className='flex items-center justify-between gap-[calc(12*var(--u))] px-[calc(14*var(--u))] pt-[calc(18*var(--u))] pb-[calc(12*var(--u))]'>
        <div className='flex min-w-0 flex-1 flex-col gap-[calc(5*var(--u))]'>
          <p className='truncate text-[calc(18*var(--u))] leading-[calc(26*var(--u))] font-bold text-[#383838]'>{store.name}</p>
          {meta && <p className='truncate text-[calc(14*var(--u))] leading-[calc(20*var(--u))] font-medium text-[#717171]'>{meta}</p>}
          {tagline && <p className='truncate text-[calc(14*var(--u))] leading-[calc(20*var(--u))] font-medium text-[#717171]'>{tagline}</p>}
          <CardChips chips={getCardChips(store, 3)} height='calc(21*var(--u))' className='mt-[calc(3*var(--u))] gap-[calc(6*var(--u))]' />
        </div>
        {tags.length > 0 && (
          <div className='flex shrink-0 flex-col items-end gap-[calc(6*var(--u))]'>
            {tags.slice(0, 1).map(t => <WideTag key={t.label} icon={TAG_ICON[t.icon ?? '']} label={t.label} />)}
            {tags.length > 1 && (
              <div className='flex gap-[calc(6*var(--u))]'>
                {tags.slice(1).map(t => <WideTag key={t.label} icon={TAG_ICON[t.icon ?? '']} label={t.label} />)}
              </div>
            )}
          </div>
        )}
      </div>
      {saver.sheet(store.name)}
    </div>
  )
}

/** One card at a time — heading 18/26, 20 above the card; arrows page through the rest. */
function WideRail({ title, stores }: { title: string; stores: WithDist[] }) {
  const ref = useRef<HTMLDivElement>(null)
  if (!stores.length) return null
  const page = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth, behavior: 'smooth' })
  const arrow = 'flex size-[calc(32*var(--u))] items-center justify-center rounded-full border border-[#e4e4e4] bg-white text-[#424144] hover:bg-gray-50'
  return (
    <section className='flex min-w-0 flex-1 flex-col gap-[calc(20*var(--u))]'>
      <div className='flex items-center justify-between'>
        <h2 className='text-[calc(18*var(--u))] leading-[calc(26*var(--u))] font-bold text-[#2c2d32]'>{title}</h2>
        {stores.length > 1 && (
          <div className='flex gap-[calc(8*var(--u))]'>
            <button type='button' aria-label={`Previous in ${title}`} onClick={() => page(-1)} className={arrow}><ChevronLeft className='size-[calc(16*var(--u))]' /></button>
            <button type='button' aria-label={`Next in ${title}`} onClick={() => page(1)} className={arrow}><ChevronRight className='size-[calc(16*var(--u))]' /></button>
          </div>
        )}
      </div>
      {/* the scroller clips, so it carries room for the cards' shadow */}
      <div ref={ref} className='scrollbar-hide -m-[calc(24*var(--u))] flex snap-x snap-mandatory gap-[calc(48*var(--u))] overflow-x-auto p-[calc(24*var(--u))] [scroll-padding:calc(24*var(--u))]'>
        {stores.map(s => <WideCard key={s.id} store={s} />)}
      </div>
    </section>
  )
}

type RailProps = {
  stores: StoreRow[]
  currentId: string
  category: string | null
  subcategory: string | null
}

/**
 * app parity: ServiceStoreDetails.jsx `exploreMoreSalons` (same category, then
 * same subcategory, then the rest — each by distance) and `nearbySalons`
 * (purely by distance), both excluding the current store.
 */
function useStoreRails({ stores, currentId, category, subcategory }: RailProps) {
  const { location } = useLocation()
  const { lat, lng } = location

  return useMemo(() => {
    const cat = (category ?? '').trim().toLowerCase()
    const sub = (subcategory ?? '').trim().toLowerCase()
    const matches = (a: string, b: string) => !!a && !!b && (a === b || a.includes(b) || b.includes(a))
    const rank = (s: StoreRow) =>
      matches(cat, (s.category ?? '').trim().toLowerCase())
        ? 0
        : matches(sub, (s.subcategory ?? '').trim().toLowerCase())
          ? 1
          : 2

    const pool: WithDist[] = stores
      .filter(s => s.id !== currentId)
      .map(s => ({
        ...s,
        dist: lat != null && lng != null && s.lat != null && s.lng != null ? haversineKm(lat, lng, s.lat, s.lng) : null,
      }))
    const byDist = (a: WithDist, b: WithDist) => (a.dist ?? Infinity) - (b.dist ?? Infinity)

    return {
      explore: [...pool].sort((a, b) => rank(a) - rank(b) || byDist(a, b)).slice(0, MAX_CARDS),
      nearby: [...pool].sort(byDist).slice(0, MAX_CARDS),
    }
  }, [stores, currentId, category, subcategory, lat, lng])
}

/** Phones. */
export function ServiceStoreRails(props: RailProps & { className?: string }) {
  const { explore, nearby } = useStoreRails(props)
  return (
    <div className={cn('mt-4', props.className)}>
      <Rail title='Explore more services' stores={explore} />
      <Rail title='Nearby services' stores={nearby} />
    </div>
  )
}

/** Desktop: Explore nearby salons — the two lists side by side, 32 apart, 40 under the sections. */
export function ServiceStoreColumns(props: RailProps) {
  const { explore, nearby } = useStoreRails(props)
  if (!explore.length && !nearby.length) return null
  return (
    <div className='mt-[calc(40*var(--u))] hidden gap-[calc(32*var(--u))] pb-[calc(71*var(--u))] font-(family-name:--font-dm-sans) md:flex'>
      <WideRail title='Explore more salons' stores={explore} />
      <WideRail title='Nearby stores' stores={nearby} />
    </div>
  )
}
