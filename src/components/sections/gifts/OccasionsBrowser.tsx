'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Search, Star } from 'lucide-react'
import { EVENT_CATEGORIES } from './constants'
import type { GiftEvent } from '@/lib/types/gifts'

interface Props {
  events: GiftEvent[]
  onSelect: () => void
}

export function OccasionsBrowser({ events, onSelect }: Props) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filtered = events.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className='space-y-6'>
      <div className='relative'>
        <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
        <input
          type='text'
          placeholder='Search by occasion…'
          value={search}
          onChange={e => setSearch(e.target.value)}
          className='w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-[14px] shadow-sm focus:outline-none focus:border-violet-400 focus:ring-3 focus:ring-violet-100'
        />
      </div>

      <div>
        <p className='text-[11px] font-bold tracking-[0.18em] text-gray-400 uppercase mb-3'>Gifting Events</p>
        <div className='flex flex-wrap gap-2'>
          {EVENT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type='button'
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[13px] font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/25'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600'
              }`}
            >
              <span className='text-base'>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 && (
        <div>
          <div className='flex items-center justify-between mb-5'>
            <div className='flex items-center gap-2'>
              <Star className='w-4 h-4 text-violet-500 fill-violet-500' />
              <h2 className='text-[20px] font-black text-gray-900'>Choose an Occasion</h2>
            </div>
            <span className='text-[12px] text-gray-400'>{filtered.length} occasions</span>
          </div>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3'>
            {filtered.map(event => (
              <button
                key={event.id}
                type='button'
                onClick={onSelect}
                className='group relative flex flex-col items-center rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-200'
              >
                <div className='relative w-full aspect-square bg-gradient-to-br from-violet-50 to-fuchsia-50'>
                  {event.image_url ? (
                    <Image
                      src={event.image_url}
                      alt={event.title}
                      fill
                      className='object-contain p-4 group-hover:scale-110 transition-transform duration-300'
                      sizes='180px'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center'>
                      <span className='text-5xl group-hover:scale-110 transition-transform duration-300'>🎁</span>
                    </div>
                  )}
                  <div className='absolute inset-0 bg-violet-600/0 group-hover:bg-violet-600/8 transition-colors duration-200 flex items-center justify-center'>
                    <span className='opacity-0 group-hover:opacity-100 transition-opacity bg-violet-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full'>
                      Select
                    </span>
                  </div>
                </div>
                <div className='w-full px-3 py-2.5 border-t border-gray-50'>
                  <p className='text-[12px] font-semibold text-gray-800 text-center leading-tight'>{event.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
