'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Search } from 'lucide-react'
import { canPayBill } from '@/lib/cashback'
import { useLocation } from '@/lib/context/LocationContext'
import { compactSearchText, rankResults } from '@/lib/search'
import { cn } from '@/lib/utils'
import type { SearchDataset } from '@/app/api/search/dataset/route'
import { SEARCH_PAGE } from '@/components/search/unit'
import { RecentSearches, ResultCard, SearchDiscovery } from './SearchDiscovery'
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

/** Figma tab slots start at 0 / 136 / 276 / 412 / 548 */
const TAB_SLOT = ['w-136', 'w-140', 'w-136', 'w-136', 'w-136']

/** placeholder hint per tab (Figma: Sneakers on Home, Desserts on Dining) */
const HINT: Record<TabKey, string> = {
  home: 'Sneakers',
  shopping: 'Sneakers',
  wellness: 'Spa',
  dining: 'Desserts',
  tourists: 'Sneakers',
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

  // a failed load shows a retry, never a false "No results found"
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let live = true
    // a retry skips the browser cache, in case it holds a bad response
    fetch('/api/search/dataset', attempt ? { cache: 'reload' } : undefined)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: SearchDataset) => {
        if (!live) return
        if (!d.restaurants?.length && !d.stores?.length) throw new Error('empty dataset')
        setData(d)
      })
      .catch(() => live && setFailed(true))
    return () => { live = false }
  }, [attempt])

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
    <main className={SEARCH_PAGE}>
      <button
        type='button'
        onClick={() => (history.length > 1 ? router.back() : router.push('/'))}
        aria-label='Back'
        className='flex size-24 shrink-0 items-center justify-center text-[#48464C]'
      >
        <ArrowLeft className='size-24' strokeWidth={1.5} />
      </button>

      <div className='flex flex-col gap-28 max-lg:gap-16'>
        <form
          onSubmit={e => {
            e.preventDefault()
            remember(query)
            router.replace(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search')
          }}
          className='flex h-56 items-center gap-16 rounded-full border border-[#CAC5CD] bg-white pr-24 pl-20 focus-within:border-[#8E8A92] max-lg:h-48 max-lg:gap-12 max-lg:pl-16'
        >
          <Search className='size-24 shrink-0 text-[#454040] max-lg:size-20' strokeWidth={1.25} />
          <input
            autoFocus
            type='search'
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search for “${HINT[tab]}” around you`}
            aria-label='Search'
            className='h-full min-w-0 flex-1 bg-transparent text-[calc(16*var(--u))] leading-[calc(24*var(--u))] text-[#48464C] outline-none placeholder:text-[#48464C]'
          />
        </form>

        <div className='scrollbar-hide relative flex h-52 border-b border-[#FF4901] max-lg:-mx-16 max-lg:overflow-x-auto max-lg:px-16' role='tablist'>
          {TABS.map((t, i) => {
            const active = t.key === tab
            return (
              <button
                key={t.key}
                type='button'
                role='tab'
                aria-selected={active}
                disabled={'disabled' in t && t.disabled}
                onClick={() => setTab(t.key)}
                className={cn('flex h-full shrink-0 items-start disabled:cursor-not-allowed max-lg:w-auto max-lg:pr-8', TAB_SLOT[i])}
              >
                <span
                  className={cn(
                    'relative h-full px-16 pt-8 text-[calc(16*var(--u))] leading-[calc(24*var(--u))] whitespace-nowrap text-[#48464C]',
                    active ? 'font-bold' : 'font-medium',
                  )}
                >
                  {t.label}
                  {active && <span className='absolute inset-x-0 -bottom-px h-4 bg-[#FF4901]' />}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {!data && failed ? (
        <div className='flex flex-col items-center gap-16 py-96 text-center'>
          <p className='text-[calc(16*var(--u))] leading-[calc(24*var(--u))] text-[#605D64]'>Couldn’t load search right now.</p>
          <button
            type='button'
            onClick={() => { setFailed(false); setAttempt(a => a + 1) }}
            className='h-48 rounded-full border border-[#FF4901] px-24 text-[calc(16*var(--u))] font-semibold text-[#FF4901] hover:bg-[#FFF3EE]'
          >
            Try again
          </button>
        </div>
      ) : !data ? (
        <div className='flex justify-center py-96'>
          <Loader2 className='size-36 animate-spin text-[#FF4901]' aria-label='Loading' />
        </div>
      ) : (
        <>
          {!q && <RecentSearches items={recents} onSelect={setQuery} />}

          {q && (
            <section aria-label='Search results'>
              {rows.length === 0 ? (
                <p className='text-[calc(16*var(--u))] leading-[calc(24*var(--u))] text-[#605D64]'>No results found.</p>
              ) : (
                <div className='grid grid-cols-2 gap-x-24 gap-y-48 py-12 max-lg:grid-cols-1 max-lg:gap-y-16'>
                  {rows.slice(0, shown).map(item => <ResultCard key={item.key} item={item} onOpen={open} />)}
                </div>
              )}
              {shown < rows.length && <div ref={sentinel} className='h-1' />}
            </section>
          )}

          <SearchDiscovery nearby={q ? [] : nearby} popular={popular} recommended={recommended} onOpen={open} />
        </>
      )}
    </main>
  )
}
