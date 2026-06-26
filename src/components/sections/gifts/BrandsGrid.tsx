'use client'

import Image from 'next/image'
import { ChevronRight, ArrowRight } from 'lucide-react'
import type { GiftBrand } from '@/lib/types/gifts'

interface Props {
  brands: GiftBrand[]
  onSelect: () => void
}

export function BrandsGrid({ brands, onSelect }: Props) {
  if (brands.length === 0) return null

  return (
    <div>
      <div className='flex items-center justify-between mb-5'>
        <h2 className='text-[20px] font-black text-gray-900'>Gift at These Brands</h2>
        <button
          type='button'
          onClick={onSelect}
          className='flex items-center gap-1 text-[13px] text-violet-600 font-semibold hover:text-violet-700 transition-colors'
        >
          View all <ChevronRight className='w-3.5 h-3.5' />
        </button>
      </div>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
        {brands.slice(0, 8).map(b => (
          <button
            key={b.id}
            type='button'
            onClick={onSelect}
            className='group relative rounded-2xl overflow-hidden border border-gray-100 bg-white hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-200 text-left'
          >
            <div className='relative aspect-3/2 bg-gray-100 overflow-hidden'>
              {b.gifting_card_image_url ?? b.image ? (
                <Image
                  src={b.gifting_card_image_url ?? b.image ?? ''}
                  alt={b.name}
                  fill
                  className='object-cover group-hover:scale-105 transition-transform duration-300'
                  sizes='220px'
                />
              ) : (
                <div className='w-full h-full bg-linear-to-br from-gray-700 to-gray-900 flex items-center justify-center'>
                  <span className='text-white font-bold text-[13px] px-3 text-center'>{b.name}</span>
                </div>
              )}
              <div className='absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent' />
              {b.discount_percentage && b.discount_percentage > 0 && (
                <div className='absolute top-2.5 left-2.5 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full'>
                  {b.discount_percentage}% OFF
                </div>
              )}
              <div className='absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                <ArrowRight className='w-3 h-3 text-violet-600' />
              </div>
            </div>
            <div className='p-3'>
              <p className='text-[13px] font-bold text-gray-900 truncate'>{b.name}</p>
              <p className='text-[11px] text-gray-400 capitalize mt-0.5 flex items-center gap-1'>
                <span className='w-1.5 h-1.5 rounded-full bg-gray-300 inline-block' />
                {b.type}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
