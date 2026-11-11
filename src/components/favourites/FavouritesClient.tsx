'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { formatCreated } from '@/lib/formatCreated'
import { useSaved } from '@/lib/context/SavedContext'
import { EmptyHeartArt, PageHeader, PrimaryPill, useDismiss, useUndoable } from './shared'

export type ListSummary = {
  id: string
  name: string
  count: number
  createdAt: string | null
  photos: string[]
  itemIds: string[]
}

/**
 * Favourites — the user's lists. App parity: screens/SavedRestaurants.jsx
 * (collage cards, "+ New List" dialog, empty state with Explore Now), plus
 * delete-with-undo from the web designs.
 */
export function FavouritesClient({ lists }: { lists: ListSummary[] }) {
  const router = useRouter()
  const { setSaved } = useSaved()
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [newOpen, setNewOpen] = useState(false)
  const { run, notify, toast } = useUndoable()

  const visible = lists.filter(l => !hidden.has(l.id))

  function deleteList(list: ListSummary) {
    setHidden(prev => new Set(prev).add(list.id))
    run(
      'List deleted',
      () => {
        fetch(`/api/saves/lists/${list.id}`, { method: 'DELETE', keepalive: true })
          .then(res => {
            if (!res.ok) throw new Error()
            // hearts: anything that was only in this list is no longer saved
            const elsewhere = new Set(lists.filter(l => l.id !== list.id && !hidden.has(l.id)).flatMap(l => l.itemIds))
            list.itemIds.forEach(id => !elsewhere.has(id) && setSaved(id, false))
            router.refresh()
          })
          .catch(() => {
            setHidden(prev => {
              const next = new Set(prev)
              next.delete(list.id)
              return next
            })
            notify("Couldn't delete the list. Please try again.")
          })
      },
      () =>
        setHidden(prev => {
          const next = new Set(prev)
          next.delete(list.id)
          return next
        }),
    )
  }

  return (
    <div>
      <PageHeader
        title='Favourites'
        actions={
          visible.length > 0 && (
            <PrimaryPill variant='soft' onClick={() => setNewOpen(true)} className='w-136 max-lg:w-auto'>
              + New List
            </PrimaryPill>
          )
        }
      />

      {visible.length === 0 ? (
        // Figma "Empty favourites": centred in the 748-tall area, gap 32
        <div className='flex min-h-748 flex-col items-center justify-center gap-32 px-172 pt-40 pb-80 text-center max-lg:min-h-[70vh] max-lg:gap-24 max-lg:px-16'>
          <EmptyHeartArt />
          <div className='flex w-520 max-w-full flex-col gap-8'>
            <p className='text-[calc(24*var(--u))] leading-32 font-bold text-[#2C2D32] max-lg:text-[20px] max-lg:leading-28'>Nothing saved yet</p>
            <p className='text-[calc(16*var(--u))] leading-24 text-[#595B61] max-lg:text-[14px] max-lg:leading-20'>
              Save your favourite spots and they&apos;ll appear here
            </p>
          </div>
          <PrimaryPill href='/' className='w-180'>
            Explore Now
          </PrimaryPill>
        </div>
      ) : (
        // Figma "Page content": padding 40/172/80; "Favourite lists": 2 per row, gap 24
        <div className='grid grid-cols-2 gap-24 px-172 pt-40 pb-80 max-lg:grid-cols-1 max-lg:gap-16 max-lg:px-16 max-lg:pt-20 max-lg:pb-28'>
          {visible.map(list => (
            <ListCard key={list.id} list={list} onDelete={() => deleteList(list)} />
          ))}
        </div>
      )}

      <NewListDialog open={newOpen} onClose={() => setNewOpen(false)} onCreated={() => router.refresh()} />
      {toast}
    </div>
  )
}

/** Figma "List card": padding 20, gap 20, 1px #EBEBEB, radius 16; collage 186 tall (gap 8, radius 12); 18/26 title, 14/20 meta. */
function ListCard({ list, onDelete }: { list: ListSummary; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useDismiss(menuRef, menuOpen, () => setMenuOpen(false))

  return (
    <div className='group relative flex flex-col gap-20 rounded-[calc(16*var(--u))] border border-[#EBEBEB] bg-white p-20 shadow-[0_calc(4*var(--u))_calc(12*var(--u))_rgba(0,0,0,0.0196)] transition-shadow hover:shadow-[0_calc(6*var(--u))_calc(18*var(--u))_rgba(0,0,0,0.07)] max-lg:gap-12 max-lg:p-12'>
      <Link href={`/saved/${list.id}`} aria-label={list.name} className='absolute inset-0 rounded-[calc(16*var(--u))]' />

      <div className='flex h-186 gap-8 max-lg:h-96 max-lg:gap-4'>
        {[0, 1, 2].map(i => (
          <div key={i} className='relative flex-1 overflow-hidden rounded-[calc(12*var(--u))] bg-[#F1F1F1] max-lg:rounded-[8px]'>
            {list.photos[i] && <Image src={list.photos[i]} alt='' fill sizes='(min-width: 1024px) 13vw, 33vw' className='object-cover' />}
          </div>
        ))}
      </div>

      <div className='flex items-center gap-20 max-lg:gap-12'>
        <div className='flex min-w-0 flex-1 flex-col gap-4 max-lg:gap-2'>
          <p className='truncate text-[calc(18*var(--u))] leading-26 font-bold text-[#2C2D32] max-lg:text-[16px] max-lg:leading-22'>{list.name}</p>
          <p className='truncate text-[calc(14*var(--u))] leading-20 text-[#595B61] max-lg:text-[12px] max-lg:leading-16'>
            {list.count} saved
            {list.createdAt ? ` · ${formatCreated(list.createdAt)}` : ''}
          </p>
        </div>

        <div ref={menuRef} className='relative z-1'>
          <button
            type='button'
            aria-label={`More options for ${list.name}`}
            aria-haspopup='menu'
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
            className='flex size-36 items-center justify-center rounded-full bg-[#F5F5F5] text-[#595B61] transition-colors hover:bg-[#EBEBEB] max-lg:size-32'
          >
            <MoreHorizontal className='size-16' />
          </button>
          {menuOpen && (
            <div
              role='menu'
              className='absolute right-0 bottom-full z-20 mb-8 w-180 overflow-hidden rounded-[calc(12*var(--u))] border border-[#EBEBEB] bg-white py-4 shadow-[0_calc(8*var(--u))_calc(24*var(--u))_rgba(0,0,0,0.12)] animate-in fade-in-0 zoom-in-95 max-lg:w-160'
            >
              <button
                type='button'
                role='menuitem'
                onClick={() => {
                  setMenuOpen(false)
                  onDelete()
                }}
                className='flex w-full items-center gap-8 px-16 py-10 text-left text-[calc(14*var(--u))] leading-20 font-medium text-[#FF3B30] hover:bg-[#FFF3F3]'
              >
                <Trash2 className='size-16' />
                Delete list
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** "New List" dialog — app parity: SavedRestaurants' AnimatedDialog (List name, Cancel / Create). */
function NewListDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function close() {
    setName('')
    setError(null)
    onClose()
  }

  async function create() {
    const clean = name.trim()
    if (!clean || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/saves/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clean }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        setError(body?.error ?? 'Could not create list. Please try again.')
        return
      }
      onCreated()
      close()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && close()}>
      <DialogContent showCloseButton={false} className='gap-4 rounded-[20px] p-5 sm:max-w-sm'>
        <DialogTitle className='text-[18px] font-bold text-[#2C2D32]'>New List</DialogTitle>
        <div>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && create()}
            placeholder='List name'
            maxLength={60}
            className='h-12 w-full rounded-xl border border-[#E5E5EA] px-3.5 text-[15px] text-[#1A1A1A] outline-none placeholder:text-[#999] focus:border-brand'
          />
          {error && <p className='mt-2 text-[12px] text-[#E5484D]'>{error}</p>}
        </div>
        <div className='flex gap-3'>
          <button
            type='button'
            onClick={close}
            className='h-11.5 flex-1 rounded-xl border border-[#E5E5EA] text-[15px] font-semibold text-[#2C2D32] hover:bg-gray-50'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={create}
            disabled={!name.trim() || busy}
            className='h-11.5 flex-1 rounded-xl bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-50'
          >
            Create
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
