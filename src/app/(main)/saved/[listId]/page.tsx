import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { FAV_PAGE } from '@/components/favourites/unit'
import { createClient } from '@/lib/supabase/server'
import { getHotlist } from '@/lib/services/hotlists'
import { ListDetailClient } from '@/components/favourites/ListDetailClient'

export const metadata: Metadata = {
  title: 'Favourites',
  robots: { index: false },
}

/** One favourites list (app parity: SavedListDetail). */
export default async function SavedListPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const list = await getHotlist(user.id, listId)
  if (!list) notFound()

  return (
    <main className={FAV_PAGE}>
      <ListDetailClient list={list} />
    </main>
  )
}
