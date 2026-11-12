'use client'

import { useEffect, useRef, useState } from 'react'
import { HuntSpot } from '@/components/hunt/HuntSpot'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  href: string
  icon: string
  /** active-pill background — each category has its own tint */
  activeBg: string
  /** app parity: CategoryGrid.jsx GRID_CATEGORIES badge */
  badge?: 'NEW' | 'COMING SOON'
}

// app parity: CategoryGrid.jsx — Tourist, Services, Health Care and Hotels are
// greyed-out, untappable "COMING SOON" tiles in the app.
const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: '/assets/nav/home.webp', activeBg: '#FFEDC8' },
  { label: 'Shopping', href: '/stores', icon: '/assets/nav/shopping.webp', activeBg: '#D7FEDB' },
  { label: 'Wellness', href: '/wellness', icon: '/assets/nav/wellness.webp', activeBg: '#D3F6F9' },
  { label: 'Dining', href: '/dining', icon: '/assets/nav/dining.webp', activeBg: '#FFEAE1' },
  { label: 'Tourist', href: '#', icon: '/assets/nav/tourist.webp', activeBg: '#FFEDC8', badge: 'COMING SOON' },
  { label: 'Services', href: '#', icon: '/assets/nav/services.webp', activeBg: '#FFEDC8', badge: 'COMING SOON' },
  { label: 'Health Care', href: '#', icon: '/assets/nav/healthcare.webp', activeBg: '#FFEDC8', badge: 'COMING SOON' },
  { label: 'Hotels', href: '#', icon: '/assets/nav/hotels.png', activeBg: '#FFEDC8', badge: 'COMING SOON' },
]

/** app parity: CategoryGrid.jsx isLive — only untagged or NEW tiles open */
const isLive = (badge: NavItem['badge']) => !badge || badge === 'NEW'

/**
 * Category pills — Figma "Navigations" (PASS-PRIVE-HOMEPAGE 11339:855): at
 * 1920 the row spans the 1576 content width, pills 98 tall with 64 icons and
 * 20px labels, 24 apart, a round 40 "next" at the end. Laptops step down by
 * breakpoint.
 */
export function HeaderNav() {
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)
  // which ends of the row still hide pills — the arrows only show (and scroll) when there's more
  const [more, setMore] = useState({ left: false, right: false })

  useEffect(() => {
    const el = navRef.current
    if (!el) return
    const measure = () => setMore({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 })
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    el.addEventListener('scroll', measure, { passive: true })
    return () => { ro.disconnect(); el.removeEventListener('scroll', measure) }
  }, [])

  const page = (dir: 1 | -1) => navRef.current?.scrollBy({ left: dir * navRef.current.clientWidth * 0.6, behavior: 'smooth' })
  const arrow = 'absolute top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-500 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25)] transition-colors hover:text-gray-800 md:flex 2xl:h-9 2xl:w-9 min-[120rem]:h-10 min-[120rem]:w-10'

  return (
    <div className="relative mx-auto block w-fit max-w-full min-[120rem]:w-[1576px]">
      {/* app parity: CategoryTabs (home) / StickyCategoryBar (category homes) hunt slots */}
      <HuntSpot slot={pathname === '/' ? 'home-categories' : 'category-bar'} />
      <nav
        ref={navRef}
        aria-label="Category navigation"
        // phones: smaller pills that swipe (no arrow over them); desktop keeps the scroll hint
        className="flex h-16 items-center gap-2 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden md:h-20 md:gap-3 md:pr-12 xl:h-22 xl:gap-4 2xl:h-27 2xl:gap-5 2xl:pr-16 min-[120rem]:h-32 min-[120rem]:gap-6"
      >
        {NAV_ITEMS.map(({ label, href, icon, activeBg, badge }) => {
          const live = isLive(badge)
          const isActive =
            href === '/'
              ? pathname === '/'
              : live && pathname.startsWith(href)
          const tileClass = cn(
            'relative flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 whitespace-nowrap transition-colors md:h-12 md:gap-2 md:px-4 xl:h-14 xl:gap-2.5 xl:px-5 2xl:h-18 2xl:gap-3 2xl:px-7 min-[120rem]:h-[98px] min-[120rem]:gap-4 min-[120rem]:px-[37px]',
            !isActive && 'border-gray-200 bg-white',
            !isActive && live && 'hover:border-gray-300',
            !live && 'cursor-default',
          )
          const content = (
            <>
              {badge && (
                <span
                  className={cn(
                    'absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-bold whitespace-nowrap text-white 2xl:text-[10px] min-[120rem]:-top-[13px] min-[120rem]:left-[58%] min-[120rem]:px-3 min-[120rem]:py-1.5 min-[120rem]:text-[11px]',
                    badge === 'NEW' ? 'bg-brand-light' : 'bg-[#1C1C1E]',
                  )}
                >
                  {badge}
                </span>
              )}
              <Image
                src={icon}
                alt=""
                width={40}
                height={40}
                // app parity: coming-soon tiles use the grey icon art
                className={cn('h-6 w-6 shrink-0 object-contain md:h-8 md:w-8 xl:h-9 xl:w-9 2xl:h-12 2xl:w-12 min-[120rem]:h-16 min-[120rem]:w-16', !live && 'grayscale')}
              />
              <span className={cn('text-[13px] font-semibold md:text-[14px] xl:text-[15px] 2xl:text-[17px] min-[120rem]:text-[20px]', live ? 'text-[#1a1a1a]' : 'text-[#9A9A9A]')}>
                {label}
              </span>
            </>
          )

          return live ? (
            <Link
              key={label}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              style={isActive ? { backgroundColor: activeBg, borderColor: 'transparent' } : undefined}
              className={tileClass}
            >
              {content}
            </Link>
          ) : (
            <span key={label} aria-disabled='true' className={tileClass}>
              {content}
            </span>
          )
        })}
      </nav>

      {more.left && (
        <button type="button" aria-label="Previous categories" onClick={() => page(-1)} className={cn(arrow, 'left-1 min-[120rem]:left-0')}>
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {more.right && (
        <button type="button" aria-label="More categories" onClick={() => page(1)} className={cn(arrow, 'right-1 min-[120rem]:right-0')}>
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
