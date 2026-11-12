'use client'

import { useEffect, useRef, useState } from 'react'
import { PinGlyph } from './shared'

/** The bit of the Maps JavaScript API this page uses. */
type LatLng = { lat: () => number; lng: () => number }
type GMap = {
  getCenter: () => LatLng | undefined
  panTo: (p: { lat: number; lng: number }) => void
  setZoom: (z: number) => void
  addListener: (event: string, fn: () => void) => { remove: () => void }
}
type Maps = { Map: new (el: HTMLElement, opts: Record<string, unknown>) => GMap }
type MapsWindow = Window & { google?: { maps?: Maps }; __ppMapsReady?: () => void; gm_authFailure?: () => void }

let loading: Promise<Maps> | null = null

/** Loads the Maps JavaScript API once per page. */
function loadMaps(key: string): Promise<Maps> {
  const w = window as MapsWindow
  if (w.google?.maps?.Map) return Promise.resolve(w.google.maps)
  loading ??= new Promise<Maps>((resolve, reject) => {
    w.__ppMapsReady = () => (w.google?.maps ? resolve(w.google.maps) : reject(new Error('maps')))
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=__ppMapsReady&loading=async`
    s.async = true
    s.onerror = () => { loading = null; reject(new Error('maps')) }
    document.head.appendChild(s)
  })
  return loading
}

/** Mauritius — app parity: AddAddressPinpoint DEFAULT_REGION. */
export const DEFAULT_CENTER = { lat: -20.1609, lng: 57.5012 }

/**
 * Figma "Location map": #E5E9F0, r24, a fixed pin at the centre with the blue
 * "Move the pin to change location" hint above it — app parity:
 * AddAddressPinpoint (drag the map, the pin stays put). Falls back to the
 * illustrated Figma map when Google Maps can't load.
 */
export function PinpointMap({
  center,
  onMove,
}: {
  /** where to fly to — a new object moves the map */
  center: { lat: number; lng: number }
  /** the map came to rest here after a drag */
  onMove: (lat: number, lng: number) => void
}) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<GMap | null>(null)
  const onMoveRef = useRef(onMove)
  const [failed, setFailed] = useState(!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

  useEffect(() => {
    onMoveRef.current = onMove
  }, [onMove])

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key || !el.current) return
    const w = window as MapsWindow
    w.gm_authFailure = () => setFailed(true)
    let idle: { remove: () => void } | undefined
    let alive = true
    loadMaps(key).then(
      maps => {
        if (!alive || !el.current) return
        const m = new maps.Map(el.current, {
          center,
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
        })
        map.current = m
        let first = true
        idle = m.addListener('idle', () => {
          // the first idle is the initial centre — the caller resolved that already
          if (first) { first = false; return }
          const c = m.getCenter()
          if (c) onMoveRef.current(c.lat(), c.lng())
        })
      },
      () => alive && setFailed(true),
    )
    return () => { alive = false; idle?.remove() }
    // the map is created once; later centres pan it below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!map.current) return
    map.current.panTo(center)
    map.current.setZoom(16)
  }, [center])

  return (
    <div className='relative h-full min-h-0 w-full overflow-hidden rounded-[calc(24*var(--u))] bg-[#E5E9F0]'>
      {failed ? <IllustratedMap /> : <div ref={el} className='absolute inset-0' />}

      {/* Figma "Pin and movement hint": hint above, the pin's tip on the map centre */}
      <div className='pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center gap-12'>
        <span className='rounded-[calc(19.2*var(--u))] bg-[rgba(34,71,255,0.8)] px-[calc(14.4*var(--u))] py-[calc(7.2*var(--u))] text-[calc(14*var(--u))] leading-20 font-semibold whitespace-nowrap text-white shadow-[0_calc(4.8*var(--u))_calc(9.6*var(--u))_rgba(0,0,0,0.25)]'>
          Move the pin to change location
        </span>
        <PinGlyph className='h-[calc(37.88*var(--u))] w-[calc(33.35*var(--u))] drop-shadow-sm' />
      </div>
    </div>
  )
}

/** The Figma map illustration: white roads, grey blocks, a park. */
function IllustratedMap() {
  return (
    <div aria-hidden='true' className='absolute inset-0'>
      <div className='absolute top-[calc(-245.31*var(--u))] left-[calc(179.31*var(--u))] w-[calc(1209.6*var(--u))] origin-left rotate-45 border-[calc(32*var(--u))] border-white' />
      <div className='absolute top-[calc(-554*var(--u))] left-[calc(368*var(--u))] w-[calc(1040*var(--u))] origin-left -rotate-30 border-[calc(24*var(--u))] border-white' />
      <div className='absolute top-[calc(266*var(--u))] left-[calc(168*var(--u))] w-[calc(1040*var(--u))] origin-left rotate-10 border-[calc(16*var(--u))] border-white' />
      <div className='absolute top-[calc(-334*var(--u))] left-[calc(668*var(--u))] w-[calc(1529.37*var(--u))] origin-left rotate-[84.37deg] border-[calc(20*var(--u))] border-white' />
      <div className='absolute top-[calc(346*var(--u))] left-[calc(188*var(--u))] h-220 w-180 rounded-[calc(16*var(--u))] bg-[#D1D8E0]' />
      <div className='absolute top-[calc(610*var(--u))] left-[calc(192*var(--u))] h-220 w-528 rounded-[calc(16*var(--u))] bg-[#D1D8E0]' />
      <div className='absolute top-[calc(146*var(--u))] left-[calc(528*var(--u))] flex h-260 w-300 items-center justify-center rounded-[calc(24*var(--u))] bg-[#C1E1C1] text-[calc(14*var(--u))] leading-20 font-semibold text-[#6B8E23]'>
        Park
      </div>
    </div>
  )
}
