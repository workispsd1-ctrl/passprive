'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { CreditCard, Gem, Plus } from 'lucide-react'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCashbackPct, type MerchantCapabilityFields } from '@/lib/cashback'
import { MEMBERSHIP_BADGE } from '@/lib/cashbackBadge'
import { cn } from '@/lib/utils'
import { DetailSection } from './DetailSection'

export type OfferBody = { id: string; main: string; sub?: string | null; logo?: string | null }

const CARD = 'relative flex min-h-36 flex-col rounded-[20px] bg-white p-5 shadow-[0_6px_24px_rgba(0,0,0,0.07)] ring-1 ring-black/[0.03]'

/** app parity: OfferDots */
function Dots({ count, page, onPick }: { count: number; page: number; onPick: (i: number) => void }) {
  if (count <= 1) return null
  return (
    <span className='flex items-center gap-1.5'>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type='button'
          aria-label={`Offer ${i + 1}`}
          onClick={() => onPick(i)}
          className={cn('size-1.5 rounded-full transition-colors', i === page ? 'bg-brand' : 'bg-gray-200 hover:bg-gray-300')}
        />
      ))}
    </span>
  )
}

/** One card that pages through several offers — app parity: OfferPagerCard. */
function PagerCard({
  icon,
  title,
  titleClass,
  items,
  bank = false,
}: {
  icon: React.ReactNode
  title: string
  titleClass: string
  items: OfferBody[]
  bank?: boolean
}) {
  const [page, setPage] = useState(0)
  const railRef = useRef<HTMLDivElement>(null)
  const pick = (i: number) => {
    const rail = railRef.current
    if (rail) rail.scrollTo({ left: i * rail.clientWidth, behavior: 'smooth' })
  }
  return (
    <div className={CARD}>
      <div className='flex items-center justify-between gap-3'>
        <p className={cn('flex items-center gap-2 text-[14px] font-bold tracking-[0.02em] uppercase', titleClass)}>
          {icon} {title}
        </p>
        <Dots count={items.length} page={page} onPick={pick} />
      </div>
      <div
        ref={railRef}
        onScroll={e => setPage(Math.round(e.currentTarget.scrollLeft / (e.currentTarget.clientWidth || 1)))}
        className='scrollbar-hide mt-4 flex flex-1 snap-x snap-mandatory overflow-x-auto'
      >
        {items.map(it => (
          <div key={it.id} className='flex w-full shrink-0 snap-start items-center gap-4'>
            {bank && (
              <span className='relative size-14 shrink-0 overflow-hidden rounded-xl bg-gray-100'>
                {it.logo && <Image src={it.logo} alt='' fill sizes='56px' className='object-contain p-1.5' />}
              </span>
            )}
            <span className='min-w-0'>
              <span className='block truncate text-[22px] leading-tight font-bold text-[#2C2D32]'>{it.main}</span>
              {it.sub && <span className='mt-1 block truncate text-[15px] text-[#6B6B6B]'>{it.sub}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * "Offers for today" — app parity: RestaurantDetails.jsx FigmaOffersForYou:
 * the restaurant's own offers, the member's cashback on the bill (with their
 * plan badge) and bank / card offers, joined by "+" because they stack. Cards
 * stack on phones (as in the app) and sit side by side on desktop.
 */
export function OffersForToday({
  restaurantOffers,
  bankOffers,
  merchant,
  exclusiveLabel = 'Restaurant exclusive',
}: {
  restaurantOffers: OfferBody[]
  bankOffers: OfferBody[]
  merchant: MerchantCapabilityFields
  exclusiveLabel?: string
}) {
  const plan = useUserPlan()
  const pct = getCashbackPct(merchant, plan)

  const cards: { key: string; node: React.ReactNode }[] = []
  if (restaurantOffers.length) {
    cards.push({
      key: 'exclusive',
      node: <PagerCard icon={<Gem className='size-4.5 text-[#F5A623]' />} title={exclusiveLabel} titleClass='text-[#D93D00]' items={restaurantOffers} />,
    })
  }
  if (pct > 0) {
    cards.push({
      key: 'cashback',
      node: (
        <div className={CARD}>
          <Image src={MEMBERSHIP_BADGE[plan]} alt={`Privé ${plan === 'premiere' ? 'Plus' : plan === 'black' ? 'Black' : 'Free'}`} width={102} height={44} className='h-auto w-26' />
          <div className='mt-4'>
            <p className='truncate text-[22px] leading-tight font-bold text-[#2C2D32]'>Get {pct}% cash back</p>
            <p className='mt-1 truncate text-[15px] text-[#6B6B6B]'>credited as PrivéCredits instantly</p>
          </div>
        </div>
      ),
    })
  }
  if (bankOffers.length) {
    cards.push({
      key: 'bank',
      node: <PagerCard icon={<CreditCard className='size-4.5 text-[#7C2D12]' />} title='Bank & card offers' titleClass='text-[#7C2D12]' items={bankOffers} bank />,
    })
  }
  if (!cards.length) return null

  const cols = cards.length === 3 ? 'md:grid-cols-3' : cards.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1 md:max-w-md'

  return (
    <DetailSection id='offers' title='Offers for today'>
      <div className={cn('grid gap-4 md:gap-5', cols)}>
        {cards.map((c, i) => (
          <div key={c.key} className='relative'>
            {c.node}
            {i < cards.length - 1 && (
              // app parity: OfferConnector — the offers add up
              <span
                aria-hidden='true'
                className='absolute -bottom-2 left-1/2 z-10 flex size-6 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-[#6B6B6B] text-white ring-4 ring-white md:top-1/2 md:-right-2.5 md:bottom-auto md:left-auto md:translate-x-1/2 md:-translate-y-1/2'
              >
                <Plus className='size-3.5' strokeWidth={3} />
              </span>
            )}
          </div>
        ))}
      </div>
    </DetailSection>
  )
}
