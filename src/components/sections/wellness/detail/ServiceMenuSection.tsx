'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ServiceCategory } from '@/lib/types/stores'

function formatDuration(mins: number | null): string | null {
  if (!mins || mins <= 0) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return [h ? `${h} hr` : null, m ? `${m} min` : null].filter(Boolean).join(' ')
}

function formatPrice(price: number | null): string | null {
  const n = Number(price)
  return Number.isFinite(n) && n > 0 ? `MUR ${n.toLocaleString()}` : null
}

/**
 * The store's service catalogue — app parity: the categories/items that
 * ServiceStoreDetails.jsx loads and hands to ServiceSelectionScreen ("Book a
 * Slot"). The website has no slot picker, so it lists them inline instead.
 */
export function ServiceMenuSection({ categories }: { categories: ServiceCategory[] }) {
  const [activeId, setActiveId] = useState(categories[0]?.id)
  if (!categories.length) return null

  const active = categories.find(c => c.id === activeId) ?? categories[0]

  return (
    <section id='services' className='scroll-mt-14 pt-8'>
      <h2 className='mb-4 text-[20px] font-bold text-gray-900'>Services</h2>

      <div className='scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0'>
        {categories.map(c => (
          <button
            key={c.id}
            type='button'
            onClick={() => setActiveId(c.id)}
            className='flex w-20 shrink-0 flex-col items-center gap-1.5 text-center'
          >
            <span
              className={cn(
                'relative flex h-18 w-18 items-center justify-center overflow-hidden rounded-2xl border-2 bg-orange-50 transition-colors',
                c.id === active.id ? 'border-brand' : 'border-transparent',
              )}
            >
              {c.image ? (
                <Image src={c.image} alt={c.title} fill className='object-cover' sizes='72px' />
              ) : (
                <span className='text-[20px] font-bold text-gray-700'>{c.title[0]?.toUpperCase()}</span>
              )}
            </span>
            <span
              className={cn(
                'line-clamp-2 text-[12px] leading-tight',
                c.id === active.id ? 'font-semibold text-gray-900' : 'text-gray-600',
              )}
            >
              {c.title}
            </span>
          </button>
        ))}
      </div>

      <div className='mt-4 rounded-2xl border border-gray-200'>
        <div className='border-b border-gray-100 px-4 py-3'>
          <p className='text-[15px] font-bold text-gray-900'>{active.title}</p>
          {(active.subtitle || formatPrice(active.starting_from)) && (
            <p className='mt-0.5 text-[12px] text-gray-500'>
              {[active.subtitle, formatPrice(active.starting_from) && `Starting from ${formatPrice(active.starting_from)}`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>

        {active.items.length === 0 ? (
          <p className='px-4 py-6 text-center text-[13px] text-gray-400'>Ask the store for this service’s menu.</p>
        ) : (
          <ul className='divide-y divide-gray-100'>
            {active.items.map(item => {
              const duration = formatDuration(item.duration_minutes)
              const price = formatPrice(item.price)
              return (
                <li key={item.id} className='flex items-start justify-between gap-4 px-4 py-3'>
                  <div className='min-w-0'>
                    <p className='text-[14px] font-semibold text-gray-900'>{item.title}</p>
                    {item.description && (
                      <p className='mt-0.5 line-clamp-2 text-[12px] text-gray-500'>{item.description}</p>
                    )}
                    {(duration || item.service_for) && (
                      <p className='mt-1 flex items-center gap-1 text-[11px] text-gray-400'>
                        {duration && <><Clock className='h-3 w-3' /> {duration}</>}
                        {duration && item.service_for && <span>·</span>}
                        {item.service_for && <span className='capitalize'>{item.service_for.toLowerCase()}</span>}
                      </p>
                    )}
                  </div>
                  {price && <p className='shrink-0 text-[14px] font-bold text-gray-900'>{price}</p>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
