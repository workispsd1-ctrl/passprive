'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
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

// TODO(design): Wellness / Services / Health Care have no routes yet — pointing
// to '#' as placeholders.
const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: '/nav/home.webp', activeBg: '#FFEDC8' },
  { label: 'Shopping', href: '/stores', icon: '/nav/shopping.webp', activeBg: '#D7FEDB' },
  { label: 'Wellness', href: '#', icon: '/nav/wellness.webp', activeBg: '#D3F6F9' },
  { label: 'Dining', href: '/dining', icon: '/nav/dining.webp', activeBg: '#FFEAE1' },
  { label: 'Tourists', href: '/tourist', icon: '/nav/tourist.webp', activeBg: '#FFEDC8', badge: 'COMING SOON' },
  { label: 'Services', href: '#', icon: '/nav/services.webp', activeBg: '#FFEDC8', badge: 'NEW' },
  { label: 'Health Care', href: '#', icon: '/nav/healthcare.webp', activeBg: '#FFEDC8' },
]

export function HeaderNav() {
  const pathname = usePathname()

  return (
    <div className="relative mx-auto block w-fit max-w-full">
      <nav
        aria-label="Category navigation"
        className="flex h-20 items-center gap-3 overflow-x-auto scrollbar-none pr-12 [&::-webkit-scrollbar]:hidden 2xl:h-25 2xl:gap-4 2xl:pr-16"
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
                'relative flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 whitespace-nowrap transition-colors 2xl:px-6 2xl:py-3.5',
                !isActive && 'border-gray-200 bg-white hover:border-gray-300',
              )}
            >
              {badge && (
                <span
                  className={cn(
                    'absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-bold whitespace-nowrap text-white',
                    badge === 'NEW' ? 'bg-[#FF6A19]' : 'bg-[#1C1C1E]',
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
                className="h-7 w-7 shrink-0 object-contain 2xl:h-9 2xl:w-9"
              />
              <span className="text-[14px] font-semibold text-[#1a1a1a] 2xl:text-[16px]">
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-500 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25)]"
      >
        <ChevronRight className="h-4 w-4" />
      </span>
    </div>
  )
}
