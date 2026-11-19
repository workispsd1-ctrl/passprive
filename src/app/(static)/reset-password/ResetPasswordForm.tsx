'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

/**
 * New password for the account the reset link signed in — app parity:
 * screens/ResetPassword.jsx (two fields, must match; saved by /api/auth/password). Styled like
 * the email login card.
 */
export function ResetPasswordForm({ hasSession }: { hasSession: boolean }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [shown, setShown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function save() {
    if (!password || !confirm) { setError('Please fill in both password fields.'); return }
    if (password !== confirm) { setError('Passwords don’t match.'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }).catch(() => null)
    const data = (await res?.json().catch(() => null)) as { error?: string } | null
    setLoading(false)
    if (!res?.ok) { setError(data?.error ?? 'No connection. Check your internet and try again.'); return }
    setDone(true)
    router.refresh()
  }

  const field =
    'flex h-[54px] w-full items-center gap-3 rounded-full border border-[#E5E5EA] bg-white px-4 focus-within:border-[1.5px] focus-within:border-brand'
  const input = 'h-full min-w-0 flex-1 bg-transparent text-[14px] text-[#1A1325] outline-none placeholder:text-[#8E8E93]'

  return (
    <div className="flex w-full max-w-[480px] flex-col gap-6 rounded-[24px] bg-white px-6 pt-12 pb-8 font-(family-name:--font-dm-sans) shadow-[0_16px_48px_rgba(0,0,0,0.14)] sm:px-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-[24px] leading-8 font-bold tracking-[-0.02em] text-[#666666]">
          {done ? 'Password updated' : 'Reset password'}
        </h1>
        <p className="text-[14px] leading-[18px] font-medium text-[#8E8E93]">
          {done
            ? 'Your password has been reset. You’re logged in.'
            : !hasSession
              ? 'This reset link has expired or was already used. Open the latest link from your email, or request a new one from the login pop-up.'
              : 'Enter your new password below.'}
        </p>
      </div>

      {done || !hasSession ? (
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex h-[54px] w-full items-center justify-center rounded-full bg-brand text-[16px] font-semibold tracking-[-0.02em] text-white transition-colors hover:bg-brand-dark"
        >
          Go to home
        </button>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <label className={field}>
              <input
                type={shown ? 'text' : 'password'}
                autoComplete="new-password"
                aria-label="New password"
                placeholder="New password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                className={input}
              />
              <button
                type="button"
                onClick={() => setShown(s => !s)}
                aria-label={shown ? 'Hide passwords' : 'Show passwords'}
                className="shrink-0 text-[#8E8E93] hover:text-[#666666]"
              >
                {shown ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </label>
            <label className={field}>
              <input
                type={shown ? 'text' : 'password'}
                autoComplete="new-password"
                aria-label="Confirm new password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && !loading && save()}
                className={input}
              />
            </label>
          </div>
          {error && <p role="alert" className="-my-2 text-center text-[13px] font-semibold text-[#E23B3B]">{error}</p>}
          <button
            type="button"
            onClick={save}
            disabled={loading}
            className="flex h-[54px] w-full items-center justify-center rounded-full bg-brand text-[16px] font-semibold tracking-[-0.02em] text-white transition-colors hover:bg-brand-dark disabled:opacity-70"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : 'Save password'}
          </button>
        </>
      )}
    </div>
  )
}
