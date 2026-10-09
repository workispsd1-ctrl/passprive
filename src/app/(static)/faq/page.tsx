import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { FaqClient, type FaqEntry } from './FaqClient'

export const metadata: Metadata = {
  title: 'FAQs | PassPrivé',
  description: 'Answers to common questions about PassPrivé — accounts, offers, bookings, Privé Credits and more.',
}

/** FAQs — app parity: screens/FaqScreen.jsx (published faq_entries). */
export default async function FaqPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('faq_entries')
    .select('id, question, answer, tags, display_order, updated_at')
    .eq('is_published', true)
    .order('display_order', { ascending: true })
    .order('updated_at', { ascending: false })

  return <FaqClient faqs={(data ?? []) as FaqEntry[]} />
}
