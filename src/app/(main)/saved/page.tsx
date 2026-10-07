import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSavedItems } from '@/lib/services/savedItems'
import { SavedClient } from './SavedClient'

export const metadata: Metadata = {
  title: 'Favourites',
  robots: { index: false },
}

export default async function SavedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const items = await getSavedItems(user.id)

  return (
    <main className='min-h-screen pb-20 md:pb-0'>
      <SavedClient items={items} />
    </main>
  )
}
