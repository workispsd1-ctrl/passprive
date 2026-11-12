import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PageBackTitle } from '@/components/shared/PolicyPage'
import { AboutContentFrame } from './AboutContentFrame'

export const metadata: Metadata = {
  title: 'About us | PassPrivé',
  alternates: { canonical: '/about' },
}

/** App parity: screens/AboutAppScreen.jsx — the latest published `about_content` row. */
export default async function AboutPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('about_content')
    .select('title, content_html')
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <main className='min-h-screen bg-white px-4 pt-6 pb-16 font-(family-name:--font-dm-sans)'>
      <div className='mx-auto max-w-3xl'>
        <PageBackTitle title={data?.title || 'About PassPrivé'} />
        <div className='mt-6 rounded-2xl border border-[#E6E0E9] bg-white px-4 py-4 md:px-7 md:py-6'>
          <AboutContentFrame html={data?.content_html || '<p>About content is not available right now.</p>'} />
        </div>
      </div>
    </main>
  )
}
