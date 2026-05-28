'use client'

import { useLayoutEffect } from 'react'
import { usePageTitle } from './PageTitleContext'

export function SetPageTitle({ title }: { title: string }) {
  const { setTitle } = usePageTitle()
  useLayoutEffect(() => { setTitle(title) }, [title, setTitle])
  return null
}
