'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export type PolicySection = { title: string; body: string }

/**
 * Terms / Privacy layout — app parity: screens/TermsPoliciesScreen.jsx
 * (round back button + title, centred "Effective & last updated" line, one
 * bordered card of "Title: body" paragraphs), at a readable desktop width.
 */
export function PolicyPage({ title, updated, sections }: { title: string; updated: string; sections: PolicySection[] }) {
  return (
    <main className='min-h-screen bg-white px-4 pt-6 pb-16 font-(family-name:--font-dm-sans)'>
      <div className='mx-auto max-w-3xl'>
        <PageBackTitle title={title} />

        <p className='mt-6 mb-5 text-center text-[18px] leading-[26px] font-bold text-[#2C2D32]'>
          Effective &amp; last updated {updated}
        </p>

        <div className='space-y-4 rounded-2xl border border-[#E6E0E9] bg-white px-4 py-4 md:px-7 md:py-6'>
          {sections.map(s => (
            <p key={s.title} className='text-[13px] leading-[20px] font-medium text-[#605D64] md:text-[14px] md:leading-[22px]'>
              <span className='font-bold text-[#2C2D32]'>{s.title}: </span>
              {s.body}
            </p>
          ))}
        </div>
      </div>
    </main>
  )
}

/** App-style sub-page title row: round back button + bold title. */
export function PageBackTitle({ title }: { title: string }) {
  const router = useRouter()
  return (
    <div className='flex items-center gap-3.5'>
      <button
        type='button'
        aria-label='Back'
        onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
        className='flex h-9 w-9 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10'
      >
        <ChevronLeft className='h-6 w-6 text-[#2C2D32]' strokeWidth={2} />
      </button>
      <h1 className='text-[18px] leading-6 font-bold text-[#2C2D32] md:text-[22px]'>{title}</h1>
    </div>
  )
}
