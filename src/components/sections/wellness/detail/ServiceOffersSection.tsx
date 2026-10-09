'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Gem, CreditCard, BadgePercent } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCashbackPct, type MerchantCapabilityFields } from '@/lib/cashback'
import type { ServiceOffer } from '@/lib/types/stores'

type Body = { main: string; sub: string; logo?: string | null }

/** app parity: ServiceStoreDetails.jsx `exclusiveOfferItems` */
function exclusiveBody(o: ServiceOffer): Body {
  const main = o.discount_value
    ? o.discount_type === 'PERCENT'
      ? `Flat ${o.discount_value}% OFF`
      : `Flat MUR ${o.discount_value} OFF`
    : o.title
  return { main, sub: o.description || o.title || '' }
}

/** app parity: OffersForYouSection.jsx `bankOfferBody` */
function bankBody(o: ServiceOffer): Body {
  const bank = o.sponsor_name?.trim() || 'Bank'
  return { main: o.title, sub: o.description || `using ${bank} cards`, logo: o.logo_url }
}

function PagerCard({ icon, title, titleClass, items }: {
  icon: React.ReactNode
  title: string
  titleClass: string
  items: Body[]
}) {
  const [page, setPage] = useState(0)
  const item = items[page]

  return (
    <div className='flex w-72 shrink-0 flex-col rounded-2xl border border-gray-200 bg-white p-4 md:w-auto'>
      <div className='flex items-center justify-between'>
        <div className={cn('flex items-center gap-1.5 text-[13px] font-bold', titleClass)}>
          {icon}
          {title}
        </div>
        {items.length > 1 && (
          <div className='flex items-center gap-1'>
            {items.map((_, i) => (
              <button
                key={i}
                type='button'
                aria-label={`Offer ${i + 1}`}
                onClick={() => setPage(i)}
                className={cn('h-1.5 rounded-full transition-all', i === page ? 'w-4 bg-gray-700' : 'w-1.5 bg-gray-300')}
              />
            ))}
          </div>
        )}
      </div>
      <div className='mt-3 flex items-center gap-3'>
        {item.logo !== undefined && (
          <div className='relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white'>
            {item.logo && <Image src={item.logo} alt='' fill className='object-contain p-1' sizes='36px' />}
          </div>
        )}
        <div className='min-w-0'>
          <p className='truncate text-[15px] font-bold text-gray-900'>{item.main}</p>
          {item.sub && <p className='mt-0.5 truncate text-[12px] text-gray-500'>{item.sub}</p>}
        </div>
      </div>
    </div>
  )
}

interface Props {
  inStoreOffers: ServiceOffer[]
  bankOffers: ServiceOffer[]
  merchant: MerchantCapabilityFields
}

/** app parity: OffersForYouSection.jsx as used by ServiceStoreDetails ("Offers for today"). */
export function ServiceOffersSection({ inStoreOffers, bankOffers, merchant }: Props) {
  const cashbackPct = getCashbackPct(merchant, useUserPlan())
  if (!inStoreOffers.length && !bankOffers.length && cashbackPct <= 0) return null

  return (
    <section id='offers' className='scroll-mt-14 pt-6'>
      <h2 className='mb-4 text-[20px] font-bold text-gray-900'>Offers for today</h2>
      <div className='scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:px-0 xl:grid-cols-3'>
        {inStoreOffers.length > 0 && (
          <PagerCard
            icon={<Gem className='h-4 w-4' />}
            title='Exclusive'
            titleClass='text-brand'
            items={inStoreOffers.map(exclusiveBody)}
          />
        )}
        {cashbackPct > 0 && (
          <div className='flex w-72 shrink-0 flex-col rounded-2xl border border-brand-tint-strong bg-brand-tint p-4 md:w-auto'>
            <div className='flex items-center gap-1.5 text-[13px] font-bold text-brand-dark'>
              <BadgePercent className='h-4 w-4' /> PassPrivé cashback
            </div>
            <p className='mt-3 text-[15px] font-bold text-gray-900'>Get {cashbackPct}% cash back</p>
            <p className='mt-0.5 text-[12px] text-gray-500'>credited as PrivéCredits instantly</p>
          </div>
        )}
        {bankOffers.length > 0 && (
          <PagerCard
            icon={<CreditCard className='h-4 w-4' />}
            title='Bank offers'
            titleClass='text-[#7C2D12]'
            items={bankOffers.map(bankBody)}
          />
        )}
      </div>
    </section>
  )
}
