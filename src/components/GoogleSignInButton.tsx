'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ''
const GSI_SRC = 'https://accounts.google.com/gsi/client'

interface GoogleCredentialResponse { credential?: string }
interface GoogleAccountsId {
  initialize(config: {
    client_id: string
    callback: (res: GoogleCredentialResponse) => void
    nonce?: string
    ux_mode?: 'popup'
  }): void
  renderButton(el: HTMLElement, options: Record<string, unknown>): void
}
declare global {
  interface Window { google?: { accounts: { id: GoogleAccountsId } } }
}

let gsiPromise: Promise<void> | null = null
function loadGsi(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  gsiPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = GSI_SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => { gsiPromise = null; reject(new Error('Could not load Google sign-in.')) }
    document.head.appendChild(s)
  })
  return gsiPromise
}

async function makeNonce(): Promise<[raw: string, hashed: string]> {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  const hashed = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
  return [raw, hashed]
}

async function ensureUserRow(supabase: ReturnType<typeof createClient>, user: User) {
  const now = new Date().toISOString()
  const { data: row } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle()
  if (row) {
    await supabase.from('users').update({ last_login: now, last_opened: now, updated_at: now }).eq('id', user.id)
    return
  }
  await supabase.from('users').insert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    created_at: now,
    last_login: now,
    last_opened: now,
  })
}

interface Props {
  disabled?: boolean
  onBusyChange?: (busy: boolean) => void
  onSuccess: () => void
  onError: (message: string) => void
}

/**
 * App parity: Login.jsx gets a Google ID token and hands it to
 * `signInWithIdToken` — no OAuth redirect, so it doesn't depend on the
 * Supabase Redirect URLs allow-list. Google hashes the nonce into the token;
 * Supabase checks it against the raw one.
 */
export function GoogleSignInButton({ disabled, onBusyChange, onSuccess, onError }: Props) {
  const slotRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  // Keep the latest handlers without re-rendering Google's button.
  const handlers = useRef({ onBusyChange, onSuccess, onError })
  useEffect(() => { handlers.current = { onBusyChange, onSuccess, onError } })

  useEffect(() => {
    let cancelled = false
    if (!CLIENT_ID) { handlers.current.onError('Google sign-in is not configured.'); return }

    ;(async () => {
      try {
        const [[rawNonce, hashedNonce]] = await Promise.all([makeNonce(), loadGsi()])
        const slot = slotRef.current
        if (cancelled || !slot || !window.google) return

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          nonce: hashedNonce,
          ux_mode: 'popup',
          callback: async ({ credential }) => {
            if (!credential) { handlers.current.onError('Google sign-in was cancelled.'); return }
            setBusy(true)
            handlers.current.onBusyChange?.(true)
            const supabase = createClient()
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: credential,
              nonce: rawNonce,
            })
            if (!error && data.user) await ensureUserRow(supabase, data.user)
            setBusy(false)
            handlers.current.onBusyChange?.(false)
            if (error) handlers.current.onError(error.message)
            else handlers.current.onSuccess()
          },
        })
        window.google.accounts.id.renderButton(slot, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'center',
          width: Math.min(400, Math.max(200, Math.round(slot.offsetWidth))),
        })
        setReady(true)
      } catch (err) {
        if (!cancelled) handlers.current.onError(err instanceof Error ? err.message : 'Could not load Google sign-in.')
      }
    })()

    return () => { cancelled = true }
  }, [])

  return (
    <div className="relative flex h-12.5 w-full items-center justify-center">
      <div
        ref={slotRef}
        aria-hidden={!ready}
        className={`flex w-full justify-center ${disabled || busy ? 'pointer-events-none opacity-60' : ''}`}
      />
      {(!ready || busy) && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full border border-[#E5E5EA] bg-white">
          <Loader2 className="size-5 animate-spin text-brand" />
        </div>
      )}
    </div>
  )
}
