'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Result = {
  id: string
  name: string
  category: string | null
  location_name: string | null
  city: string | null
  logo_url: string | null
  slug: string | null
  type: 'store' | 'restaurant' | 'tourist_place'
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'restaurant', label: 'Restaurants' },
  { key: 'store', label: 'Stores' },
  { key: 'tourist_place', label: 'Tourist places' },
] as const

const HREF: Record<Result['type'], string> = {
  restaurant: '/dining',
  store: '/stores',
  tourist_place: '/tourist',
}

const RECENTS_KEY = 'passprive:recent-searches'

function loadRecents(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function SearchClient({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [term, setTerm] = useState(initialQuery.trim())
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('all')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [recents, setRecents] = useState<string[]>([])

  useEffect(() => setRecents(loadRecents()), [])

  useEffect(() => {
    if (term.length < 2) return
    let cancelled = false
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(term)}&limit=40`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Result[]) => !cancelled && setResults(rows))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [term])

  function submit(value: string) {
    const v = value.trim()
    setQuery(v)
    setTerm(v)
    if (v.length >= 2) {
      const next = [v, ...loadRecents().filter((r) => r !== v)].slice(0, 8)
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
      } catch {}
      setRecents(next)
      router.replace(`/search?q=${encodeURIComponent(v)}`)
    }
  }

  const shown = tab === 'all' ? results : results.filter((r) => r.type === tab)
  const counts = (key: string) =>
    key === 'all' ? results.length : results.filter((r) => r.type === key).length

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 md:px-8">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(query)
        }}
        className="flex h-12 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 shadow-sm focus-within:border-[#FF6A19]"
      >
        <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search restaurants, stores and places"
          aria-label="Search"
          className="h-full flex-1 bg-transparent text-sm outline-none"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              setQuery('')
              setTerm('')
              setResults([])
            }}
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </form>

      {term.length < 2 ? (
        recents.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Recent searches</p>
            <div className="flex flex-wrap gap-2">
              {recents.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => submit(r)}
                  className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )
      ) : (
        <>
          <div className="mt-5 flex gap-2 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-pressed={tab === t.key}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  tab === t.key
                    ? 'border-[#FF6A19] bg-[#FFF1EA] text-[#FF6A19]'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50',
                )}
              >
                {t.label} ({counts(t.key)})
              </button>
            ))}
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-gray-400">Searching…</p>
          ) : shown.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">No results for &ldquo;{term}&rdquo;</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
              {shown.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <Link
                    href={`${HREF[r.type]}/${r.slug || r.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                      {r.logo_url && (
                        <Image src={r.logo_url} alt="" fill className="object-cover" sizes="48px" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#0D141C]">{r.name}</p>
                      <p className="truncate text-xs text-gray-400">
                        {[r.location_name, r.city].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#FFF1EA] px-2 py-0.5 text-[10px] font-semibold capitalize text-[#FF6A19]">
                      {r.type === 'tourist_place' ? 'Place' : r.type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}
