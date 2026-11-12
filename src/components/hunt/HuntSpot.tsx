'use client'

import { claimSpot, huntInfo, useHuntVersion, visibleSpots } from '@/lib/treasureHunt'

/**
 * A hidden lemon in a named slot — app parity: components/HuntSpot.jsx. Place it
 * inside a positioned box; each spot sits at its x / y percent of that box.
 */
export function HuntSpot({ slot, part = 0 }: { slot: string; part?: number }) {
  useHuntVersion()
  const spots = visibleSpots(slot, part)
  if (!spots.length) return null
  const hunt = huntInfo()
  return spots.map(spot => (
    <button
      key={spot.id}
      type='button'
      onClick={e => { e.preventDefault(); e.stopPropagation(); claimSpot(spot) }}
      aria-label={`Hidden ${hunt?.title || 'lemon'} item`}
      className='absolute z-50 -mt-[17px] -ml-[17px] flex size-[34px] items-center justify-center transition-transform hover:scale-110'
      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={hunt?.icon_url || '/assets/refer/lemon.png'} alt='' className='size-[18px] object-contain' />
    </button>
  ))
}
