'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'For you', href: '/' },
  { label: 'Dining', href: '/dining' },
  { label: 'Stores', href: '/stores' },
]

export function HeaderNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Main navigation" className="flex-1 flex justify-center self-stretch">
      <ul className="flex items-stretch w-full md:w-auto">
        {NAV_ITEMS.map(({ label, href }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          const isDining = href === '/dining'

          return (
            <li key={href} className="flex flex-1 md:flex-none">
              <Link
                href={href}
                className={cn(
                  'flex items-center justify-center gap-1 px-4 text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap w-full uppercase md:normal-case md:justify-start',
                  isActive
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                )}
              >
                {isDining && (
                  <Utensils className="w-3.5 h-3.5 shrink-0 md:hidden" aria-hidden="true" />
                )}
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
