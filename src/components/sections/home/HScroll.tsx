'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const SCROLL_BY = 320

interface Props {
  title: string
  subtitle?: string
  /** extra classes on the <section>, e.g. a peach band background */
  className?: string
  children: React.ReactNode
}

/**
 * Section wrapper with a title and a horizontal snap scroller. The prev/next
 * controls are circular white buttons that float over the left/right edges of
 * the card row, vertically centred (matching the app).
 */
export function HScroll({ title, subtitle, className, children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  function update() {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  function by(delta: number) {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' })
  }

  const arrowBase =
    'absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-600 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] transition-opacity hover:text-gray-900'

  return (
    <section className={cn('py-6 md:py-8', className)}>
      {/* Keep the header + rail aligned with the page's max-w-7xl content even
          when a caller makes the <section> full-bleed (e.g. a peach band). */}
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-4 px-4 md:px-8">
          {/* DM Sans 700 / 32 / 100% — #383838 (2xl); scaled down below 2xl */}
          <h2 className="font-(family-name:--font-dm-sans) text-[26px] font-bold leading-none tracking-normal text-[#383838] 2xl:text-[32px]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[13px] text-gray-500">{subtitle}</p>
          )}
        </div>

        <div className="relative">
        <button
          type="button"
          onClick={() => by(-SCROLL_BY)}
          aria-label="Scroll left"
          className={cn(arrowBase, 'left-2 md:left-3', !canLeft && 'opacity-45')}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => by(SCROLL_BY)}
          aria-label="Scroll right"
          className={cn(arrowBase, 'right-2 md:right-3', !canRight && 'opacity-45')}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

          <div
            ref={scrollRef}
            // pt/pb give the cards' drop shadow room — overflow-x:auto forces
            // overflow-y:auto, which would otherwise clip it top/bottom
            className="flex gap-4 overflow-x-auto scroll-smooth px-4 pt-3 pb-8 [scrollbar-width:none] md:px-8 [&::-webkit-scrollbar]:hidden"
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
