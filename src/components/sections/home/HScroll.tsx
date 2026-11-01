'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const SCROLL_BY = 320

interface Props {
  /** omit for a headerless rail (e.g. a promo banner's restaurant strip) */
  title?: string
  subtitle?: string
  /** extra classes on the <section>, e.g. a peach band background */
  className?: string
  /** override the content column's max-width (default max-w-7xl) */
  maxWidthClassName?: string
  /** override the card row's gap (default: 16 on phones → 44 at 1920, the Figma rows) */
  gapClassName?: string
  children: React.ReactNode
}

/**
 * Section wrapper with a title and a horizontal snap scroller. The prev/next
 * controls are circular white buttons that float over the left/right edges of
 * the card row, vertically centred (matching the app).
 */
export function HScroll({
  title,
  subtitle,
  className,
  maxWidthClassName = 'max-w-7xl',
  gapClassName = 'gap-4 xl:gap-6 2xl:gap-8 min-[120rem]:gap-11',
  children,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

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
    // phones swipe — the arrows only cover the cards there
    'absolute top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#1F1F1F] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] transition-opacity hover:text-gray-900 md:flex'
  const arrowIcon = 'h-[27.7px] w-[14.87px]'

  return (
    <section className={cn('py-4 md:py-8', className)}>
      {/* Keep the header + rail aligned with the page's max-w-7xl content even
          when a caller makes the <section> full-bleed (e.g. a peach band). */}
      <div className={cn('mx-auto w-full', maxWidthClassName)}>
        {title && (
          <div className="mb-4 px-4 md:px-8 2xl:mb-5 min-[120rem]:mb-7">
            {/* DM Sans Bold — Figma's section titles are 32px on the 1920
                frame (40 above the cards); laptops step down proportionally. */}
            <h3 className="font-(family-name:--font-dm-sans) text-[19px] font-bold leading-none tracking-normal text-[#0D141C] md:text-[20px] xl:text-[22px] 2xl:text-[26px] min-[120rem]:text-[32px]">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 text-[13px] text-gray-500">{subtitle}</p>
            )}
          </div>
        )}

        <div className="relative">
        <button
          type="button"
          onClick={() => by(-SCROLL_BY)}
          aria-label="Scroll left"
          className={cn(arrowBase, 'left-2 md:left-3', !canLeft && 'invisible')}
        >
          <ChevronLeft className={arrowIcon} />
        </button>
        <button
          type="button"
          onClick={() => by(SCROLL_BY)}
          aria-label="Scroll right"
          className={cn(arrowBase, 'right-2 md:right-3', !canRight && 'invisible')}
        >
          <ChevronRight className={arrowIcon} />
        </button>

          <div
            ref={scrollRef}
            // pt/pb give the cards' drop shadow room — overflow-x:auto forces
            // overflow-y:auto, which would otherwise clip it top/bottom
            className={cn(
              'flex snap-x overflow-x-auto scroll-smooth scroll-px-4 px-4 pt-3 pb-5 [scrollbar-width:none] md:scroll-px-8 md:px-8 md:pb-8 [&::-webkit-scrollbar]:hidden',
              gapClassName,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
