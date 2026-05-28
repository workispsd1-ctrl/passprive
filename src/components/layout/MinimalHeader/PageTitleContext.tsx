'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

type TitleCtx = { title: string; setTitle: (t: string) => void }

const PageTitleContext = createContext<TitleCtx>({ title: '', setTitle: () => {} })

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('')
  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  )
}

export function usePageTitle() {
  return useContext(PageTitleContext)
}
