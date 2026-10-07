'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSaved } from '@/lib/context/SavedContext'
import { MerchantCard } from '@/components/sections/home/MerchantCard'
import type { SavedItem } from '@/lib/services/savedItems'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'dining', label: 'Dining' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'stores', label: 'Stores' },
] as const

type TabId = (typeof TABS)[number]['id']

export function SavedClient({ items }: { items: SavedItem[] }) {
  const [tab, setTab] = useState<TabId>('all')
  const { isSaved } = useSaved()

  // The saved-ids context loads client-side; until it has, trust the server
  // list. After that, a card un-hearted here drops out of the list.
  const [loaded, setLoaded] = useState(false)
  if (!loaded && items.some(i => isSaved(i.id))) setLoaded(true)
  const current = loaded ? items.filter(i => isSaved(i.id)) : items

  const counts = Object.fromEntries(TABS.map(t => [t.id, t.id === 'all' ? current.length : current.filter(i => i.section === t.id).length]))
  const visible = tab === 'all' ? current : current.filter(i => i.section === tab)

  return (
    <div className='mx-auto max-w-7xl px-4 py-6 md:px-8'>
      <h1 className='text-[24px] font-bold text-gray-900'>Favourites</h1>
      <p className='mt-1 text-sm text-gray-500'>Your favourite restaurants, salons and stores.</p>

      <div className='scrollbar-hide mt-5 flex gap-2 overflow-x-auto'>
        {TABS.map(t => (
          <button
            key={t.id}
            type='button'
            onClick={() => setTab(t.id)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
              tab === t.id ? 'border-[#FF4800] bg-[#FF4800] text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400',
            )}
          >
            {t.label}
            <span className={cn('ml-1.5 text-xs', tab === t.id ? 'text-white/80' : 'text-gray-400')}>{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className='flex flex-col items-center gap-3 py-20 text-center'>
          <Heart className='h-10 w-10 text-gray-300' />
          <p className='font-semibold text-gray-700'>Nothing saved here yet</p>
          <p className='text-sm text-gray-400'>Tap the heart on any restaurant, salon or store to save it.</p>
          <Link href='/' className='mt-1 rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-black'>Explore</Link>
        </div>
      ) : (
        <div className='mt-6 flex flex-wrap justify-center gap-5 md:justify-start'>
          {visible.map(i => (
            <MerchantCard
              key={i.id}
              href={i.href}
              saveId={i.id}
              saveType={i.type}
              image={i.image}
              name={i.name}
              meta={i.meta ?? undefined}
              tagline={i.tagline ?? undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
