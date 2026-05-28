'use client'

import { usePageTitle } from './PageTitleContext'

export function MinimalHeaderTitle() {
  const { title } = usePageTitle()
  if (!title) return null
  return (
    <h1 className="text-lg font-bold text-gray-900 text-center truncate">{title}</h1>
  )
}
