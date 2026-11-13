'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import LoginDialog from '@/components/LoginDialog'
import { createClient } from '@/lib/supabase/client'

interface AuthPromptValue {
  /** open the login dialog (used when an action needs a session) */
  promptLogin: () => void
  /**
   * Run `then` now when signed in; otherwise open the login dialog and run it
   * once the viewer signs in (dropped if they close the dialog instead).
   */
  requireLogin: (then: () => void) => void
}

const AuthPromptContext = createContext<AuthPromptValue>({
  promptLogin: () => {},
  // outside the provider there is no dialog to show — just carry on
  requireLogin: (then) => then(),
})

export function AuthPromptProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  // the action waiting on a sign-in
  const pending = useRef<(() => void) | null>(null)

  const promptLogin = useCallback(() => setOpen(true), [])

  const requireLogin = useCallback(
    async (then: () => void) => {
      // getSession reads the local session — no network round trip
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        then()
        return
      }
      pending.current = then
      setOpen(true)
    },
    [supabase],
  )

  // LoginDialog fires `pp:auth` right after a successful sign-in
  useEffect(() => {
    function onAuth() {
      const then = pending.current
      pending.current = null
      then?.()
    }
    window.addEventListener('pp:auth', onAuth)
    return () => window.removeEventListener('pp:auth', onAuth)
  }, [])

  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    // Closed without signing in → drop the action. On success LoginDialog
    // closes first and then fires `pp:auth` synchronously, so clear on a
    // microtask to let that listener run the action before it is dropped.
    if (!next) queueMicrotask(() => { pending.current = null })
  }, [])

  return (
    <AuthPromptContext.Provider value={{ promptLogin, requireLogin }}>
      {children}
      <LoginDialog open={open} onOpenChange={onOpenChange} hideTrigger />
    </AuthPromptContext.Provider>
  )
}

export function useAuthPrompt() {
  return useContext(AuthPromptContext)
}
