'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Heart, MapPin, Share, SlidersHorizontal, Star, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCreated } from '@/lib/formatCreated'
import { useSaved } from '@/lib/context/SavedContext'
import { SaveListSheet } from '@/components/SaveListSheet'
import type { Hotlist, Section, Venue } from '@/lib/services/hotlists'
import { AddToListModal } from './AddToListModal'
import { IconCircle, PageHeader, PrimaryPill, useDismiss, useUndoable } from './shared'

const FILTERS: { id: 'all' | Section; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'dining', label: 'Dining' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'stores', label: 'Stores' },
]

/**
 * One favourites list — app parity: screens/SavedListDetail.jsx (venue cards
 * with location, category badge and rating pill; share / filter / Add Items),
 * plus the web designs' remove-with-undo and "Add to List" modal.
 */
export function ListDetailClient({ list }: { list: Hotlist }) {
  const router = useRouter()
  const { setSaved } = useSaved()
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | Section>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [sheetFor, setSheetFor] = useState<Venue | null>(null)
  const { run, notify, toast } = useUndoable()

  useDismiss(filterRef, filterOpen, () => setFilterOpen(false))

  const items = list.items.filter(v => !hidden.has(v.id))
  const shown = filter === 'all' ? items : items.filter(v => v.section === filter)
  const counts = Object.fromEntries(
    FILTERS.map(f => [f.id, f.id === 'all' ? items.length : items.filter(v => v.section === f.id).length]),
  )

  const unhide = (id: string) =>
    setHidden(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })

  function remove(v: Venue) {
    setHidden(prev => new Set(prev).add(v.id))
    run(
      'Removed from list',
      () => {
        fetch(`/api/saves/lists/${list.id}/items`, {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ remove: [v.id] }),
        })
          .then(res => (res.ok ? res.json() : Promise.reject()))
          .then((d: { savedAnywhere?: Record<string, boolean> }) => {
            setSaved(v.id, !!d.savedAnywhere?.[v.id])
            router.refresh()
          })
          .catch(() => {
            unhide(v.id)
            notify("Couldn't remove it. Please try again.")
          })
      },
      () => unhide(v.id),
    )
  }

  async function share() {
    const origin = window.location.origin
    const text = [list.name, ...items.map(v => `• ${v.name} — ${origin}${v.href}`)].join('\n')
    try {
      if (navigator.share) {
        await navigator.share({ title: list.name, text })
        return
      }
      await navigator.clipboard.writeText(text)
      notify('List copied to clipboard')
    } catch {
      /* share sheet dismissed */
    }
  }

  return (
    <div>
      <PageHeader
        title={list.name}
        back='/saved'
        actions={
          <>
            <IconCircle label='Share list' onClick={share}>
              <Share className='size-19 max-lg:size-17' strokeWidth={1.4} />
            </IconCircle>
            <div ref={filterRef} className='relative'>
              <IconCircle label='Filter' active={filter !== 'all'} onClick={() => setFilterOpen(o => !o)}>
                <SlidersHorizontal className='size-19 text-[#454040] max-lg:size-17' strokeWidth={1.2} />
              </IconCircle>
              {filterOpen && (
                <div
                  role='menu'
                  className='absolute top-full right-0 z-30 mt-8 w-200 overflow-hidden rounded-[calc(12*var(--u))] border border-[#EBEBEB] bg-white py-4 shadow-[0_calc(8*var(--u))_calc(24*var(--u))_rgba(0,0,0,0.12)] animate-in fade-in-0 zoom-in-95 max-lg:w-176'
                >
                  {FILTERS.map(f => (
                    <button
                      key={f.id}
                      type='button'
                      role='menuitemradio'
                      aria-checked={filter === f.id}
                      onClick={() => {
                        setFilter(f.id)
                        setFilterOpen(false)
                      }}
                      className='flex w-full items-center justify-between px-16 py-10 text-left text-[calc(14*var(--u))] leading-20 text-[#2C2D32] hover:bg-[#FAFAFA]'
                    >
                      <span className={cn(filter === f.id && 'font-semibold text-[#FF4800]')}>
                        {f.label}
                        <span className='ml-6 text-[calc(12*var(--u))] text-[#9E9E9E]'>{counts[f.id]}</span>
                      </span>
                      {filter === f.id && <Check className='size-14 text-[#FF4800]' strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {items.length > 0 && (
              <PrimaryPill onClick={() => setAddOpen(true)} className='w-152 max-lg:hidden'>
                + Add Items
              </PrimaryPill>
            )}
          </>
        }
      />

      {/* Figma "Page content": padding 40/172/80, gap 32 */}
      <div className='flex flex-col gap-32 px-172 pt-40 pb-80 max-lg:gap-16 max-lg:px-16 max-lg:pt-16 max-lg:pb-28'>
        <p className='text-[calc(16*var(--u))] leading-24 text-[#595B61] max-lg:text-[13px] max-lg:leading-18'>
          {items.length} saved
          {list.createdAt ? ` · ${formatCreated(list.createdAt)}` : ''}
        </p>

        {items.length === 0 ? (
          // Figma "Empty list": centred in a 600-tall area, gap 32
          <div className='flex min-h-600 flex-col items-center justify-center gap-32 text-center max-lg:min-h-[55vh] max-lg:gap-20'>
            <div className='flex w-480 max-w-full flex-col gap-8'>
              <p className='text-[calc(24*var(--u))] leading-32 font-bold text-[#2C2D32] max-lg:text-[20px] max-lg:leading-28'>This list is empty</p>
              <p className='text-[calc(16*var(--u))] leading-24 text-[#595B61] max-lg:text-[14px] max-lg:leading-20'>Start adding your favourite spots</p>
            </div>
            <PrimaryPill onClick={() => setAddOpen(true)} className='w-152'>
              + Add Items
            </PrimaryPill>
          </div>
        ) : shown.length === 0 ? (
          <p className='py-80 text-center text-[calc(16*var(--u))] leading-24 text-[#595B61] max-lg:text-[14px]'>Nothing in this list matches the filter.</p>
        ) : (
          // Figma "Saved places": 2 per row, gap 24
          <div className='grid grid-cols-2 gap-24 max-lg:grid-cols-1 max-lg:gap-12'>
            {shown.map(v => (
              <VenueRow key={v.id} venue={v} onHeart={() => setSheetFor(v)} onRemove={() => remove(v)} />
            ))}
          </div>
        )}
      </div>

      {/* phones: floating Add Items — app parity: SavedListDetail FAB */}
      {items.length > 0 && (
        <div className='fixed inset-x-0 bottom-96 z-40 flex justify-center lg:hidden'>
          <PrimaryPill onClick={() => setAddOpen(true)} className='shadow-[0_4px_10px_rgba(0,0,0,0.18)]'>
            + Add Items
          </PrimaryPill>
        </div>
      )}

      <AddToListModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        listId={list.id}
        existing={items}
        onSaved={() => router.refresh()}
      />

      {sheetFor && (
        <SaveListSheet
          open
          onClose={() => {
            setSheetFor(null)
            router.refresh()
          }}
          entityId={sheetFor.id}
          entityType={sheetFor.type}
          entityName={sheetFor.name}
          onSavedChange={anywhere => setSaved(sheetFor.id, anywhere)}
        />
      )}

      {toast}
    </div>
  )
}

/**
 * Figma "Venue card": padding 16, gap 20, 1px #EBEBEB, radius 16; 144 photo,
 * 18/26 name, pin + 14/20 address, category pill + green rating pill, 24 heart.
 * Remove (Figma "Venue with delete action"): a 64 × 144 #FF3B30 panel at the
 * card's right — shown on hover on desktop, by swiping the card left on touch.
 */
function VenueRow({ venue, onHeart, onRemove }: { venue: Venue; onHeart: () => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false)
  const drag = useRef<{ x: number; y: number; swiping: boolean } | null>(null)
  const swiped = useRef(false)

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== 'touch') return
    drag.current = { x: e.clientX, y: e.clientY, swiping: false }
    swiped.current = false
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current
    if (!d) return
    const mx = e.clientX - d.x
    if (!d.swiping) {
      if (Math.abs(e.clientY - d.y) > 10) {
        drag.current = null // vertical scroll
        return
      }
      if (Math.abs(mx) < 24) return
      d.swiping = true
      swiped.current = true
      setOpen(mx < 0)
    }
  }
  function onPointerUp() {
    drag.current = null
  }

  return (
    <div
      className='group relative flex h-176 items-center gap-20 rounded-[calc(16*var(--u))] border border-[#EBEBEB] bg-white p-16 shadow-[0_calc(4*var(--u))_calc(12*var(--u))_rgba(0,0,0,0.0196)] transition-shadow hover:shadow-[0_calc(6*var(--u))_calc(18*var(--u))_rgba(0,0,0,0.07)] max-lg:h-auto max-lg:gap-12 max-lg:p-10'
      style={{ touchAction: 'pan-y' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={e => {
        if (swiped.current) {
          e.preventDefault()
          e.stopPropagation()
          swiped.current = false
        }
      }}
    >
      <Link href={venue.href} aria-label={venue.name} className='absolute inset-0 z-0 rounded-[calc(16*var(--u))]' />

      <div className='relative size-144 shrink-0 overflow-hidden rounded-[calc(12*var(--u))] bg-[#F1F1F1] max-lg:size-80'>
        {venue.image && <Image src={venue.image} alt='' fill sizes='(min-width: 1024px) 8vw, 80px' className='object-cover' />}
      </div>

      <div className='flex min-w-0 flex-1 flex-col gap-10 max-lg:gap-6'>
        <p className='truncate text-[calc(18*var(--u))] leading-26 font-bold text-[#2C2D32] max-lg:text-[15px] max-lg:leading-20'>{venue.name}</p>
        {venue.location && (
          <p className='flex items-center gap-6 text-[calc(14*var(--u))] leading-20 text-[#595B61] max-lg:gap-4 max-lg:text-[12px] max-lg:leading-16'>
            <MapPin className='size-14 shrink-0 max-lg:size-12' strokeWidth={1.4} />
            <span className='truncate'>{venue.location}</span>
          </p>
        )}
        <div className='flex items-center gap-8 max-lg:gap-6'>
          {venue.category && (
            <span className='max-w-[60%] truncate rounded-[calc(28*var(--u))] bg-[#F5F5F5] px-10 py-4 text-[calc(11*var(--u))] leading-14 font-bold text-[#595B61] uppercase max-lg:px-8 max-lg:py-2 max-lg:text-[10px]'>
              {venue.category}
            </span>
          )}
          {venue.rating ? (
            <span className='inline-flex items-center gap-4 rounded-[calc(28*var(--u))] bg-[#217C00] px-8 py-3 text-[calc(12*var(--u))] leading-16 font-bold text-white max-lg:px-6 max-lg:py-2 max-lg:text-[10px] max-lg:leading-14'>
              {venue.rating.toFixed(1)}
              <Star className='size-8 fill-white' strokeWidth={0} />
            </span>
          ) : null}
        </div>
      </div>

      <button
        type='button'
        aria-label={`Edit saved lists for ${venue.name}`}
        onClick={onHeart}
        className='relative z-1 flex size-24 shrink-0 items-center justify-center text-[#595B61] transition-transform hover:scale-110 hover:text-[#FF4800] max-lg:size-22'
      >
        <Heart className='size-24 max-lg:size-22' strokeWidth={2} />
      </button>

      {/* Figma "Delete action": 64 × 144, #FF3B30, radius 0 12 12 0 */}
      <button
        type='button'
        aria-label={`Remove ${venue.name} from this list`}
        onClick={onRemove}
        tabIndex={0}
        className={cn(
          'relative z-1 flex h-144 shrink-0 items-center justify-center overflow-hidden rounded-r-[calc(12*var(--u))] bg-[#FF3B30] text-white transition-[width,margin] duration-200 hover:bg-[#E5352B] max-lg:h-80',
          open ? 'ml-0 w-64 max-lg:w-56' : '-ml-20 w-0 max-lg:-ml-12',
          'lg:group-hover:ml-0 lg:group-hover:w-64 focus-visible:ml-0 focus-visible:w-64',
        )}
      >
        <Trash2 className='size-24 shrink-0 max-lg:size-20' strokeWidth={1.8} />
      </button>
    </div>
  )
}
