'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Gift, Compass } from 'lucide-react'

type NavItem = {
  label: string
  href: string
  icon?: string
  lucideIcon?: React.FC<{ className?: string; style?: React.CSSProperties }>
}

const NAV_ITEMS: NavItem[] = [
  { label: 'For you', href: '/', icon: '/foryou.png' },
  { label: 'Dining', href: '/dining', icon: '/dining.png' },
  { label: 'Stores', href: '/stores', icon: '/store.png' },
  { label: 'Tourist', href: '/tourist', icon: '/Tourist.png' },
  { label: 'Rewards', href: '/visit-rewards', lucideIcon: Gift },
  { label: 'Gifts', href: '/gifts', icon: '/store.png' },
]

export function HeaderNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Main navigation" className="flex-1 flex justify-center self-stretch">
      <ul className="flex items-stretch w-full md:w-auto">
        {NAV_ITEMS.map(({ label, href, icon, lucideIcon: LucideIcon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href)

          return (
            <li key={href} className="flex flex-1 md:flex-none">
              <Link
                href={href}
                className="flex items-center justify-center transition-colors w-full md:w-auto"
              >
                <span className={cn(
                  'flex flex-col items-center gap-1 px-5 py-2 rounded-t-xl transition-colors whitespace-nowrap md:hidden border-b-2',
                  isActive ? 'bg-purple-100 border-brand' : 'border-transparent'
                )}>
                  {LucideIcon ? (
                    <LucideIcon
                      className="w-[40px] h-[40px] p-2 rounded-lg"
                      style={{ color: isActive ? '#a855f7' : '#9ca3af' }}
                    />
                  ) : icon ? (
                    <Image
                      src={icon}
                      alt=""
                      width={40}
                      height={40}
                      className={cn(
                        "object-contain",
                        icon.includes('Tourist') && "scale-[1.55] -translate-y-[2px]"
                      )}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className={cn(
                    'text-[11px] font-semibold uppercase tracking-wide',
                    isActive ? 'text-brand' : 'text-gray-400'
                  )}>
                    {label}
                  </span>
                </span>

                <span className={cn(
                  'hidden md:flex items-center px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-purple-100 text-brand'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
