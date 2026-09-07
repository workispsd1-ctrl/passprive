'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  href: string
}

// TODO(design): Wellness / Services / Health Care have no routes yet — pointing
// to '#' as placeholders. Rewards + Gifts were dropped to match the design's
// category set; re-add if those entry points are still needed elsewhere.
const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Dining', href: '/dining' },
  { label: 'Shopping', href: '/stores' },
  { label: 'Wellness', href: '#' },
  { label: 'Tourist', href: '/tourist' },
  { label: 'Services', href: '#' },
  { label: 'Health Care', href: '#' },
]

// 1px orange → blue gradient border on a white pill (non-selected items)
const pillBorder: React.CSSProperties = {
  border: '1px solid transparent',
  backgroundImage:
    'linear-gradient(#fff, #fff), linear-gradient(106.45deg, #FF6A19 32.05%, #2247FF 113.24%)',
  backgroundOrigin: 'border-box',
  backgroundClip: 'padding-box, border-box',
  WebkitBackgroundClip: 'padding-box, border-box',
}

export function HeaderNav() {
  const pathname = usePathname()

  return (
    <div className="relative mx-auto block w-fit max-w-full">
      <nav
        aria-label="Category navigation"
        className="flex h-20 items-center gap-3.5 rounded-full bg-white px-4 pr-12 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.35)] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] 2xl:h-33 2xl:gap-7 2xl:px-7 2xl:pr-16"
      >
        {NAV_ITEMS.map(({ label, href }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : href !== '#' && pathname.startsWith(href)

          return (
            <Link
              key={label}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              style={isActive ? undefined : pillBorder}
              className={cn(
                'shrink-0 rounded-full px-7 py-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors 2xl:px-13.75 2xl:py-6 2xl:text-[15px]',
                isActive
                  ? 'bg-[#F15A29] text-white'
                  : 'text-[#1a1a1a] hover:opacity-80',
              )}
            >
              {label}
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
