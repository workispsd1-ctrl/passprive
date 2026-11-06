'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Search } from 'lucide-react'
import { canPayBill } from '@/lib/cashback'
import { useLocation } from '@/lib/context/LocationContext'
import { compactSearchText, rankResults } from '@/lib/search'
import { cn } from '@/lib/utils'
import type { SearchDataset } from '@/app/api/search/dataset/route'
import { RecentSearches, SearchDiscovery } from './SearchDiscovery'
import { restaurantItem, searchFields, storeItem, type SearchItem } from './searchItems'

/*
 * Global search — app parity: screens/GlobalSearchScreen.jsx. Every
 * restaurant and store is loaded once and ranked on the device-side as you
 * type (typo-tolerant); the tabs scope it to shopping, wellness or dining.
 */

const TABS = [
  { key: 'home', label: 'Home' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'wellness', label: 'Wellness' },
  { key: 'dining', label: 'Dining' },
  { key: 'tourists', label: 'Tourists', disabled: true },
] as const
type TabKey = (typeof TABS)[number]['key']

const RECENTS_KEY = 'passprive:recent-searches'
const ARE_YOU_HERE_RADIUS_KM = 1
const PAGE = 30

function loadRecents(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]')
    return Array.isArray(list) ? list.slice(0, 12) : []
  } catch {
    return []
  }
}

/** 74-tall bordered row: square photo, name, "area, city". */
function ResultRow({ item, onOpen }: { item: SearchItem; onOpen: (item: SearchItem) => void }) {
  return (
    <Link
      href={item.href}
      onClick={() => onOpen(item)}
      className='mx-4 mb-2.5 flex h-18.5 items-center overflow-hidden rounded-2xl border border-[#E5E5EA] bg-white transition-colors hover:bg-gray-50'
    >
      <span className='relative size-18.5 shrink-0 bg-[#EBEBEB]'>
        {item.image && <Image src={item.image} alt='' fill sizes='74px' className='object-cover' />}
      </span>
      <span className='min-w-0 flex-1 px-3'>
        <span className='mb-0.5 block truncate text-[15px] font-semibold text-black'>{item.name}</span>
        <span className='block truncate text-[13px] text-[#605D64]'>{item.area || '—'}</span>
      </span>
    </Link>
  )
}

export function SearchClient({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const { location } = useLocation()
  const coords = useMemo(() => (location.lat != null && location.lng != null ? { lat: location.lat, lng: location.lng } : null), [location.lat, location.lng])

  const [query, setQuery] = useState(initialQuery)
  const [tab, setTab] = useState<TabKey>('home')
  const [data, setData] = useState<SearchDataset | null>(null)
  // only drawn once the data has loaded, so never part of the server HTML
  const [recents, setRecents] = useState<string[]>(() => (typeof window === 'undefined' ? [] : loadRecents()))
  const [paging, setPaging] = useState({ key: '', n: PAGE })
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let live = true
    fetch('/api/search/dataset')
      .then(r => (r.ok ? r.json() : { restaurants: [], stores: [] }))
      .then((d: SearchDataset) => live && setData(d))
      .catch(() => live && setData({ restaurants: [], stores: [] }))
    return () => { live = false }
  }, [])

  function remember(term: string) {
    const v = term.trim()
    if (!v) return
    const next = [v, ...loadRecents().filter(x => x !== v)].slice(0, 12)
    try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)) } catch {}
    setRecents(next)
  }

  const { restaurants, stores, fields } = useMemo(() => {
    const sources = new Map()
    const r = (data?.restaurants ?? []).map(x => { const it = restaurantItem(x, coords); sources.set(it.key, x); return it })
    const s = (data?.stores ?? []).map(x => { const it = storeItem(x, coords); sources.set(it.key, x); return it })
    return { restaurants: r, stores: s, fields: searchFields(sources) }
  }, [data, coords])

  // app parity: storeScope — the Shopping tab drops wellness stores, Wellness keeps only them
  const scopedStores = useMemo(
    () => (tab === 'wellness' ? stores.filter(s => s.wellness) : tab === 'shopping' ? stores.filter(s => !s.wellness) : stores),
    [stores, tab],
  )

  const deferred = useDeferredValue(query)
  const q = compactSearchText(deferred)

  const rows = useMemo(() => {
    if (!q) return []
    if (tab === 'dining') return rankResults(restaurants, q, fields).map(x => x.item)
    const storeHits = rankResults(scopedStores, q, fields)
    if (tab !== 'home') return storeHits.map(x => x.item)
    // Home: restaurants and stores in one list by score, then rating, then name
    return [...rankResults(restaurants, q, fields), ...storeHits]
      .sort((a, b) => b.score - a.score || (Number(b.item.rating) || 0) - (Number(a.item.rating) || 0) || a.item.name.localeCompare(b.item.name))
      .map(x => x.item)
  }, [q, tab, restaurants, scopedStores, fields])

  // a new query or tab starts again from the first page
  const pageKey = `${q}|${tab}`
  const shown = paging.key === pageKey ? paging.n : PAGE
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setPaging(p => ({ key: pageKey, n: (p.key === pageKey ? p.n : PAGE) + PAGE })), { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [rows.length, pageKey])

  // discovery — app parity: nearbyPayBill / popularNearby / recommended, from restaurants + the tab's stores
  const pool = useMemo(() => [...restaurants, ...scopedStores], [restaurants, scopedStores])
  const nearby = useMemo(
    () => pool.filter(i => canPayBill(i.raw) && i.distanceKm != null && i.distanceKm < ARE_YOU_HERE_RADIUS_KM).sort((a, b) => a.distanceKm! - b.distanceKm!).slice(0, 10),
    [pool],
  )
  const popular = useMemo(() => pool.filter(i => Number(i.rating) > 0).sort((a, b) => Number(b.rating) - Number(a.rating)).slice(0, 10), [pool])
  const recommended = useMemo(() => pool.filter(i => i.merchantType === 'preferred' || i.advertised).slice(0, 10), [pool])

  function open(item: SearchItem) {
    remember(item.name)
  }

  return (
    <main className='mx-auto min-h-screen max-w-3xl bg-white pb-6 font-(family-name:--font-dm-sans)'>
      <div className='sticky top-0 z-20 bg-white'>
        <div className='flex items-center gap-3 px-4 pt-2 pb-3'>
          <button type='button' onClick={() => (history.length > 1 ? router.back() : router.push('/'))} aria-label='Back' className='flex size-5 shrink-0 items-center justify-center text-black'>
            <ArrowLeft className='size-5' />
          </button>
          <form
            onSubmit={e => {
              e.preventDefault()
              remember(query)
              router.replace(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search')
            }}
            className='flex h-12 flex-1 items-center gap-2.5 rounded-full border border-[#E5E5EA] bg-white px-4 focus-within:border-[#FF4800]/50'
          >
            <Search className='size-4.5 shrink-0 text-[#8E8E93]' />
            <input
              autoFocus
              type='search'
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Search for “Sneakers” around you'
              aria-label='Search'
              className='h-full min-w-0 flex-1 bg-transparent text-[15px] text-[#1A1A1A] outline-none placeholder:text-[#8E8E93]'
            />
          </form>
        </div>
        <div className='mb-2 flex border-b border-[#EFEFEF] px-4' role='tablist'>
          {TABS.map(t => {
            const active = t.key === tab
            return (
              <button
                key={t.key}
                type='button'
                role='tab'
                aria-selected={active}
                disabled={'disabled' in t && t.disabled}
                onClick={() => setTab(t.key)}
                className='flex flex-1 flex-col items-center disabled:cursor-not-allowed disabled:opacity-60'
              >
                <span className={cn('pb-2 text-[13px] leading-4.5', active ? 'font-bold text-[#FF4800]' : 'font-medium text-[#605D64]')}>{t.label}</span>
                <span className={cn('h-0.5 self-stretch rounded-full', active ? 'bg-[#FF4800]' : 'bg-transparent')} />
              </button>
            )
          })}
        </div>
      </div>

      {!data ? (
        <div className='flex justify-center py-24'>
          <Loader2 className='size-9 animate-spin text-[#FF4800]' aria-label='Loading' />
        </div>
      ) : (
        <>
          {!q && <RecentSearches items={recents} onSelect={setQuery} />}

          {q && (
            <>
              {tab !== 'home' && (
                <h2 className='mx-4 mt-3.5 mb-2 text-[16px] font-semibold text-black'>{tab === 'dining' ? 'Dining' : 'Stores'}</h2>
              )}
              {rows.length === 0 ? (
                <p className='mx-4 mt-5.5 text-[14px] text-[#605D64]'>No results found.</p>
              ) : (
                rows.slice(0, shown).map(item => <ResultRow key={item.key} item={item} onOpen={open} />)
              )}
              {shown < rows.length && <div ref={sentinel} className='h-1' />}
            </>
          )}

          <SearchDiscovery nearby={q ? [] : nearby} popular={popular} recommended={recommended} onOpen={open} />
        </>
      )}
    </main>
  )
}
