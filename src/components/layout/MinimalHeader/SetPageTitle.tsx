'use client'

import { useLayoutEffect } from 'react'
import { usePageTitle } from './PageTitleContext'

/**
 * Sets the account title bar while this page is mounted. The provider lives in
 * the (account) layout, which stays mounted across navigations, so the title is
 * cleared on unmount — otherwise it leaks onto the next page (e.g. "Your
 * bookings" showing above /profile, which has its own Back link).
 */
export function SetPageTitle({ title }: { title: string }) {
  const { setTitle } = usePageTitle()
  useLayoutEffect(() => {
    setTitle(title)
    return () => setTitle('')
  }, [title, setTitle])
  return null
}
