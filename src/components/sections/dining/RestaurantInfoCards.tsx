'use client'

import { useState } from 'react'

interface Props {
  description: string | null | undefined
  cuisineLabel: string
  facilityTags: string[]
  highlightTags: string[]
  worthVisitTags: string[]
}

function ExpandableCard({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className='shrink-0 w-72 border border-gray-200 rounded-2xl p-5 bg-white'>
      <div className='flex items-center gap-2.5 mb-3'>
        <span className='text-[22px]'>{emoji}</span>
        <span className='text-[14px] font-bold text-gray-900'>{title}</span>
      </div>
      <p className={`text-[13px] text-gray-500 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>{text}</p>
      {text.length > 120 && (
        <button
          type='button'
          onClick={() => setExpanded(e => !e)}
          className='text-[12px] font-semibold text-violet-600 mt-2 hover:text-violet-800 hover:underline'
        >
          {expanded ? 'view less' : 'view more'}
        </button>
      )}
    </div>
  )
}

export function RestaurantInfoCards({ description, cuisineLabel, highlightTags, worthVisitTags }: Props) {
  if (!description && !cuisineLabel && highlightTags.length === 0 && worthVisitTags.length === 0) return null

  return (
    <div className='flex gap-4 mt-7 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1'>
      {description && (
        <ExpandableCard emoji='💎' title='About the place' text={description} />
      )}
      {highlightTags.length > 0 && (
        <ExpandableCard emoji='🌟' title='Highlights' text={highlightTags.join(', ')} />
      )}
      {worthVisitTags.length > 0 && (
        <ExpandableCard emoji='🏆' title='Worth the Visit' text={worthVisitTags.join('. ')} />
      )}
      {cuisineLabel && (
        <ExpandableCard emoji='🍲' title='Must tries dishes and cuisines' text={cuisineLabel} />
      )}
    </div>
  )
}
