'use client'

import Image from 'next/image'
import type { GiftEvent } from '@/lib/types/gifts'

interface Props {
  event: GiftEvent
  selected: boolean
  onSelect: (event: GiftEvent) => void
}

export function GiftEventCard({ event, selected, onSelect }: Props) {
  return (
    <button
      type='button'
      onClick={() => onSelect(event)}
      className={`shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
        selected
          ? 'border-violet-500 bg-violet-50'
          : 'border-gray-100 bg-white hover:border-violet-200'
      }`}
    >
      <div className='relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100'>
        {event.image_url ? (
          <Image src={event.image_url} alt={event.title} fill className='object-cover' sizes='56px' />
        ) : (
          <div className='w-full h-full bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center'>
            <span className='text-2xl'>🎁</span>
          </div>
        )}
      </div>
      <span className={`text-[11px] font-semibold text-center leading-tight ${selected ? 'text-violet-700' : 'text-gray-700'}`}>
        {event.title}
      </span>
    </button>
  )
}
