'use client'

import { useEffect, useRef, useState } from 'react'
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

// TODO(design): Services / Healthcare have no routes yet — pointing
// to '#' as placeholders (Figma marks Healthcare COMING SOON).
const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: '/nav/home.webp', activeBg: '#FFEDC8' },
  { label: 'Shopping', href: '/stores', icon: '/nav/shopping.webp', activeBg: '#D7FEDB' },
  { label: 'Wellness', href: '/wellness', icon: '/nav/wellness.webp', activeBg: '#D3F6F9' },
  { label: 'Dining', href: '/dining', icon: '/nav/dining.webp', activeBg: '#FFEAE1' },
  { label: 'Tourists', href: '/tourist', icon: '/nav/tourist.webp', activeBg: '#FFEDC8' },
  { label: 'Services', href: '#', icon: '/nav/services.webp', activeBg: '#FFEDC8', badge: 'NEW' },
  { label: 'Healthcare', href: '#', icon: '/nav/healthcare.webp', activeBg: '#FFEDC8', badge: 'COMING SOON' },
]

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
      <nav
        ref={navRef}
        aria-label="Category navigation"
        // phones: smaller pills that swipe (no arrow over them); desktop keeps the scroll hint
        className="flex h-16 items-center gap-2 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden md:h-20 md:gap-3 md:pr-12 xl:h-22 xl:gap-4 2xl:h-27 2xl:gap-5 2xl:pr-16 min-[120rem]:h-32 min-[120rem]:gap-6"
      >
        {NAV_ITEMS.map(({ label, href, icon, activeBg, badge }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : href !== '#' && pathname.startsWith(href)

          return (
            <Link
              key={label}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              style={isActive ? { backgroundColor: activeBg, borderColor: 'transparent' } : undefined}
              className={cn(
                'relative flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 whitespace-nowrap transition-colors md:h-12 md:gap-2 md:px-4 xl:h-14 xl:gap-2.5 xl:px-5 2xl:h-18 2xl:gap-3 2xl:px-7 min-[120rem]:h-[98px] min-[120rem]:gap-4 min-[120rem]:px-[37px]',
                !isActive && 'border-gray-200 bg-white hover:border-gray-300',
              )}
            >
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
                className="h-6 w-6 shrink-0 object-contain md:h-8 md:w-8 xl:h-9 xl:w-9 2xl:h-12 2xl:w-12 min-[120rem]:h-16 min-[120rem]:w-16"
              />
              <span className="text-[13px] font-semibold text-[#1a1a1a] md:text-[14px] xl:text-[15px] 2xl:text-[17px] min-[120rem]:text-[20px]">
                {label}
              </span>
            </Link>
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
