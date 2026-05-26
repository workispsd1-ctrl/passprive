'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { ArrowRight, Search, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type Result = {
  id: string
  name: string
  category: string
  location_name: string
  city: string
  logo_url: string | null
  slug: string
  type: 'store' | 'restaurant'
}

export function HeroSearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const router = useRouter()

  const trimmed = query.trim()
  const showResults = isOpen && trimmed.length >= 2 && results.length > 0
  const showEmpty = isOpen && trimmed.length >= 2 && results.length === 0 && !loading
  const showDropdown = showResults || showEmpty

  useEffect(() => { setMounted(true) }, [])


  const syncPos = useCallback(() => {
    if (!containerRef.current || !dropdownRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    dropdownRef.current.style.top = `${r.bottom + 8}px`
    dropdownRef.current.style.left = `${r.left}px`
    dropdownRef.current.style.width = `${r.width}px`
  }, [])

  useEffect(() => {
    if (!showDropdown) return
    syncPos()
    window.addEventListener('scroll', syncPos, true)
    window.addEventListener('resize', syncPos)
    return () => {
      window.removeEventListener('scroll', syncPos, true)
      window.removeEventListener('resize', syncPos)
    }
  }, [showDropdown, syncPos])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (trimmed.length < 2) { setResults([]); setIsOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
        if (res.ok) { setResults(await res.json()); setIsOpen(true) }
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [trimmed])

  useEffect(() => {
    if (isOpen) syncPos()
  }, [isOpen, syncPos])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node
      const insideInput = containerRef.current?.contains(target)
      const insideDropdown = dropdownRef.current?.contains(target)
      if (!insideInput && !insideDropdown) setIsOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') setIsOpen(false)
  }

  function getPath(result: Result) {
    const slug = result.slug || result.id
    return result.type === 'restaurant' ? `/dining/${slug}` : `/stores/${slug}`
  }

  function closeDropdown() {
    setQuery(''); setResults([]); setIsOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (results.length > 0) {
      router.push(getPath(results[0]))
      closeDropdown()
    }
  }

  const stores = results.filter(r => r.type === 'store')
  const restaurants = results.filter(r => r.type === 'restaurant')

  function renderItem(r: Result) {
    return (
      <li key={r.id} className="border-b border-gray-50 last:border-0">
        <Link
          href={getPath(r)}
          onClick={closeDropdown}
          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 text-left transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
            {r.logo_url ? (
              <Image src={r.logo_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
            ) : (
              <span className="text-[11px] font-bold text-gray-400">{r.name[0]}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-gray-900 truncate">{r.name}</p>
            <p className="text-[11px] text-gray-400 truncate">
              {r.category ?? ''}{r.location_name ? ` · ${r.location_name}` : ''}{r.city ? `, ${r.city}` : ''}
            </p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${r.type === 'restaurant' ? 'bg-orange-50 text-orange-500' : 'bg-purple-50 text-purple-500'}`}>
            {r.type === 'restaurant' ? 'Restaurant' : 'Store'}
          </span>
        </Link>
      </li>
    )
  }

  const dropdown = mounted && showDropdown
    ? createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-9999 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-80 overflow-y-auto overscroll-contain"
        >
          {showResults && (
            <>
              {restaurants.length > 0 && (
                <>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Restaurants</span>
                  </div>
                  <ul>{restaurants.map(renderItem)}</ul>
                </>
              )}
              {stores.length > 0 && (
                <>
                  <div className={`px-4 pt-3 pb-1 ${restaurants.length > 0 ? 'border-t border-gray-50' : ''}`}>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Stores</span>
                  </div>
                  <ul>{stores.map(renderItem)}</ul>
                </>
              )}
            </>
          )}
          {showEmpty && (
            <div className="px-4 py-6 text-center">
              <p className="text-[13px] text-gray-400">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </div>,
        document.body,
      )
    : null

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center bg-white rounded-full overflow-hidden md:h-16 h-10 pr-1.5 pl-4 shadow-lg">
          <Search className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search for a restaurant or store"
            aria-label="Search for a restaurant or store"
            className="flex-1 px-3 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-500 sm:placeholder:text-sm placeholder:text-xs font-medium h-full"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear"
              onClick={() => { setQuery(''); setResults([]); setIsOpen(false); inputRef.current?.focus() }}
              className="mr-1 shrink-0 p-1"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
          <button
            type="submit"
            aria-label="Submit search"
            className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <ArrowRight className="w-4 h-4 text-white" aria-hidden="true" />
            }
          </button>
        </div>
      </form>
      {dropdown}
    </div>
  )
}
