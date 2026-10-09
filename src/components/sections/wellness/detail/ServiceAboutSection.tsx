'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ChevronRight, Sparkles, Trophy } from 'lucide-react'

function AboutCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className='rounded-2xl border border-gray-200 bg-white p-4'>
      <div className='flex items-center gap-2'>
        {icon}
        <p className='text-[15px] font-bold text-gray-900'>{title}</p>
      </div>
      <p className={`mt-2 text-[13px] leading-relaxed text-gray-600 ${expanded ? '' : 'line-clamp-4'}`}>{body}</p>
      {body.length > 220 && (
        <button
          type='button'
          onClick={() => setExpanded(v => !v)}
          className='mt-1 text-[13px] font-semibold text-gray-800 hover:underline'
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

/**
 * app parity: components/ServiceAboutSection.jsx ("About us": Highlights +
 * What makes it worth it) followed by the "Have queries or need help?" card.
 */
export function ServiceAboutSection({ highlights, description }: { highlights: string[]; description: string | null }) {
  const highlightsText = highlights.join(', ')

  return (
    <section id='about' className='scroll-mt-14 pt-8'>
      <h2 className='mb-4 text-[20px] font-bold text-gray-900'>About us</h2>

      {(highlightsText || description) && (
        <div className='grid gap-3 md:grid-cols-2'>
          {highlightsText && (
            <AboutCard icon={<Sparkles className='h-5 w-5 text-brand' />} title='Highlights' body={highlightsText} />
          )}
          {description && (
            <AboutCard icon={<Trophy className='h-5 w-5 text-amber-500' />} title='What makes it worth it' body={description} />
          )}
        </div>
      )}

      <Link
        href='/support'
        className='mt-4 flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 transition-colors hover:bg-gray-50'
      >
        <div>
          <p className='text-[14px] font-bold text-gray-900'>Have queries or need help?</p>
          <p className='mt-0.5 flex items-center gap-0.5 text-[13px] font-semibold text-brand'>
            Contact help &amp; support <ChevronRight className='h-3.5 w-3.5' />
          </p>
        </div>
        <AlertCircle className='h-8 w-8 shrink-0 text-amber-400' strokeWidth={1.5} />
      </Link>
    </section>
  )
}
