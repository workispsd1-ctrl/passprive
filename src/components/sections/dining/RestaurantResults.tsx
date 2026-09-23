'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FeedRestaurantCard } from './FeedRestaurantCard'
import type { FeaturedRestaurant } from '@/lib/types/dining'

/**
 * Filtered "All restaurants" list — app parity: DineinHome.jsx main feed
 * (paged, with a "Clear all filters" empty state). Filters live in the URL, so
 * `key={queryString}` on the caller resets this when they change.
 */
export function RestaurantResults({
  initialRows,
  initialHasMore,
  queryString,
}: {
  initialRows: FeaturedRestaurant[]
  initialHasMore: boolean
  queryString: string
}) {
  const [rows, setRows] = useState(initialRows)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)

  async function loadMore() {
    setLoading(true)
    try {
      const params = new URLSearchParams(queryString)
      params.set('offset', String(rows.length))
      const res = await fetch(`/api/restaurants/feed?${params}`)
      if (!res.ok) return
      const data = (await res.json()) as { rows: FeaturedRestaurant[]; hasMore: boolean }
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.id))
        return [...prev, ...data.rows.filter((r) => !seen.has(r.id))]
      })
      setHasMore(data.hasMore)
    } finally {
      setLoading(false)
    }
  }

  if (!rows.length) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center md:px-8">
        <p className="text-base font-semibold text-[#0D141C]">No restaurants match these filters</p>
        <Link
          href="/dining"
          className="mt-4 inline-block rounded-full bg-[#FF6A19] px-5 py-2 text-sm font-semibold text-white"
        >
          Clear all filters
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:px-8 2xl:max-w-394">
      <div className="flex flex-wrap justify-center gap-4 md:justify-start">
        {rows.map((r) => (
          <FeedRestaurantCard key={r.id} r={r} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="rounded-full border border-[#FF6A19] px-6 py-2.5 text-sm font-semibold text-[#FF6A19] transition-colors hover:bg-[#FFF1EA] disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
