import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FAV_PAGE } from '@/components/favourites/unit'
import { createClient } from '@/lib/supabase/server'
import { getHotlists } from '@/lib/services/hotlists'
import { FavouritesClient, type ListSummary } from '@/components/favourites/FavouritesClient'

export const metadata: Metadata = {
  title: 'Favourites',
  robots: { index: false },
}

/** Favourites — the user's lists (app parity: SavedRestaurants). */
export default async function SavedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const lists: ListSummary[] = (await getHotlists(user.id)).map(l => ({
    id: l.id,
    name: l.name,
    count: l.items.length,
    createdAt: l.createdAt,
    photos: l.items.map(v => v.image).filter((u): u is string => !!u).slice(0, 3),
    itemIds: l.items.map(v => v.id),
  }))

  return (
    <main className={FAV_PAGE}>
      <FavouritesClient lists={lists} />
    </main>
  )
}
