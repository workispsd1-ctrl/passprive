'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ComponentProps } from 'react'
import { useAuthPrompt } from '@/lib/context/AuthPromptContext'

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string }

/**
 * A `Link` into a flow that needs an account — "Book a table", "Book a slot",
 * "Pay bill". Signed in, it navigates as usual; signed out, it opens the
 * login dialog first and continues to `href` once the viewer signs in.
 * Cmd/Ctrl/Shift/middle clicks keep the browser's own behaviour.
 */
export function AuthLink({ href, onClick, ...rest }: Props) {
  const router = useRouter()
  const { requireLogin } = useAuthPrompt()

  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        requireLogin(() => router.push(href))
      }}
    />
  )
}
