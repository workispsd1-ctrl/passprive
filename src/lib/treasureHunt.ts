'use client'

import { useSyncExternalStore } from 'react'

/**
 * Lemon hunt state — ported from the app's utils/treasureHunt.js. One hunt at
 * a time; its spots sit in named slots on screens (x / y in % of the slot).
 * Finding one claims it through /api/hunt, queued and retried like the app.
 */
export type HuntSpotRow = { id: string; slot: string; part?: number | null; x: number; y: number }
export type Hunt = { id: string; title?: string | null; icon_url?: string | null; total?: number; spots?: HuntSpotRow[]; found?: string[]; rewarded?: boolean }
export type HuntToast = { found: number; total: number; completed?: boolean; rewarded?: boolean; reward_points?: number }

const SEND_GAP_MS = 350
const RETRIES = 3

let hunt: Hunt | null = null
let bySlot = new Map<string, HuntSpotRow[]>()
let found = new Set<string>()
const inflight = new Set<string>()
const listeners = new Set<() => void>()
const toastListeners = new Set<(t: HuntToast) => void>()
let queue: Promise<unknown> = Promise.resolve()
let version = 0

const cellKey = (slot: string, part?: number | null) => `${slot}:${part || 0}`
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function emit() {
  version += 1
  listeners.forEach(fn => fn())
}

function setHunt(next: Hunt | null) {
  hunt = next
  bySlot = new Map()
  for (const spot of next?.spots ?? []) {
    if (!spot?.slot) continue
    const key = cellKey(spot.slot, spot.part)
    bySlot.set(key, [...(bySlot.get(key) ?? []), spot])
  }
}

export function subscribeHunt(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
export function subscribeHuntToast(fn: (t: HuntToast) => void) {
  toastListeners.add(fn)
  return () => { toastListeners.delete(fn) }
}
export const huntInfo = () => hunt
export const visibleSpots = (slot: string, part = 0) => (bySlot.get(cellKey(slot, part)) ?? []).filter(s => !found.has(s.id))

/** Re-renders whenever the hunt or what's found changes. */
export function useHuntVersion() {
  return useSyncExternalStore(subscribeHunt, () => version, () => 0)
}

export function useHuntProgress() {
  useHuntVersion()
  return hunt ? { found: found.size, total: Number(hunt.total) || hunt.spots?.length || 0 } : null
}

export async function loadHunt() {
  const state = (await fetch('/api/hunt', { cache: 'no-store' }).then(r => (r.ok ? r.json() : undefined)).catch(() => undefined)) as Hunt | null | undefined
  if (state === undefined) return
  setHunt(state)
  found = new Set([...(state?.found ?? []), ...inflight])
  emit()
  // app parity: a finished hunt that wasn't rewarded yet asks again
  if (state && !state.rewarded && (state.found?.length ?? 0) >= (Number(state.total) || 0) && state.found?.[0]) {
    const huntId = state.id
    const first = state.found[0]
    queue = queue.then(() => send(huntId, first, false)).catch(() => {})
  }
}

export function claimSpot(spot: HuntSpotRow) {
  if (!hunt || found.has(spot.id)) return
  const huntId = hunt.id
  found.add(spot.id)
  inflight.add(spot.id)
  emit()
  queue = queue.then(() => send(huntId, spot.id, true)).catch(() => {})
}

async function send(huntId: string, spotId: string, notify: boolean) {
  try {
    for (let attempt = 0; attempt < RETRIES; attempt += 1) {
      const data = (await fetch('/api/hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hunt: huntId, spot: spotId }),
      }).then(r => r.json()).catch(() => null)) as (HuntToast & { ok?: boolean; code?: string }) | null
      if (data?.ok) {
        if (hunt?.id === huntId && data.rewarded) hunt = { ...hunt, rewarded: true }
        if (notify) toastListeners.forEach(fn => fn(data))
        await sleep(SEND_GAP_MS)
        return
      }
      if (data?.code === 'HUNT_OVER') { setHunt(null); emit(); return }
      if (data?.code === 'BAD_SPOT') break
      await sleep(SEND_GAP_MS * (attempt + 2))
    }
    if (notify) { found.delete(spotId); emit() }
  } finally {
    inflight.delete(spotId)
  }
}
