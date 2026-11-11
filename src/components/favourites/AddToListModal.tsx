'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Dialog } from '@base-ui/react/dialog'
import { Heart, Search, X } from 'lucide-react'
import { useSaved } from '@/lib/context/SavedContext'
import type { SearchDataset } from '@/app/api/search/dataset/route'
import type { Venue } from '@/lib/services/hotlists'
import { cn } from '@/lib/utils'
import { FAV_UNIT } from './unit'

type Option = { id: string; type: 'RESTAURANT' | 'STORE'; name: string; image: string | null; subtitle: string }

// the search dataset is the same for every list on the page — fetch it once
let datasetPromise: Promise<Option[]> | null = null
function loadOptions(): Promise<Option[]> {
  datasetPromise ??= fetch('/api/search/dataset')
    .then(r => (r.ok ? (r.json() as Promise<SearchDataset>) : Promise.reject()))
    .then(d => {
      const rests: Option[] = d.restaurants.map(r => ({
        id: String(r.id),
        type: 'RESTAURANT',
        name: r.name,
        image: r.cover_image,
        subtitle: (r.cuisines ?? []).slice(0, 2).join(' · ') || [r.area, r.city].filter(Boolean).join(', '),
      }))
      const stores: Option[] = d.stores.map(s => ({
        id: String(s.id),
        type: 'STORE',
        name: s.name,
        image: s.cover_image ?? s.logo_url,
        subtitle: s.category ?? [s.location_name, s.city].filter(Boolean).join(', '),
      }))
      // interleave so suggestions mix dining + stores (each already city-first, then rating)
      const out: Option[] = []
      for (let i = 0; i < Math.max(rests.length, stores.length); i++) {
        if (rests[i]) out.push(rests[i])
        if (stores[i]) out.push(stores[i])
      }
      return out
    })
    .catch(err => {
      datasetPromise = null
      throw err
    })
  return datasetPromise
}

const SUGGESTION_COUNT = 20
const RESULT_LIMIT = 40

/**
 * "Add to List" — search restaurants / stores and heart them into this list.
 * Selections are staged; Done saves them, Cancel discards.
 */
export function AddToListModal({
  open,
  onClose,
  listId,
  existing,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  listId: string
  existing: Venue[]
  onSaved: () => void
}) {
  const { setSaved } = useSaved()
  const [options, setOptions] = useState<Option[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<Map<string, Option['type']>>(new Map())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // reset the staged selection to what's in the list each time it opens
  const [wasOpen, setWasOpen] = useState(false)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setPicked(new Map(existing.map(v => [v.id, v.type])))
      setQuery('')
      setError(null)
    }
  }

  useEffect(() => {
    if (!open || options) return
    let live = true
    loadOptions()
      .then(o => live && setOptions(o))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [open, options])

  const rows = useMemo(() => {
    if (!options) return []
    const q = query.trim().toLowerCase()
    if (!q) {
      // what's already in the list first, then suggestions
      const inList = existing.map<Option>(v => ({ id: v.id, type: v.type, name: v.name, image: v.image, subtitle: v.category ?? '' }))
      const ids = new Set(inList.map(o => o.id))
      return [...inList, ...options.filter(o => !ids.has(o.id)).slice(0, SUGGESTION_COUNT)]
    }
    return options.filter(o => o.name.toLowerCase().includes(q) || o.subtitle.toLowerCase().includes(q)).slice(0, RESULT_LIMIT)
  }, [options, query, existing])

  function toggle(o: Option) {
    setPicked(prev => {
      const next = new Map(prev)
      if (next.has(o.id)) next.delete(o.id)
      else next.set(o.id, o.type)
      return next
    })
  }

  async function done() {
    const before = new Set(existing.map(v => v.id))
    const add = [...picked].filter(([id]) => !before.has(id)).map(([id, type]) => ({ id, type }))
    const remove = [...before].filter(id => !picked.has(id))
    if (!add.length && !remove.length) return onClose()

    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/saves/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add, remove }),
      })
      if (!res.ok) throw new Error()
      const { savedAnywhere = {} } = (await res.json()) as { savedAnywhere?: Record<string, boolean> }
      Object.entries(savedAnywhere).forEach(([id, on]) => setSaved(id, on))
      onSaved()
      onClose()
    } catch {
      setError('Could not update the list. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  // Figma "Add to List - Desktop Modal": backdrop rgba(0,0,0,.4); 720 × 702, radius 24
  return (
    <Dialog.Root open={open} onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className='fixed inset-0 z-50 bg-black/40 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0' />
        <Dialog.Popup
          className={cn(
            FAV_UNIT,
            'fixed top-1/2 left-1/2 z-50 flex h-702 max-h-[calc(100dvh-32px)] w-720 max-w-[calc(100vw-32px)] -translate-1/2 flex-col overflow-hidden rounded-[calc(24*var(--u))] bg-white font-(family-name:--font-dm-sans) shadow-[0_calc(4*var(--u))_calc(12*var(--u))_rgba(0,0,0,0.08)] outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          )}
        >
          {/* Header: padding 24, 24/31 title, 32 close */}
          <div className='flex h-80 shrink-0 items-center justify-between p-24 max-lg:h-64 max-lg:p-16'>
            <Dialog.Title className='text-[calc(24*var(--u))] leading-31 font-bold text-[#2C2D32] max-lg:text-[20px] max-lg:leading-26'>Add to List</Dialog.Title>
            <Dialog.Close aria-label='Close' className='flex size-32 items-center justify-center text-[#2C2D32] hover:text-[#FF4800]'>
              <X className='size-32 max-lg:size-26' strokeWidth={1.6} />
            </Dialog.Close>
          </div>

          {/* Search: 48 tall, padding 12, gap 10, 1px #DCDCDC, pill */}
          <div className='shrink-0 px-24 pb-24 max-lg:px-16 max-lg:pb-16'>
            <label className='flex h-48 items-center gap-10 rounded-full border border-[#DCDCDC] p-12 focus-within:border-[#FF4800] max-lg:h-44'>
              <Search className='size-24 shrink-0 text-[#454040] max-lg:size-20' strokeWidth={2} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder='Search restaurants, cafes...'
                className='min-w-0 flex-1 bg-transparent text-[calc(15*var(--u))] leading-20 text-[#2C2D32] outline-none placeholder:text-[#595B61]'
              />
            </label>
          </div>

          {/* Suggestions: 14/18 uppercase label, 68-tall rows */}
          <div className='flex min-h-0 flex-1 flex-col gap-4 px-24 pb-24 max-lg:px-16 max-lg:pb-16'>
            <p className='text-[calc(14*var(--u))] leading-18 font-bold text-[#595B61] uppercase max-lg:text-[12px] max-lg:leading-16'>
              {query.trim() ? 'Results' : 'Suggestions'}
            </p>
            <div className='min-h-0 flex-1 overflow-y-auto'>
              {!options ? (
                failed ? (
                  <p className='py-40 text-center text-[calc(15*var(--u))] text-[#595B61]'>Couldn&apos;t load places. Please try again.</p>
                ) : (
                  <div className='flex flex-col gap-2' aria-busy='true'>
                    {Array.from({ length: 6 }, (_, i) => (
                      <div key={i} className='flex h-68 items-center gap-12 border-b border-[#EBEBEB]'>
                        <div className='size-48 animate-pulse rounded-[calc(12*var(--u))] bg-[#F1F1F1]' />
                        <div className='h-14 w-200 animate-pulse rounded-full bg-[#F1F1F1]' />
                      </div>
                    ))}
                  </div>
                )
              ) : rows.length === 0 ? (
                <p className='py-40 text-center text-[calc(15*var(--u))] text-[#595B61]'>No places match “{query.trim()}”.</p>
              ) : (
                <ul className='flex flex-col gap-2'>
                  {rows.map(o => {
                    const on = picked.has(o.id)
                    return (
                      <li key={o.id} className='border-b border-[#EBEBEB]'>
                        <button
                          type='button'
                          onClick={() => toggle(o)}
                          aria-pressed={on}
                          className='flex h-68 w-full items-center gap-12 py-10 text-left max-lg:h-60'
                        >
                          <span className='relative size-48 shrink-0 overflow-hidden rounded-[calc(12*var(--u))] bg-[#F1F1F1] max-lg:size-40'>
                            {o.image && <Image src={o.image} alt='' fill sizes='48px' className='object-cover' />}
                          </span>
                          <span className='flex min-w-0 flex-1 flex-col gap-2'>
                            <span className='truncate text-[calc(15*var(--u))] leading-20 font-bold text-[#2C2D32]'>{o.name}</span>
                            {o.subtitle && <span className='truncate text-[calc(12*var(--u))] leading-16 text-[#595B61]'>{o.subtitle}</span>}
                          </span>
                          <Heart
                            className={cn(
                              'size-[calc(31.44*var(--u))] shrink-0 transition-transform max-lg:size-24',
                              on ? 'scale-105 fill-[#FF4800] text-[#FF4800]' : 'text-[#595B61]',
                            )}
                            strokeWidth={2}
                          />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Footer: padding 16/24, gap 12, 1px #EBEBEB on top; 148 / 126 × 54 buttons */}
          <div className='shrink-0 border-t border-[#EBEBEB] px-24 py-16 max-lg:px-16 max-lg:py-12'>
            {error && <p className='mb-8 text-[calc(13*var(--u))] text-[#FF3B30]'>{error}</p>}
            <div className='flex justify-end gap-12'>
              <button
                type='button'
                onClick={onClose}
                className='flex h-54 w-148 items-center justify-center rounded-full border border-[#FF4800] text-[calc(16*var(--u))] leading-21 font-semibold tracking-[-0.02em] text-[#FF4800] hover:bg-[#FFF5F0] max-lg:h-48 max-lg:flex-1'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={done}
                disabled={busy}
                className='flex h-54 w-126 items-center justify-center rounded-full bg-[#FF4800] text-[calc(16*var(--u))] leading-21 font-semibold tracking-[-0.02em] text-white hover:bg-brand-dark disabled:opacity-60 max-lg:h-48 max-lg:flex-1'
              >
                {busy ? 'Saving…' : 'Done'}
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
