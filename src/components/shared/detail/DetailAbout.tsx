'use client'

import { useState } from 'react'
import { Check, Sparkles, Trophy, Utensils, Wallet, Leaf, Tag, Store } from 'lucide-react'
import { DetailSection } from './DetailSection'

const ICONS = { cost: Wallet, cuisine: Utensils, veg: Leaf, category: Store, tag: Tag }
export type FactIcon = keyof typeof ICONS

export type Fact = { icon: FactIcon; label: string; value: string }

function ExpandableText({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const long = text.length > 280
  return (
    <div>
      <p className={`text-[14.5px] leading-7 whitespace-pre-line text-gray-600 ${open || !long ? '' : 'line-clamp-4'}`}>{text}</p>
      {long && (
        <button type='button' onClick={() => setOpen(v => !v)} className='mt-1.5 text-[13px] font-semibold text-brand hover:underline'>
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}

function HighlightCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className='rounded-2xl bg-[#FAF7F5] p-4.5'>
      <p className='flex items-center gap-2 text-[14px] font-bold text-gray-900'>
        {icon} {title}
      </p>
      <p className={`mt-2 text-[13px] leading-5.5 text-gray-600 ${open ? '' : 'line-clamp-3'}`}>{body}</p>
      {body.length > 140 && (
        <button type='button' onClick={() => setOpen(v => !v)} className='mt-1 text-[12px] font-semibold text-brand hover:underline'>
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}

/**
 * About — app parity: FigmaAboutSection / FigmaAmenitiesSection /
 * ServiceAboutSection, merged into one overview: the story, quick facts,
 * highlights and amenities.
 */
export function DetailAbout({
  title = 'About',
  description,
  facts = [],
  highlights,
  worthIt,
  chips = [],
  chipsTitle = 'Amenities',
}: {
  title?: string
  description?: string | null
  facts?: Fact[]
  highlights?: string | null
  worthIt?: string | null
  chips?: string[]
  chipsTitle?: string
}) {
  if (!description && !facts.length && !highlights && !worthIt && !chips.length) return null

  return (
    <DetailSection id='about' title={title}>
      {description && <ExpandableText text={description} />}

      {facts.length > 0 && (
        <dl className='mt-6 grid grid-cols-2 gap-3 md:grid-cols-3'>
          {facts.map(f => {
            const Icon = ICONS[f.icon]
            return (
              <div key={f.label} className='flex items-start gap-3 rounded-2xl border border-gray-100 p-4'>
                <span className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand'>
                  <Icon className='size-4.5' />
                </span>
                <div className='min-w-0'>
                  <dt className='text-[12px] font-medium text-gray-500'>{f.label}</dt>
                  <dd className='mt-0.5 text-[14px] leading-5 font-semibold text-gray-900'>{f.value}</dd>
                </div>
              </div>
            )
          })}
        </dl>
      )}

      {(highlights || worthIt) && (
        <div className='mt-4 grid gap-3 md:grid-cols-2'>
          {highlights && <HighlightCard icon={<Sparkles className='size-4.5 text-brand' />} title='Highlights' body={highlights} />}
          {worthIt && <HighlightCard icon={<Trophy className='size-4.5 text-amber-500' />} title='Worth the visit' body={worthIt} />}
        </div>
      )}

      {chips.length > 0 && (
        <div className='mt-6'>
          <p className='mb-3 text-[14px] font-bold text-gray-900'>{chipsTitle}</p>
          <ul className='flex flex-wrap gap-2'>
            {chips.map(c => (
              <li key={c} className='flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-[13px] text-gray-700'>
                <Check className='size-3.5 text-[#1BA94C]' /> {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </DetailSection>
  )
}
