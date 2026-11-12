import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { ReferFriendClient } from './ReferFriendClient'

export const metadata: Metadata = { title: 'Refer a friend | PassPrivé', robots: { index: false } }

/** App parity: screens/ReferFriendScreen.jsx. */
export default async function ReferPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  return (
    <main className='min-h-screen bg-white'>
      <SetPageTitle title='Refer a friend' />
      <ReferFriendClient />
    </main>
  )
}
