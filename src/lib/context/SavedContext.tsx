'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  getSavedEntities,
  toggleSaved,
  type SavedEntityType,
} from '@/lib/services/savedEntities'
import { useAuthPrompt } from './AuthPromptContext'

interface SavedContextValue {
  isSaved: (entityId: string) => boolean
  /** default save/unsave; resolves to the new state, or null when logged out */
  toggle: (
    entityId: string,
    entityType: SavedEntityType,
  ) => Promise<boolean | null>
  /** force the local saved flag (e.g. after the "save to list" sheet changes it) */
  setSaved: (entityId: string, on: boolean) => void
}

const SavedContext = createContext<SavedContextValue>({
  isSaved: () => false,
  toggle: async () => null,
  setSaved: () => {},
})

// Not logged in → stash the intended save and prompt login; apply it after
// auth. Mirrors the app's setPendingSaveRestaurant / processPendingSave.
const PENDING_KEY = 'pp:pending_save'

type Pending = { id: string; type: SavedEntityType }

function readPending(): Pending | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    return raw ? (JSON.parse(raw) as Pending) : null
  } catch {
    return null
  }
}

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set())
  const { promptLogin } = useAuthPrompt()

  const setSaved = useCallback((id: string, on: boolean) => {
    setIds((prev) => {
      if (on === prev.has(id)) return prev
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const toggle = useCallback(
    async (id: string, type: SavedEntityType): Promise<boolean | null> => {
      const wasSaved = ids.has(id)
      setSaved(id, !wasSaved) // optimistic
      try {
        const result = await toggleSaved(id, type)
        if (result === null) {
          // not logged in — stash + prompt, revert
          try {
            localStorage.setItem(PENDING_KEY, JSON.stringify({ id, type }))
          } catch {
            /* ignore */
          }
          setSaved(id, wasSaved)
          promptLogin()
          return null
        }
        setSaved(id, result)
        return result
      } catch (err) {
        setSaved(id, wasSaved)
        console.error('[saves] toggle failed', err)
        return wasSaved
      }
    },
    [ids, setSaved, promptLogin],
  )

  // initial load + apply any pending save once the user is authed
  useEffect(() => {
    async function sync() {
      const map = await getSavedEntities().catch(() => new Map())
      const pending = readPending()
      if (pending && !map.has(pending.id)) {
        const saved = await toggleSaved(pending.id, pending.type).catch(
          () => null,
        )
        if (saved === true) map.set(pending.id, pending.type)
        if (saved !== null) {
          try {
            localStorage.removeItem(PENDING_KEY)
          } catch {
            /* ignore */
          }
        }
      } else if (pending && map.has(pending.id)) {
        try {
          localStorage.removeItem(PENDING_KEY)
        } catch {
          /* ignore */
        }
      }
      setIds(new Set(map.keys()))
    }
    sync()
    window.addEventListener('pp:auth', sync)
    return () => window.removeEventListener('pp:auth', sync)
  }, [])

  const isSaved = useCallback((id: string) => ids.has(id), [ids])

  return (
    <SavedContext.Provider value={{ isSaved, toggle, setSaved }}>
      {children}
    </SavedContext.Provider>
  )
}

export function useSaved() {
  return useContext(SavedContext)
}
