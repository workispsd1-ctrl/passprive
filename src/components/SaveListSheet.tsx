'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Dialog } from '@base-ui/react/dialog'
import { Plus, X } from 'lucide-react'
import { FAV_UNIT } from '@/components/favourites/unit'
import type { SavedEntityType } from '@/lib/services/savedEntities'
import { cn } from '@/lib/utils'

type ListRow = { id: string; name: string; saved: boolean; thumbs?: string[] }

interface Props {
  open: boolean
  onClose: () => void
  entityId: string
  entityType: SavedEntityType
  entityName: string
  /** notified when the entity's overall saved-anywhere state changes */
  onSavedChange?: (savedAnywhere: boolean) => void
}

/* Figma "Save/Create new list" (1920 frames, see FAV_UNIT): 520-wide dialog,
   padding 32, gap 24, radius 24. Bottom sheet on phones. */
const TITLE = 'text-[calc(20*var(--u))] leading-28 font-bold text-[#2C2D32]'
const BODY16 = 'text-[calc(16*var(--u))] leading-24'
const PRIMARY =
  'flex h-50 w-full shrink-0 items-center justify-center rounded-full px-16 py-12 text-[calc(16*var(--u))] leading-24 font-bold'

function CloseButton({ onClick, label = 'Close' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-28 shrink-0 items-center justify-center text-[#2C2D32] hover:text-[#FF4800]"
    >
      <X className="size-28" strokeWidth={1.75} />
    </button>
  )
}

/** 22px radio: filled orange with an 8 × 5.5 check, or a 2px #9E9E9E ring. */
function Check({ on }: { on: boolean }) {
  return on ? (
    <span className="flex size-22 shrink-0 items-center justify-center rounded-full bg-[#FF4800]">
      <svg viewBox="0 0 8 5.5" className="h-[calc(5.5*var(--u))] w-8" fill="none" aria-hidden>
        <path d="M0.75 2.75 2.9 4.75 7.25 0.75" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  ) : (
    <span className="size-22 shrink-0 rounded-full border-2 border-[#9E9E9E]" />
  )
}

/** Up to 4 overlapping 28px thumbnails (radius 8, 1px white border, −6 overlap). */
function Thumbs({ urls }: { urls: string[] }) {
  if (!urls.length) return null
  return (
    <span className="flex shrink-0">
      {urls.slice(0, 4).map((u, i) => (
        <span
          key={i}
          className={cn(
            'relative size-28 overflow-hidden rounded-[calc(8*var(--u))] border border-white bg-[#F1F1F1]',
            i > 0 && '-ml-6',
          )}
        >
          <Image src={u} alt="" fill sizes="28px" className="object-cover" />
        </span>
      ))}
    </span>
  )
}

/**
 * "Save to list" dialog — mirrors the app's RestaurantSaveFlow (Save / venue
 * name, a check per list, "Create a new list" → "Create & Save", Done).
 */
export function SaveListSheet({
  open,
  onClose,
  entityId,
  entityType,
  entityName,
  onSavedChange,
}: Props) {
  const [lists, setLists] = useState<ListRow[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emit = useCallback(
    (rows: ListRow[]) => onSavedChange?.(rows.some((l) => l.saved)),
    [onSavedChange],
  )

  // reset to the list view each time the sheet opens
  const [wasOpen, setWasOpen] = useState(false)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setCreating(false)
      setNewName('')
      setError(null)
      setLoading(true)
    }
  }

  useEffect(() => {
    if (!open) return
    fetch(`/api/saves/lists?entityId=${encodeURIComponent(entityId)}`, {
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : { lists: [] }))
      // oldest first: the default list sits on top, new lists append below (Figma)
      .then((d: { lists?: ListRow[] }) => setLists([...(d.lists ?? [])].reverse()))
      .catch(() => setLists([]))
      .finally(() => setLoading(false))
  }, [open, entityId])

  async function toggleList(row: ListRow) {
    if (busyId) return
    const next = !row.saved
    setBusyId(row.id)
    const updated = lists.map((l) => (l.id === row.id ? { ...l, saved: next } : l))
    setLists(updated)
    emit(updated)
    const res = await fetch('/api/saves/lists/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId: row.id, entityId, entityType, add: next }),
    }).catch(() => null)
    if (!res || !res.ok) {
      const reverted = updated.map((l) => (l.id === row.id ? { ...l, saved: !next } : l))
      setLists(reverted)
      emit(reverted)
    }
    setBusyId(null)
  }

  async function createAndSave() {
    const name = newName.trim()
    if (!name || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/saves/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        setError(body?.error ?? 'Could not create list. Please try again.')
        return
      }
      const { list } = (await res.json()) as { list: { id: string; name: string } }
      await fetch('/api/saves/lists/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: list.id, entityId, entityType, add: true }),
      })
      const updated = [...lists, { ...list, saved: true }]
      setLists(updated)
      emit(updated)
      setCreating(false)
      setNewName('')
    } finally {
      setSaving(false)
    }
  }

  function backToSave() {
    setCreating(false)
    setNewName('')
    setError(null)
  }

  const row = (r: ListRow) => (
    <button
      key={r.id}
      type="button"
      role="checkbox"
      aria-checked={r.saved}
      onClick={() => toggleList(r)}
      disabled={!!busyId}
      className="flex w-full shrink-0 items-center gap-12 border-b border-[#EBEBEB] py-12 text-left disabled:cursor-wait"
    >
      <Thumbs urls={r.thumbs ?? []} />
      <span className={cn('min-w-0 flex-1 truncate font-medium text-[#2C2D32]', BODY16)}>{r.name}</span>
      <Check on={r.saved} />
    </button>
  )

  const [first, ...rest] = lists
  const hasName = !!newName.trim()

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.33)] duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Popup
          className={cn(
            FAV_UNIT,
            'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-520 max-w-[calc(100vw-32px)] -translate-1/2 flex-col gap-24 rounded-[calc(24*var(--u))] bg-white p-32 font-(family-name:--font-dm-sans) shadow-[0_calc(4*var(--u))_calc(12*var(--u))_rgba(0,0,0,0.08)] outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            // phones: bottom sheet
            'max-lg:top-auto max-lg:bottom-0 max-lg:max-h-[85dvh] max-lg:w-full max-lg:max-w-full max-lg:translate-y-0 max-lg:rounded-b-none max-lg:p-24 max-lg:pb-[calc(env(safe-area-inset-bottom)+24px)] max-lg:data-open:slide-in-from-bottom max-lg:data-open:zoom-in-100',
          )}
        >
          {creating ? (
            <>
              <div className="flex shrink-0 items-start gap-16">
                <Dialog.Title className={cn('min-w-0 flex-1', TITLE)}>Create new list</Dialog.Title>
                <CloseButton onClick={backToSave} label="Back to lists" />
              </div>

              <div className="shrink-0">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createAndSave()}
                  placeholder="Enter list name"
                  maxLength={60}
                  className={cn(
                    'h-54 w-full rounded-full px-16 font-normal text-[#2C2D32] outline-none placeholder:text-[#9E9E9E]',
                    BODY16,
                    hasName ? 'border-[length:calc(1.5*var(--u))] border-[#FF4800]' : 'border border-[#DCDCDC] focus:border-[#FF4800]',
                  )}
                />
                {error && <p className="mt-8 text-[calc(12*var(--u))] text-[#E5484D]">{error}</p>}
              </div>

              <button
                type="button"
                onClick={createAndSave}
                disabled={saving || !hasName}
                className={cn(
                  PRIMARY,
                  hasName ? 'bg-[#FF4800] text-white hover:bg-brand-dark' : 'bg-[#DCDCDC] text-[#9E9E9E]',
                  saving && 'opacity-70',
                )}
              >
                {saving ? 'Saving…' : 'Create & Save'}
              </button>
            </>
          ) : (
            <>
              <div className="flex shrink-0 items-start gap-16">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Dialog.Title className={TITLE}>Save</Dialog.Title>
                  {entityName && (
                    <p className="truncate text-[calc(14*var(--u))] leading-20 font-medium text-[#595B61]">
                      {entityName}
                    </p>
                  )}
                </div>
                <CloseButton onClick={onClose} />
              </div>

              <div className="flex min-h-0 flex-col gap-16 overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col gap-16" aria-busy="true">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex h-48 items-center gap-12 border-b border-[#EBEBEB]">
                        <div className="h-16 w-2/3 animate-pulse rounded-full bg-[#F1F1F1]" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {first && row(first)}
                    <button
                      type="button"
                      onClick={() => setCreating(true)}
                      className="flex w-full shrink-0 items-center gap-12 py-12 text-left"
                    >
                      <span className="flex size-22 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-[#FF4800]">
                        <Plus className="size-16" strokeWidth={2.25} />
                      </span>
                      <span className={cn('font-semibold text-[#FF4800]', BODY16)}>Create a new list</span>
                    </button>
                    {rest.map(row)}
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className={cn(PRIMARY, 'bg-[#FF4800] text-white hover:bg-brand-dark')}
              >
                Done
              </button>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
