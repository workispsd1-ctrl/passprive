/**
 * Save / unsave (favourite) — same behaviour as the app's `toggleSavedRestaurant`
 * (`services/savedRestaurants.js`). The DB work happens server-side in
 * /api/saves so it uses the httpOnly auth cookies.
 */

export type SavedEntityType = 'STORE' | 'RESTAURANT'

/** entity_id → entity_type for everything the current user has saved. */
export async function getSavedEntities(): Promise<
  Map<string, SavedEntityType>
> {
  try {
    const res = await fetch('/api/saves', { cache: 'no-store' })
    if (!res.ok) return new Map()
    const { items } = (await res.json()) as {
      items?: { id: string; type: SavedEntityType }[]
    }
    return new Map((items ?? []).map((i) => [i.id, i.type]))
  } catch {
    return new Map()
  }
}

/**
 * Toggle a save. Returns the new saved state, or `null` when the user is not
 * logged in (401).
 */
export async function toggleSaved(
  entityId: string,
  entityType: SavedEntityType,
): Promise<boolean | null> {
  const res = await fetch('/api/saves/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entityId, entityType }),
  })
  if (res.status === 401) return null
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Save failed (${res.status})`)
  }
  const { saved } = (await res.json()) as { saved: boolean }
  return saved
}
