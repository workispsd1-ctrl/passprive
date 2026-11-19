'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, Loader2, X } from 'lucide-react'
import { DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { GoogleSignInButton } from '@/components/GoogleSignInButton'
import { createClient } from '@/lib/supabase/client'
import { ensureUserRow } from '@/lib/authUser'
import { cn } from '@/lib/utils'

/**
 * Figma "Flow - Log in or sign up_with email": email → "Excited to have you
 * here" (password) for a known address, or → "Create account" for a new one.
 * Rendered inside LoginDialog's DialogContent (which carries the design unit),
 * opened from the OTP step's "Try another way".
 */
type Step = 'email' | 'password' | 'create'

/** DialogContent classes for this flow's card: 480 wide, 56/40/32 padding, 24 radius. */
export const EMAIL_CARD =
  'flex flex-col gap-24 rounded-[calc(24*var(--u))] bg-white px-40 pt-56 pb-32 ring-0 shadow-[0_calc(16*var(--u))_calc(48*var(--u))_rgba(0,0,0,0.14)] sm:max-w-[480px] lg:max-w-480 max-lg:px-24 max-lg:pt-48 max-lg:pb-24'

export function EmailAuth({
  onBack,
  onClose,
  onDone,
  onBusyChange,
}: {
  /** back to the OTP step */
  onBack: () => void
  onClose: () => void
  onDone: () => void
  onBusyChange: (busy: boolean) => void
}) {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const busy = loading || googleLoading
  useEffect(() => { onBusyChange(busy) }, [busy, onBusyChange])

  function go(next: Step) {
    setStep(next)
    setPassword('')
    setError('')
    setNotice('')
  }

  async function checkEmail() {
    const clean = email.trim().toLowerCase()
    if (!clean) { setError('Please enter your email address.'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/email/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: clean }),
    }).catch(() => null)
    const data = (await res?.json().catch(() => null)) as { exists?: boolean; error?: string } | null
    setLoading(false)
    if (!res?.ok || !data) { setError(data?.error ?? 'No connection. Check your internet and try again.'); return }
    setEmail(clean)
    go(data.exists ? 'password' : 'create')
  }

  async function logIn() {
    if (!password) { setError('Please enter your password.'); return }
    setLoading(true)
    setError('')
    setNotice('')
    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !data.user) {
      setLoading(false)
      setError(
        authError?.code === 'invalid_credentials'
          ? 'Wrong password. Signed up with your mobile number? Go back and log in with it instead.'
          : (authError?.message ?? 'Could not log in. Please try again.'),
      )
      return
    }
    await ensureUserRow(supabase, data.user)
    setLoading(false)
    onDone()
  }

  async function forgotPassword() {
    if (busy) return
    setLoading(true)
    setError('')
    setNotice('')
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    })
    setLoading(false)
    if (resetError) { setError(resetError.message || 'Could not send the reset link. Please try again.'); return }
    setNotice('If this email has a password, a reset link is on its way. Check your inbox.')
  }

  async function createAccount() {
    const first = firstName.trim()
    const last = lastName.trim()
    if (!first || !last || !password) { setError('Please fill all fields.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: `${first} ${last}` } },
    })
    if (signUpError) {
      setLoading(false)
      if (signUpError.code === 'user_already_exists') {
        go('password')
        setNotice('This email already has an account. Enter your password to log in.')
        return
      }
      setError(signUpError.message || 'Could not create your account. Please try again.')
      return
    }
    if (!data.session || !data.user) {
      setLoading(false)
      setNotice('Check your email to confirm your account, then log in.')
      return
    }
    await ensureUserRow(supabase, data.user)
    setLoading(false)
    onDone()
  }

  const submit = step === 'email' ? checkEmail : step === 'password' ? logIn : createAccount
  const onEnter = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !busy) submit() }

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={busy}
        aria-label="Close"
        className="absolute top-16 right-16 flex size-32 items-center justify-center rounded-full text-[#666666] transition-colors hover:bg-black/5 disabled:opacity-50"
      >
        <X className="size-20" strokeWidth={2.2} />
      </button>

      {/* "Authentication form": 24 between blocks, 32 on the password screen */}
      <div className={cn('flex flex-col', step === 'password' ? 'gap-32 max-lg:gap-24' : 'gap-24 max-lg:gap-20')}>
        <div className="relative flex flex-col items-center gap-8">
          <button
            type="button"
            onClick={() => (step === 'email' ? onBack() : go('email'))}
            disabled={busy}
            aria-label={step === 'email' ? 'Back to OTP verification' : 'Back'}
            className="absolute top-0 -left-16 flex size-32 items-center justify-center rounded-full text-[#666666] transition-colors hover:bg-black/5 disabled:opacity-50 max-lg:-left-8"
          >
            <ArrowLeft className="size-24" />
          </button>
          <DialogTitle className="px-24 text-center text-[calc(24*var(--u))] leading-[calc(32*var(--u))] font-bold tracking-[-0.02em] text-[#666666]">
            {step === 'email' ? 'Log in or sign up' : step === 'password' ? 'Excited to have you here' : 'Create account'}
          </DialogTitle>
          {step === 'password' ? (
            <DialogDescription className="w-full truncate text-center text-[calc(14*var(--u))] leading-18 font-medium text-[#8E8E93]">
              {email}
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">
              {step === 'email' ? 'Enter your email address to log in or create an account.' : `Create an account for ${email}.`}
            </DialogDescription>
          )}
        </div>

        {step === 'email' && (
          <Field
            type="email"
            autoComplete="email"
            aria-label="Email address"
            placeholder="Enter email address"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            onKeyDown={onEnter}
          />
        )}

        {step === 'password' && (
          <div className="flex flex-col gap-12">
            <PasswordField
              autoComplete="current-password"
              placeholder="Enter password"
              value={password}
              onChange={v => { setPassword(v); setError('') }}
              onKeyDown={onEnter}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={forgotPassword}
                disabled={busy}
                className="text-[calc(14*var(--u))] leading-18 font-semibold text-brand hover:underline disabled:opacity-60"
              >
                Forgot password?
              </button>
            </div>
          </div>
        )}

        {step === 'create' && (
          <div className="flex flex-col gap-12">
            <Field
              autoComplete="given-name"
              aria-label="First name"
              placeholder="First name"
              value={firstName}
              onChange={e => { setFirstName(e.target.value); setError('') }}
              onKeyDown={onEnter}
            />
            <Field
              autoComplete="family-name"
              aria-label="Last name"
              placeholder="Last name"
              value={lastName}
              onChange={e => { setLastName(e.target.value); setError('') }}
              onKeyDown={onEnter}
            />
            <PasswordField
              autoComplete="new-password"
              placeholder="Create password"
              value={password}
              onChange={v => { setPassword(v); setError('') }}
              onKeyDown={onEnter}
            />
          </div>
        )}

        {(error || notice) && (
          <p
            role={error ? 'alert' : 'status'}
            className={cn(
              '-my-8 text-center text-[calc(13*var(--u))] leading-18 font-semibold',
              error ? 'text-[#E23B3B]' : 'text-[#3AA456]',
            )}
          >
            {error || notice}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="flex h-54 w-full items-center justify-center rounded-full bg-brand text-[calc(16*var(--u))] leading-21 font-semibold tracking-[-0.02em] text-white transition-colors hover:bg-brand-dark disabled:opacity-70"
        >
          {loading ? <Loader2 className="size-20 animate-spin" /> : step === 'email' ? 'Continue' : step === 'password' ? 'Log in' : 'Create account'}
        </button>
      </div>

      {/* "Form section": divider + social row (Google only — Apple isn't enabled) */}
      {step === 'email' && (
        <div className="flex flex-col gap-18">
          <div className="flex items-center gap-12">
            <span aria-hidden className="h-px flex-1 bg-[#EDEDED]" />
            <span className="text-[calc(16*var(--u))] leading-21 font-semibold tracking-[-0.02em] text-[#666666]">or continue with</span>
            <span aria-hidden className="h-px flex-1 bg-[#EDEDED]" />
          </div>
          <GoogleSignInButton disabled={busy} onBusyChange={setGoogleLoading} onSuccess={onDone} onError={setError} />
        </div>
      )}

      <p className="text-center text-[calc(12*var(--u))] leading-18 text-[#8E8E93]">
        By continuing you agree to our{' '}
        <Link href="/terms" className="underline">Terms &amp; Privacy Policy</Link>
      </p>
    </>
  )
}

const FIELD =
  'flex h-54 w-full items-center gap-12 rounded-full border border-[#E5E5EA] bg-white px-16 focus-within:border-[1.5px] focus-within:border-brand'
const INPUT =
  'h-full min-w-0 flex-1 bg-transparent text-[calc(14*var(--u))] leading-18 tracking-[-0.01em] text-[#1A1325] outline-none placeholder:text-[#8E8E93]'

function Field(props: React.ComponentProps<'input'>) {
  return (
    <label className={FIELD}>
      <input {...props} className={INPUT} />
    </label>
  )
}

function PasswordField({
  value,
  onChange,
  placeholder,
  autoComplete,
  onKeyDown,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoComplete: string
  onKeyDown: (e: React.KeyboardEvent) => void
}) {
  const [shown, setShown] = useState(false)
  return (
    <label className={FIELD}>
      <input
        type={shown ? 'text' : 'password'}
        autoComplete={autoComplete}
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className={INPUT}
      />
      <button
        type="button"
        onClick={() => setShown(s => !s)}
        aria-label={shown ? 'Hide password' : 'Show password'}
        className="shrink-0 text-[#8E8E93] hover:text-[#666666]"
      >
        {shown ? <EyeOff className="size-20" /> : <Eye className="size-20" />}
      </button>
    </label>
  )
}
