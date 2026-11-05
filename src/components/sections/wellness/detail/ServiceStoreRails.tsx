'use client'

import { useMemo, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Flame, Gem, Grid2x2, Heart } from 'lucide-react'
import { useLocation } from '@/lib/context/LocationContext'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCardBadge } from '@/lib/cashback'
import { cn, formatDistanceKm, haversineKm } from '@/lib/utils'
import { HScroll } from '@/components/sections/home/HScroll'
import { MerchantCard } from '@/components/sections/home/MerchantCard'
import { Section } from '@/components/sections/dining/RestaurantDesktopSections'
import { t, tMin } from '@/components/sections/dining/designUnit'
import { CardBadgeArt } from '@/components/shared/CardBadgeArt'
import { useSaveMerchant } from '@/components/shared/detail/MerchantActions'
import type { StoreRow } from '@/lib/types/stores'

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
          />
      ))}
    </HScroll>
  )
}

function WideTag({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string }) {
  return (
    <span className='inline-flex items-center rounded-full bg-[#fff1eb] font-medium whitespace-nowrap text-[#ff6a30]' style={{ height: tMin(24, 20), padding: `0 ${tMin(10, 7)}`, gap: tMin(4, 3), fontSize: tMin(12, 10) }}>
      <Icon style={{ width: tMin(12, 10), height: tMin(12, 10) }} />
      {label}
    </span>
  )
}

/** A landscape store card: photo, offer strip, then details with the tags on the right. */
function WideCard({ store, stampSheet }: { store: WithDist; stampSheet: boolean }) {
  const plan = useUserPlan()
  const saver = useSaveMerchant(store.id, 'STORE')
  const label = offerLabel(store)
  const extra = (store.store_offers?.length ?? 0) - 1
  const meta = [store.dist != null ? formatDistanceKm(store.dist) : null, store.location_name ?? store.city].filter(Boolean).join(' • ')
  const tagline = [store.category, store.subcategory].filter(Boolean).join(', ')
  const exclusive = String(store.merchant_type ?? '').toLowerCase() === 'preferred'
  return (
    <div className='group relative w-full shrink-0 snap-start overflow-hidden bg-white' style={{ borderRadius: t(24), padding: tMin(10, 7) }}>
      <Link href={`/wellness/${store.slug ?? store.id}`} aria-label={store.name} className='absolute inset-0 z-10' />
      <div className='relative overflow-hidden bg-[#ff6a30]' style={{ borderRadius: t(16) }}>
        <div className='relative aspect-746/250 overflow-hidden' style={{ borderRadius: t(16) }}>
          {store.cover_image ? (
            <Image src={store.cover_image} alt={store.name} fill sizes='(min-width: 1024px) 40vw, 90vw' className='object-cover' />
          ) : (
            <div className='absolute inset-0 bg-linear-to-br from-gray-200 to-gray-300' />
          )}
          <CardBadgeArt badge={getCardBadge(store, plan)} />
          <button
            type='button'
            aria-label={saver.saved ? 'Edit saved lists' : 'Save'}
            aria-pressed={saver.saved}
            onClick={saver.onSave}
            className='absolute top-2.5 right-2.5 z-20 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] transition-transform hover:scale-110'
          >
            <Heart className={cn('size-6', saver.saved && 'fill-brand text-brand')} />
          </button>
        </div>
        {label ? (
          <div className='flex items-center justify-between text-white' style={{ padding: `${tMin(8, 5)} ${tMin(16, 10)}`, gap: 8, fontSize: tMin(13, 11) }}>
            <span className='truncate font-medium'>{label}</span>
            {extra > 0 && <span className='shrink-0 font-semibold'>+ {extra} offer{extra > 1 ? 's' : ''}</span>}
          </div>
        ) : (
          <div className='h-1.25' />
        )}
      </div>
      <div className='flex items-end justify-between' style={{ padding: `${tMin(14, 9)} ${tMin(14, 9)} ${tMin(8, 5)}`, gap: 12 }}>
        <div className='min-w-0'>
          <p className='truncate font-bold text-[#2c2d32]' style={{ fontSize: tMin(19, 14) }}>{store.name}</p>
          {meta && <p className='truncate font-medium text-[#5b5a5a]' style={{ marginTop: t(4), fontSize: tMin(14, 12) }}>{meta}</p>}
          {tagline && <p className='truncate text-[#878787]' style={{ marginTop: t(2), fontSize: tMin(14, 12) }}>{tagline}</p>}
        </div>
        {(stampSheet || store.is_promoted || exclusive) && (
          <div className='flex shrink-0 flex-wrap justify-end' style={{ maxWidth: '55%', gap: tMin(8, 5) }}>
            {stampSheet && <WideTag icon={Grid2x2} label='Stamp sheet' />}
            {store.is_promoted && <WideTag icon={Flame} label='Trending' />}
            {exclusive && <WideTag icon={Gem} label='Exclusive' />}
          </div>
        )}
      </div>
      {saver.sheet(store.name)}
    </div>
  )
}

/** One card at a time, with arrows to page through the rest. */
function WideRail({ title, stores, stampIds }: { title: string; stores: WithDist[]; stampIds: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  if (!stores.length) return null
  const page = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth, behavior: 'smooth' })
  const arrow = { width: tMin(32, 26), height: tMin(32, 26) }
  return (
    <Section id={`rail-${title}`} title={title} top={44} gap={20} className='relative min-w-0'>
      {stores.length > 1 && (
        <div className='absolute top-0 right-0 flex' style={{ gap: tMin(8, 6) }}>
          <button type='button' aria-label={`Previous in ${title}`} onClick={() => page(-1)} className='flex items-center justify-center rounded-full border border-[#e4e4e4] bg-white text-[#424144] hover:bg-gray-50' style={arrow}><ChevronLeft className='size-4' /></button>
          <button type='button' aria-label={`Next in ${title}`} onClick={() => page(1)} className='flex items-center justify-center rounded-full border border-[#e4e4e4] bg-white text-[#424144] hover:bg-gray-50' style={arrow}><ChevronRight className='size-4' /></button>
        </div>
      )}
      <div className='drop-shadow-[0_0_20px_rgba(0,0,0,0.08)]'>
        <div ref={ref} className='scrollbar-hide flex snap-x snap-mandatory overflow-x-auto' style={{ borderRadius: t(24) }}>
          {stores.map(s => <WideCard key={s.id} store={s} stampSheet={stampIds.includes(s.id)} />)}
        </div>
      </div>
    </Section>
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

/** Desktop: the same two lists, side by side. */
export function ServiceStoreColumns({ stampIds, ...props }: RailProps & { stampIds: string[] }) {
  const { explore, nearby } = useStoreRails(props)
  return (
    <div className='hidden font-(family-name:--font-dm-sans) md:block lg:grid lg:grid-cols-2 lg:gap-x-[calc(30*var(--u))]' style={{ paddingBottom: t(70) }}>
      <WideRail title='Explore more salons' stores={explore} stampIds={stampIds} />
      <WideRail title='Nearby stores' stores={nearby} stampIds={stampIds} />
    </div>
  )
}
