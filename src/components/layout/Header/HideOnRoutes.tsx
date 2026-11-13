'use client'

import { usePathname } from 'next/navigation'

/** Screens that open full-page on their own top bar, with no site header. */
const HEADERLESS = new Set(['/search'])

/** Drops the site header on full-screen pages (the search screen has its own back button and input). */
export function HideOnRoutes({ children }: { children: React.ReactNode }) {
  return HEADERLESS.has(usePathname()) ? null : children
}
