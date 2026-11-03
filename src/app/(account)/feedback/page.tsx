import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { FeedbackClient } from './FeedbackClient'

export const metadata: Metadata = { title: 'Share feedback | PassPrivé' }

export default async function FeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const { data } = await supabase.from('feedback').select('id').eq('user_id', user.id).limit(1)
  return (
    <main className='min-h-screen'>
      <SetPageTitle title='Share feedback' />
      <FeedbackClient alreadyGiven={!!data?.length} />
    </main>
  )
}
