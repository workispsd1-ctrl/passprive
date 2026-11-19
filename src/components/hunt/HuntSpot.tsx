'use client'

import { useState } from 'react'
import { claimSpot, huntInfo, useHuntVersion, visibleSpots } from '@/lib/treasureHunt'

type Spot = ReturnType<typeof visibleSpots>[number]

/** app parity: HuntSpot EXIT — ZoomOut over 220ms before the spot is claimed and goes. */
const EXIT_MS = 220

function SpotButton({ spot, title, icon }: { spot: Spot; title: string; icon: string }) {
  const [leaving, setLeaving] = useState(false)
  return (
    <button
      type='button'
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        if (leaving) return
        setLeaving(true)
        setTimeout(() => claimSpot(spot), EXIT_MS)
      }}
      aria-label={`Hidden ${title} item`}
      className='pp-motion absolute z-50 -mt-[17px] -ml-[17px] flex size-[34px] items-center justify-center transition-[scale,opacity] duration-220 hover:scale-110 data-[leaving=true]:scale-0 data-[leaving=true]:opacity-0'
      data-leaving={leaving}
      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt='' className='size-[18px] object-contain' />
    </button>
  )
}

/**
 * A hidden lemon in a named slot — app parity: components/HuntSpot.jsx. Place it
 * inside a positioned box; each spot sits at its x / y percent of that box.
 */
export function HuntSpot({ slot, part = 0 }: { slot: string; part?: number }) {
  // 0 = server snapshot during hydration — render nothing so client matches SSR
  if (!useHuntVersion()) return null
  const spots = visibleSpots(slot, part)
  if (!spots.length) return null
  const hunt = huntInfo()
  return spots.map(spot => (
    <SpotButton key={spot.id} spot={spot} title={hunt?.title || 'lemon'} icon={hunt?.icon_url || '/assets/refer/lemon.png'} />
  ))
}
