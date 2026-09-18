'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import LoginDialog from '@/components/LoginDialog'

interface AuthPromptValue {
  /** open the login dialog (used when an action needs a session) */
  promptLogin: () => void
}

const AuthPromptContext = createContext<AuthPromptValue>({
  promptLogin: () => {},
})

export function AuthPromptProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const promptLogin = useCallback(() => setOpen(true), [])

  return (
    <AuthPromptContext.Provider value={{ promptLogin }}>
      {children}
      <LoginDialog open={open} onOpenChange={setOpen} hideTrigger />
    </AuthPromptContext.Provider>
  )
}

export function useAuthPrompt() {
  return useContext(AuthPromptContext)
}
