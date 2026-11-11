'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * A one-card-per-page horizontal pager with the Figma's dot indicator
 * (6px dots, 4.7px apart; the current one #FF4800). Children that render
 * nothing don't count as pages, so a banner that hides itself drops out of
 * the dots too. Each direct child of the rail becomes a full-width page.
 */
export function SnapPager({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) {
  const railRef = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const sync = () => setCount(rail.children.length)
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(rail, { childList: true })
    return () => observer.disconnect()
  }, [])

  const goTo = useCallback((i: number) => {
    const rail = railRef.current
    rail?.scrollTo({ left: i * rail.clientWidth, behavior: 'smooth' })
  }, [])

  return (
    <div className={cn(count === 0 && 'hidden', className)}>
      <div
        ref={railRef}
        onScroll={e => setPage(Math.round(e.currentTarget.scrollLeft / (e.currentTarget.clientWidth || 1)))}
        className='scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto *:w-full *:shrink-0 *:snap-start'
        aria-roledescription='carousel'
        aria-label={label}
      >
        {children}
      </div>
      {count > 1 && (
        <div className='mt-2.5 flex items-center justify-center gap-[4.7px]'>
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type='button'
              aria-label={`${label} ${i + 1}`}
              aria-current={i === page}
              onClick={() => goTo(i)}
              className={cn('size-1.5 rounded-full transition-colors', i === page ? 'bg-[#FF4800]' : 'bg-[#E5E5E7]')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
