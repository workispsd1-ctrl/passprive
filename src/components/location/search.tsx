'use client'

import { useEffect, useState } from 'react'
import type { PlaceResult } from '@/lib/savedLocations'
import { cn } from '@/lib/utils'
import { PinBadge } from './shared'

/** Figma "crosshair": 18px ring, 2px #FF4800, with a centre dot. */
export function CrosshairIcon({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 18 18' fill='none' aria-hidden='true' className={cn('size-18 shrink-0', className)}>
      <circle cx='9' cy='9' r='6.5' stroke='#FF4800' strokeWidth='2' />
      <path d='M9 0.5v3M9 14.5v3M0.5 9h3M14.5 9h3' stroke='#FF4800' strokeWidth='2' strokeLinecap='round' />
      <circle cx='9' cy='9' r='1.5' fill='#FF4800' />
    </svg>
  )
}

export type PlaceSearch = { query: string; setQuery: (q: string) => void; results: PlaceResult[]; loading: boolean }

/** Google suggestions as you type (2+ characters, 280ms debounce) — app parity: SavedLocations typedSuggestions. */
export function usePlaceSearch(near: { lat: number | null; lng: number | null }): PlaceSearch {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [loading, setLoading] = useState(false)
  const { lat, lng } = near

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      const t = setTimeout(() => { setResults([]); setLoading(false) }, 0)
      return () => clearTimeout(t)
    }
    let active = true
    const t = setTimeout(async () => {
      setLoading(true)
      const bias = lat != null && lng != null ? `&lat=${lat}&lng=${lng}` : ''
      const res = await fetch(`/api/places?mode=search&q=${encodeURIComponent(q)}${bias}`).catch(() => null)
      const data = (await res?.json().catch(() => null)) as { places: PlaceResult[] } | null
      if (!active) return
      setResults(data?.places ?? [])
      setLoading(false)
    }, 280)
    return () => { active = false; clearTimeout(t) }
  }, [query, lat, lng])

  return { query, setQuery, results, loading }
}

/**
 * Figma "Address search": one full-width card per place, gap 24 — 52 badge at
 * 28/32, 18/26 bold name and 16/24 address from 104.
 */
export function SearchResults({
  search,
  kmTo,
  onPick,
  className,
}: {
  search: PlaceSearch
  kmTo: (lat: number | null, lng: number | null) => number | null
  onPick: (place: PlaceResult) => void
  className?: string
}) {
  const { results, loading, query } = search
  const empty = !loading && query.trim().length >= 2 && results.length === 0
  return (
    <div className={cn('flex flex-col gap-24 max-lg:gap-12', className)}>
      {results.map(place => (
        <button
          key={place.id}
          type='button'
          onClick={() => onPick(place)}
          className='flex min-h-132 w-full items-start gap-24 rounded-[calc(20*var(--u))] border border-[#E6E0E9] bg-white pt-28 pr-76 pb-40 pl-28 text-left transition-colors hover:border-[#FF4800]/50 hover:bg-[#FFFAF7] max-lg:min-h-0 max-lg:gap-14 max-lg:p-16'
        >
          <span className='mt-4 max-lg:mt-0'><PinBadge km={place.distance_km ?? kmTo(place.latitude, place.longitude)} /></span>
          <span className='min-w-0 flex-1'>
            <span className='block truncate text-[calc(18*var(--u))] leading-26 font-bold text-[#1D1B20] max-lg:text-[16px] max-lg:leading-24'>{place.title}</span>
            {place.address && (
              <span className='mt-14 block truncate text-[calc(16*var(--u))] leading-24 text-[#605D64] max-lg:mt-4 max-lg:line-clamp-2 max-lg:text-[14px] max-lg:leading-20 max-lg:whitespace-normal'>
                {place.address}
              </span>
            )}
          </span>
        </button>
      ))}
      {loading && !results.length && [0, 1, 2].map(i => <div key={i} className='h-132 animate-pulse rounded-[calc(20*var(--u))] bg-[#F6F4F7] max-lg:h-88' />)}
      {empty && <p className='py-24 text-center text-[calc(16*var(--u))] leading-24 text-[#605D64] max-lg:text-[14px]'>No places found. Try another name.</p>}
    </div>
  )
}
