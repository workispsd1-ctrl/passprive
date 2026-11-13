'use client'

import { usePathname } from 'next/navigation'

/**
 * Leaves the site header out on full-screen pages that carry their own top
 * row — the membership plan and benefits screens (Figma "Subscription plan" /
 * "Privé benefits" have no navbar).
 */
const NO_HEADER = ['/membership', '/membership/benefits']

export function HeaderGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (NO_HEADER.includes(pathname)) return null
  return <>{children}</>
}
