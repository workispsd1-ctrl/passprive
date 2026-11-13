import type { Metadata } from 'next'
import { getUserCoords } from '@/lib/location'
import { getDealsModeItems, type DealsCategory, type DealsMode } from '@/lib/services/dealsMode'
import { DealsModeClient } from './DealsModeClient'

export const metadata: Metadata = {
  title: 'Deals & Cashback',
  description: 'Places near you with live deals, and places where Privé Credits pay the bill.',
}

const CATEGORIES: DealsCategory[] = ['dining', 'shopping', 'wellness']

/**
 * Deals Mode / Use Cashback — app parity: screens/DealsCashbackScreen.jsx.
 * `?mode=cashback` lists merchants that take Privé Credits on the bill;
 * the default lists merchants with a live deal or offer.
 */
export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; category?: string }>
}) {
  const { mode: rawMode, category: rawCategory } = await searchParams
  const mode: DealsMode = rawMode === 'cashback' ? 'cashback' : 'deals'
  const category = CATEGORIES.includes(rawCategory as DealsCategory) ? (rawCategory as DealsCategory) : 'dining'
  const coords = await getUserCoords()
  const items = await getDealsModeItems(mode, coords)

  return (
    <main className="relative">
      <DealsModeClient
        // remount when the mode or header location changes — the list holds its own filters
        key={`${mode}:${coords?.lat ?? ''},${coords?.lng ?? ''}`}
        mode={mode}
        initialCategory={category}
        items={items}
      />
    </main>
  )
}
