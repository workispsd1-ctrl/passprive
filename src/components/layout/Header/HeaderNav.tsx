'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  href: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'For you', href: '/', icon: '/foryou.png' },
  { label: 'Dining', href: '/dining', icon: '/dining.png' },
  { label: 'Stores', href: '/stores', icon: '/stores.png' },
]

export function HeaderNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Main navigation" className="flex-1 flex justify-center self-stretch">
      <ul className="flex items-stretch w-full md:w-auto">
        {NAV_ITEMS.map(({ label, href, icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href)

          return (
            <li key={href} className="flex flex-1 md:flex-none">
              <Link
                href={href}
                className={cn(
                  'flex items-center justify-center transition-colors w-full md:border-b-2 md:justify-start',
                  isActive ? 'md:border-brand' : 'md:border-transparent'
                )}
              >
                {/* Mobile: single card wraps icon + label */}
                <span className={cn(
                  'flex flex-col items-center gap-1 px-5 py-2 rounded-t-xl transition-colors whitespace-nowrap md:hidden border-b-2',
                  isActive ? 'bg-purple-100 border-brand' : 'border-transparent'
                )}>
                  <Image src={icon} alt="" width={28} height={28} aria-hidden="true" />
                  <span className={cn(
                    'text-[11px] font-semibold uppercase tracking-wide',
                    isActive ? 'text-brand' : 'text-gray-400'
                  )}>
                    {label}
                  </span>
                </span>

                {/* Desktop: plain inline text */}
                <span className={cn(
                  'hidden md:flex items-center gap-1 px-4 text-[13px] font-semibold normal-case whitespace-nowrap',
                  isActive ? 'text-brand' : 'text-gray-600 hover:text-gray-900'
                )}>
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
