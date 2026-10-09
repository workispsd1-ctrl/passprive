'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * app parity: ServiceStoreDetails.jsx tabs row — anchors to each section and
 * highlights whichever one is under the sticky bar while scrolling.
 */
export function ServiceSectionTabs({ tabs }: { tabs: { id: string; label: string }[] }) {
  const [active, setActive] = useState(tabs[0]?.id)

  useEffect(() => {
    const onScroll = () => {
      // height of this sticky bar (~48px) plus a little slack
      const line = 64
      let current = tabs[0]?.id
      for (const t of tabs) {
        const el = document.getElementById(t.id)
        if (el && el.getBoundingClientRect().top - line <= 0) current = t.id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [tabs])

  if (tabs.length < 2) return null

  return (
    <nav className='sticky top-0 z-20 -mx-4 mt-6 border-b border-gray-100 bg-white/95 px-4 backdrop-blur md:mx-0 md:px-0'>
      <div className='scrollbar-hide flex gap-7 overflow-x-auto'>
        {tabs.map(t => (
          <a
            key={t.id}
            href={`#${t.id}`}
            onClick={() => setActive(t.id)}
            className={cn(
              'relative shrink-0 py-3 text-[14px] font-semibold transition-colors',
              active === t.id ? 'text-brand' : 'text-gray-600 hover:text-gray-900',
            )}
          >
            {t.label}
            <span
              className={cn(
                'absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand transition-opacity',
                active === t.id ? 'opacity-100' : 'opacity-0',
              )}
            />
          </a>
        ))}
      </div>
    </nav>
  )
}
