'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { AuthLink } from '@/components/shared/AuthLink'

/**
 * The visible section for a tab: `#id`, or a `[data-section]` block — a page
 * can draw a desktop and a phone version of a section, and only one shows.
 */
export function findSection(id: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[id="${id}"], [data-section="${id}"]`)
  for (const el of all) if (el.offsetHeight > 0) return el
  return all[0] ?? null
}

export type DetailTab = { id: string; label: string }

/** px between the viewport top and a section's heading once it's scrolled to — the bar's stuck height */
const OFFSET_TABS_ONLY = 64
const OFFSET_WITH_TITLE = 104

/**
 * Sticky section tabs on a merchant detail page — app parity: the sticky tab
 * row (and sticky title) of RestaurantDetails / StoreDetails /
 * ServiceStoreDetails. Tapping a tab scrolls to its section; while scrolling,
 * the section under the bar is highlighted and kept in view. Tabs whose
 * section isn't on the page (e.g. Deals for a merchant without any) drop out.
 * Once the bar sticks it carries the place's name — and on desktop the main
 * action — so neither scrolls away.
 */
export function DetailSectionTabs({
  tabs,
  title,
  cta,
  className,
  orderClassName,
  variant = 'default',
}: {
  tabs: DetailTab[]
  title?: string
  cta?: { label: string; href: string } | null
  className?: string
  /** flex `order` for the bar and its stuck-detection sentinel — they must move together */
  orderClassName?: string
  /** 'figma' — desktop restaurant page: Figma "Dining - Pay Bill" tab row, in --t type units */
  /** 'wellness' — desktop salon page: Figma "Salon details – Desktop" tab row, in --u design px */
  variant?: 'default' | 'figma' | 'wellness'
}) {
  const figma = variant === 'figma'
  const wellness = variant === 'wellness'
  const [present, setPresent] = useState<DetailTab[]>(tabs)
  const [active, setActive] = useState(tabs[0]?.id)
  const [stuck, setStuck] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  // while a tab-tap scroll is running, don't let the scroll spy fight it
  const locked = useRef(false)
  const offset = title ? OFFSET_WITH_TITLE : OFFSET_TABS_ONLY

  // keep only tabs whose section exists and has content; sections that load on the client resize in later
  useEffect(() => {
    const check = () =>
      setPresent(tabs.filter(t => {
        const el = findSection(t.id)
        return !!el && el.offsetHeight > 0
      }))
    // observing fires once right away, so this also runs the first check
    const ro = new ResizeObserver(check)
    ro.observe(document.body)
    // every version of a section (desktop + phone): the one showing may be one that's still hidden now
    tabs.forEach(t => {
      document.querySelectorAll<HTMLElement>(`[id="${t.id}"], [data-section="${t.id}"]`).forEach(el => ro.observe(el))
    })
    return () => ro.disconnect()
  }, [tabs])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    // stuck = the sentinel has scrolled up past the top, not merely out of view below the fold
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const onScroll = () => {
      if (locked.current) return
      let current = present[0]?.id
      for (const t of present) {
        const el = findSection(t.id)
        if (el && el.getBoundingClientRect().top - offset - 8 <= 0) current = t.id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [present, offset])

  // keep the active tab centred in the row (app parity: scrollTabsToActiveIndex)
  useEffect(() => {
    const row = rowRef.current
    const tab = row?.querySelector<HTMLElement>(`[data-tab="${active}"]`)
    if (!row || !tab) return
    row.scrollTo({ left: tab.offsetLeft - (row.clientWidth - tab.clientWidth) / 2, behavior: 'smooth' })
  }, [active])

  if (present.length < 2) return <div ref={sentinelRef} className={orderClassName} />

  function go(e: React.MouseEvent, id: string) {
    const el = findSection(id)
    if (!el) return
    e.preventDefault()
    setActive(id)
    locked.current = true
    setTimeout(() => { locked.current = false }, 900)
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset + 8, behavior: 'smooth' })
    history.replaceState(null, '', `#${id}`)
  }

  return (
    <>
      <div ref={sentinelRef} aria-hidden='true' className={orderClassName} />
      <nav
        aria-label='Sections'
        className={cn(
          'sticky top-0 z-30 -mx-4 border-b bg-white/95 px-4 backdrop-blur transition-shadow md:mx-0 md:px-0',
          figma && 'md:mt-[calc(32*var(--t))] md:border-b md:border-[#ffd1bf]',
          // css.txt "Group 2085665162" has no fill: at rest the title card's shadow fades through the
          // tab row (a white bar would cut it off in a hard line); it only turns white once it sticks
          figma && !stuck && 'md:bg-transparent md:backdrop-blur-none',
          stuck ? 'border-gray-100 shadow-[0_6px_16px_-10px_rgba(0,0,0,0.18)] md:-mx-4 md:px-4' : 'border-gray-100',
          wellness && 'md:mt-[calc(40*var(--u))] md:border-b md:border-[#ffd1bf]',
          orderClassName,
          className,
        )}
      >
        {title && (
          <div
            className={cn(
              'flex items-center justify-between gap-3 overflow-hidden transition-all duration-200',
              stuck ? 'max-h-14 pt-2.5 opacity-100' : 'max-h-0 opacity-0',
            )}
            aria-hidden={!stuck}
          >
            <p className='truncate text-[15px] font-bold text-[#141414]'>{title}</p>
            {cta && (
              <AuthLink
                href={cta.href}
                tabIndex={stuck ? 0 : -1}
                className='hidden shrink-0 rounded-full bg-brand px-4 py-1.5 text-[13px] font-bold text-white transition-colors hover:bg-brand-dark md:block'
              >
                {cta.label}
              </AuthLink>
            )}
          </div>
        )}
        <div
          ref={rowRef}
          className={cn('scrollbar-hide flex gap-7 overflow-x-auto md:gap-11', figma && 'md:gap-[max(16px,calc(28*var(--t)))]', wellness && 'md:gap-[calc(44*var(--u))]')}
        >
          {present.map(t => (
            <a
              key={t.id}
              href={`#${t.id}`}
              data-tab={t.id}
              aria-current={active === t.id ? 'true' : undefined}
              onClick={e => go(e, t.id)}
              className={cn(
                'relative shrink-0 py-3.5 text-[14px] font-semibold transition-colors md:py-4 md:text-[17px] md:font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand',
                active === t.id ? 'text-brand' : 'text-gray-600 hover:text-gray-900',
                // css.txt tab row: 110-wide labels 138 apart, 18/25, the underline 10 under the text and 5 above the divider
                figma && 'md:min-w-[calc(110*var(--t))] md:pt-0 md:pb-[calc(18*var(--t))] md:text-[length:max(14px,calc(18*var(--t)))] md:leading-[calc(25*var(--t))]',
                figma && (active === t.id ? 'md:font-semibold md:text-[#ff4800]' : 'md:font-medium md:text-[#424144]'),
                wellness && 'md:flex md:h-[calc(45*var(--u))] md:items-center md:py-0 md:px-[calc(4*var(--u))] md:text-[length:calc(16*var(--u))] md:leading-[calc(21*var(--u))]',
                wellness && (active === t.id ? 'md:font-bold md:text-[#ff4800]' : 'md:font-medium md:text-[#2c2d32]'),
              )}
            >
              {t.label}
              <span
                className={cn(
                  'absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand transition-opacity md:h-[3px]',
                  figma && 'md:right-auto md:bottom-[calc(5*var(--t))] md:h-[calc(3*var(--t))] md:w-[calc(64*var(--t))] md:rounded-[calc(2.5*var(--t))] md:bg-[#ff4800]',
                  wellness && 'md:h-[calc(3*var(--u))] md:rounded-none md:bg-[#ff4800]',
                  active === t.id ? 'opacity-100' : 'opacity-0',
                )}
              />
            </a>
          ))}
        </div>
      </nav>
    </>
  )
}
