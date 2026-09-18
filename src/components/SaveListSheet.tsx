'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { SavedEntityType } from '@/lib/services/savedEntities'
import { cn } from '@/lib/utils'

type ListRow = { id: string; name: string; saved: boolean }

interface Props {
  open: boolean
  onClose: () => void
  entityId: string
  entityType: SavedEntityType
  entityName: string
  /** notified when the entity's overall saved-anywhere state changes */
  onSavedChange?: (savedAnywhere: boolean) => void
}

/**
 * "Save to list" sheet — mirrors the app's RestaurantSaveFlow bottom sheet:
 * pick which hotlist(s) an entity belongs to, or create a new one.
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

  const emit = useCallback(
    (rows: ListRow[]) => onSavedChange?.(rows.some((l) => l.saved)),
    [onSavedChange],
  )

  useEffect(() => {
    if (!open) return
    setCreating(false)
    setNewName('')
    setLoading(true)
    fetch(`/api/saves/lists?entityId=${encodeURIComponent(entityId)}`, {
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : { lists: [] }))
      .then((d: { lists?: ListRow[] }) => setLists(d.lists ?? []))
      .catch(() => setLists([]))
      .finally(() => setLoading(false))
  }, [open, entityId])

  async function toggleList(row: ListRow) {
    if (busyId) return
    const next = !row.saved
    setBusyId(row.id)
    const updated = lists.map((l) =>
      l.id === row.id ? { ...l, saved: next } : l,
    )
    setLists(updated)
    emit(updated)
    const res = await fetch('/api/saves/lists/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listId: row.id,
        entityId,
        entityType,
        add: next,
      }),
    }).catch(() => null)
    if (!res || !res.ok) {
      const reverted = updated.map((l) =>
        l.id === row.id ? { ...l, saved: !next } : l,
      )
      setLists(reverted)
      emit(reverted)
    }
    setBusyId(null)
  }

  async function createAndSave() {
    const name = newName.trim()
    if (!name || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/saves/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) return
      const { list } = (await res.json()) as { list: { id: string; name: string } }
      await fetch('/api/saves/lists/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: list.id,
          entityId,
          entityType,
          add: true,
        }),
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        <DialogHeader className="border-b border-gray-100 px-5 py-4">
          <DialogTitle className="text-[15px] font-bold text-[#0D141C]">
            Save “{entityName}”
          </DialogTitle>
          <p className="text-[12px] text-gray-500">Choose a list</p>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto px-2 py-2">
          {loading ? (
            <p className="px-3 py-6 text-center text-[13px] text-gray-400">
              Loading…
            </p>
          ) : (
            lists.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => toggleList(row)}
                disabled={!!busyId}
                className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                <span className="text-[14px] font-medium text-[#0D141C]">
                  {row.name}
                </span>
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border',
                    row.saved
                      ? 'border-[#FF4800] bg-[#FF4800] text-white'
                      : 'border-gray-300 text-transparent',
                  )}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              </button>
            ))
          )}

          {creating ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createAndSave()}
                placeholder="New list name"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-[#FF4800]"
              />
              <button
                type="button"
                onClick={createAndSave}
                disabled={saving || !newName.trim()}
                className="rounded-lg bg-[#FF4800] px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                aria-label="Cancel"
                onClick={() => setCreating(false)}
                className="p-1 text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-[14px] font-semibold text-[#FF4800] transition-colors hover:bg-orange-50"
            >
              <Plus className="h-4 w-4" /> Create new list
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
