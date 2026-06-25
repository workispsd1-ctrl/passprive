'use client'

import Image from 'next/image'
import type { GiftBrand } from '@/lib/types/gifts'

interface Props {
  brand: GiftBrand
  selected: boolean
  onSelect: (brand: GiftBrand) => void
}

export function GiftBrandCard({ brand, selected, onSelect }: Props) {
  const image = brand.gifting_card_image_url ?? brand.image

  return (
    <button
      type='button'
      onClick={() => onSelect(brand)}
      className={`relative flex flex-col rounded-2xl overflow-hidden border-2 transition-all ${
        selected ? 'border-violet-500 shadow-md' : 'border-gray-100 hover:border-violet-200'
      }`}
    >
      <div className='relative w-full aspect-[3/2] bg-gray-100'>
        {image ? (
          <Image src={image} alt={brand.name} fill className='object-cover' sizes='200px' />
        ) : (
          <div className='w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center'>
            <span className='text-white font-bold text-[13px] px-2 text-center'>{brand.name}</span>
          </div>
        )}
        {brand.discount_percentage && brand.discount_percentage > 0 && (
          <span className='absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full'>
            {brand.discount_percentage}% off
          </span>
        )}
      </div>
      <div className='p-2.5 bg-white'>
        <p className='text-[12px] font-semibold text-gray-900 truncate'>{brand.name}</p>
        <p className='text-[10px] text-gray-400 mt-0.5 capitalize'>{brand.type}</p>
      </div>
      {selected && (
        <div className='absolute inset-0 border-2 border-violet-500 rounded-2xl pointer-events-none' />
      )}
    </button>
  )
}
