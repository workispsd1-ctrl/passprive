import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronDown, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Help topics | PassPrivé',
  alternates: { canonical: '/help' },
}

/** Help articles and a way to reach support — app parity: HelpTopicsScreen.jsx. */
export default async function HelpPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('help_topics')
    .select('id, category, title, content')
    .eq('is_published', true)
    .order('display_order', { ascending: true })
    .order('updated_at', { ascending: false })
  const topics = data ?? []

  return (
    <main className='mx-auto min-h-screen max-w-3xl px-4 py-8 md:px-6'>
      <h1 className='text-2xl font-bold text-[#2C2D32]'>Help topics</h1>
      {topics.length ? (
        <div className='mt-5 flex flex-col gap-3'>
          {topics.map(topic => (
            <details key={topic.id} className='group rounded-2xl border border-[#E6E0E9] bg-white'>
              <summary className='flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-[15px] font-semibold text-[#2C2D32] [&::-webkit-details-marker]:hidden'>
                <span>{topic.title}</span>
                <ChevronDown className='size-4 shrink-0 text-[#605D64] transition-transform group-open:rotate-180' />
              </summary>
              <p className='border-t border-[#E6E0E9] p-4 text-sm leading-6 whitespace-pre-line text-[#605D64]'>{topic.content}</p>
            </details>
          ))}
        </div>
      ) : (
        <p className='mt-10 text-center text-sm text-[#605D64]'>No help topics available</p>
      )}
      <Link href='/support' className='mt-6 flex h-12 items-center justify-center gap-2 rounded-full bg-brand font-semibold text-white hover:bg-brand-dark'>
        <MessageCircle className='size-4' /> Chat with us
      </Link>
    </main>
  )
}
