'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CODE_LENGTH, COUNTRY_CODE, RESEND_SECONDS, friendlyOtpError, normalizeLocalPhone } from '@/lib/phoneAuth'

/**
 * Login / sign-up by mobile number — app parity: screens/Login.jsx →
 * OtpVerification.jsx → Details.jsx. One flow for both: an existing number
 * is signed in after the code; a new one is asked for name + email.
 * Google stays available as the alternative, like the app.
 */
type Step = 'phone' | 'otp' | 'details'

export default function LoginDialog({
  variant,
  triggerClassName,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  hideTrigger = false,
}: {
  variant?: 'hero'
  triggerClassName?: string
  /** controlled open state (when provided, LoginDialog is a controlled dialog) */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
} = {}) {
  const router = useRouter()
  const [openState, setOpenState] = useState(false)
  const controlled = openProp !== undefined
  const open = controlled ? openProp : openState
  const setOpen = (next: boolean) => {
    if (controlled) onOpenChangeProp?.(next)
    else setOpenState(next)
  }

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendIn, setResendIn] = useState(0)

  // resend countdown
  useEffect(() => {
    if (step !== 'otp' || resendIn <= 0) return
    const t = setTimeout(() => setResendIn(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [step, resendIn])

  function reset() {
    setStep('phone')
    setPhone('')
    setCode('')
    setFullName('')
    setEmail('')
    setError('')
    setLoading(false)
    setGoogleLoading(false)
    setResendIn(0)
  }

  function handleOpenChange(next: boolean) {
    if (loading || googleLoading) return
    setOpen(next)
    if (next) reset()
  }

  function finish() {
    setOpen(false)
    // let listeners (e.g. a pending save) know auth changed
    window.dispatchEvent(new Event('pp:auth'))
    router.refresh()
  }

  async function sendCode() {
    const local = normalizeLocalPhone(phone)
    if (!local) { setError('Please enter your mobile number.'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: local }),
    })
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed to send OTP. Please try again.'); return }
    setPhone(local)
    setCode('')
    setResendIn(RESEND_SECONDS)
    setStep('otp')
  }

  async function verify(fullCode: string) {
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code: fullCode }),
    })
    const data = (await res.json().catch(() => ({}))) as { error?: string; registered?: boolean; signedIn?: boolean }
    setLoading(false)
    if (!res.ok) {
      setError(friendlyOtpError(data.error ?? ''))
      setCode('')
      return
    }
    if (data.registered) { finish(); return }
    if (!data.signedIn) {
      // The backend didn't create a session for this new number, so there is
      // no account to attach the profile to yet.
      setError('We couldn’t create your account right now. Please try again or continue with Google.')
      setCode('')
      return
    }
    setStep('details')
  }

  async function saveDetails() {
    if (!fullName.trim() || !email.trim()) { setError('Please fill all fields.'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), phone: `${COUNTRY_CODE}${phone}` }),
    })
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed to save. Please try again.'); return }
    finish()
  }

  async function handleResend() {
    if (resendIn > 0 || loading) return
    await sendCode()
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  const busy = loading || googleLoading

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger
          render={
            <Button
              variant={variant === 'hero' ? 'default' : triggerClassName ? 'ghost' : 'outline'}
              size={variant === 'hero' ? 'lg' : 'default'}
              className={
                variant === 'hero'
                  ? 'group mt-10 h-12 px-8 text-base rounded-xl shadow-md hover:shadow-lg transition-shadow'
                  : (triggerClassName ?? '')
              }
            />
          }
        >
          {variant === 'hero' ? (
            <>
              Get started
              <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          ) : (
            'Login'
          )}
        </DialogTrigger>
      )}

      {/* App parity: banner on top + white card overlapping it with 28px
          rounded top corners (phone); side-by-side on wider screens. */}
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden rounded-[28px] bg-white p-0 font-(family-name:--font-dm-sans) ring-0 sm:max-w-[820px] md:grid-cols-[1fr_1fr]"
      >
        <AuthBanner variant={step === 'otp' ? 'otp' : 'carousel'} />

        <button
          type="button"
          onClick={() => handleOpenChange(false)}
          disabled={busy}
          className="absolute top-4 right-4 z-20 rounded-full bg-white/25 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur hover:bg-white/35 md:bg-black/5 md:text-[#666666] md:hover:bg-black/10"
        >
          {step === 'phone' ? 'Skip' : 'Close'}
        </button>

        <div className="relative z-10 -mt-7 overflow-y-auto rounded-t-[28px] bg-white px-6 pt-8 pb-6 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] md:mt-0 md:flex md:flex-col md:justify-center md:rounded-none md:px-10 md:shadow-none">
          {step === 'phone' && (
            <>
              <DialogTitle className="mb-4.5 text-center text-[18px] font-bold tracking-[-0.36px] text-[#666666]">
                Log in or sign up
              </DialogTitle>
              <DialogDescription className="sr-only">Enter your mobile number to log in or create an account.</DialogDescription>

              {/* app parity: components/PhoneNumberField.jsx */}
              <label className="flex h-13.5 items-center rounded-full border border-[#E5E5EA] bg-white pr-5 pl-4 focus-within:border-brand">
                <span className="pr-2.5 text-[15px] font-semibold text-[#1A1325]">{COUNTRY_CODE}</span>
                <span className="mr-3 h-5.5 w-px bg-[#E5E5EA]" />
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  autoFocus
                  maxLength={15}
                  aria-label="Mobile number"
                  placeholder="Enter mobile number"
                  value={phone}
                  onChange={e => { setPhone(e.target.value.replace(/[^0-9]/g, '')); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && !busy && sendCode()}
                  className="h-full flex-1 bg-transparent text-[15px] text-[#1A1325] outline-none placeholder:text-[#8E8E93]"
                />
              </label>
              {error && <p className="mt-3 text-center text-[13px] font-semibold text-[#E23B3B]">{error}</p>}

              <button
                type="button"
                disabled={busy}
                onClick={sendCode}
                className="mt-4.5 flex h-13.5 w-full items-center justify-center rounded-full bg-brand text-[16px] font-semibold tracking-[-0.32px] text-white transition-colors hover:bg-brand-dark disabled:opacity-70"
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : 'Continue'}
              </button>

              <div className="my-4.5 flex items-center">
                <div className="h-px flex-1 bg-[#E5E5EA]" />
                <span className="mx-3 text-[16px] font-bold tracking-[-0.32px] text-[#666666]">or continue with</span>
                <div className="h-px flex-1 bg-[#E5E5EA]" />
              </div>

              {/* app parity: single icon-only Google button */}
              <button
                type="button"
                aria-label="Continue with Google"
                disabled={busy}
                onClick={handleGoogleSignIn}
                className="flex h-12.5 w-full items-center justify-center rounded-full border border-[#E5E5EA] bg-white transition-colors hover:bg-gray-50 disabled:opacity-70"
              >
                {googleLoading ? (
                  <Loader2 className="size-5 animate-spin text-brand" />
                ) : (
                  <Image src="/auth/google.webp" alt="" width={24} height={24} />
                )}
              </button>

              <Terms />
            </>
          )}

          {step === 'otp' && (
            <>
              <DialogTitle className="text-center text-[20px] font-bold text-[#1A1325]">OTP Verification</DialogTitle>
              <DialogDescription className="mt-2.5 text-center text-[14px] leading-5 text-[#7A7086]">
                Enter the code we just shared with
                <br />
                <span className="font-bold text-[#1A1325]">{COUNTRY_CODE} {phone}</span>
              </DialogDescription>

              <div className="mt-7 mb-5">
                <OtpBoxes
                  value={code}
                  disabled={loading}
                  error={!!error}
                  onChange={v => {
                    setCode(v)
                    setError('')
                    if (v.length === CODE_LENGTH) verify(v)
                  }}
                />
              </div>

              {loading && (
                <p className="mt-1 flex items-center justify-center gap-2 text-[13px] font-medium text-[#7A7086]">
                  <Loader2 className="size-4 animate-spin text-brand" /> Verifying code…
                </p>
              )}
              {!loading && error && <p className="mt-3 text-center text-[13px] font-semibold text-[#E23B3B]">{error}</p>}

              <p className="mt-3 text-center text-[12.5px] text-[#8E8E93]">
                Didn’t receive the OTP?{' '}
                {resendIn > 0 ? (
                  <>Resend SMS in {resendIn}s</>
                ) : (
                  <button type="button" onClick={handleResend} disabled={loading} className="font-semibold text-brand hover:underline">
                    Resend SMS
                  </button>
                )}
              </p>

              <button
                type="button"
                onClick={() => { setStep('phone'); setCode(''); setError('') }}
                className="mt-4.5 h-12 w-full rounded-full bg-[#F2F2F5] text-[14px] font-semibold text-[#1A1325] transition-colors hover:bg-[#E9E9EE]"
              >
                Try another way
              </button>
            </>
          )}

          {step === 'details' && (
            <>
              <DialogTitle className="text-center text-[20px] font-bold text-[#666666]">Almost there</DialogTitle>
              <DialogDescription className="mt-1.5 text-center text-[13px] text-[#9890A6]">
                A couple of details to personalize your experience.
              </DialogDescription>

              <div className="mt-6 flex flex-col gap-3">
                <input
                  aria-label="Full name"
                  autoFocus
                  placeholder="Full name"
                  value={fullName}
                  onChange={e => { setFullName(e.target.value); setError('') }}
                  className="h-13.5 rounded-[28px] border-[1.5px] border-[#E2E2EA] bg-white px-5 text-[15px] text-[#1A1325] outline-none placeholder:text-[#BCBCC4] focus:border-brand"
                />
                <input
                  aria-label="Email address"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && !busy && saveDetails()}
                  className="h-13.5 rounded-[28px] border-[1.5px] border-[#E2E2EA] bg-white px-5 text-[15px] text-[#1A1325] outline-none placeholder:text-[#BCBCC4] focus:border-brand"
                />
              </div>
              {error && <p className="mt-3 text-center text-[13px] font-semibold text-[#E23B3B]">{error}</p>}

              <button
                type="button"
                disabled={busy}
                onClick={saveDetails}
                className="mt-4.5 flex h-13.5 w-full items-center justify-center rounded-full bg-brand text-[16px] font-semibold tracking-[-0.32px] text-white transition-colors hover:bg-brand-dark disabled:opacity-70"
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : 'Save & continue'}
              </button>
              <Terms />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Terms() {
  return (
    <p className="mt-6 text-center text-[11px] text-[#8E8E93]">
      By continuing you agree to our{' '}
      <Link href="/terms" className="text-[#666666] underline">Terms &amp; Privacy Policy</Link>
    </p>
  )
}

// app parity: components/BannerCarousel.jsx SLIDES + 3.5s auto-advance
const SLIDES = [1, 2, 3, 4, 5].map(i => `/auth/onboarding-${i}.webp`)

/**
 * Login banner — app parity: the onboarding carousel on a blue→peach
 * gradient. The OTP step uses the app's plain orange strip on phones; on
 * desktop the carousel panel stays so the dialog doesn't turn half-orange.
 */
function AuthBanner({ variant }: { variant: 'carousel' | 'otp' }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % SLIDES.length), 3500)
    return () => clearInterval(t)
  }, [])

  return (
    <>
      {/* OTP on phones: the app's short orange strip */}
      {variant === 'otp' && <div aria-hidden className="h-36 bg-linear-to-br from-brand to-[#FF7A3D] md:hidden" />}
      <div
        aria-hidden
        className={`relative h-64 overflow-hidden bg-linear-to-b from-[#2247FF] to-[#FFD1BF] md:h-auto md:min-h-140 ${variant === 'otp' ? 'hidden md:block' : ''}`}
      >
      {SLIDES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          sizes="(max-width: 768px) 100vw, 410px"
          className={`object-cover object-top transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
        <div className="absolute inset-x-0 bottom-10 flex justify-center gap-1.5 md:bottom-6">
          {SLIDES.map((src, i) => (
            <span key={src} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`} />
          ))}
        </div>
      </div>
    </>
  )
}

/** Six single-digit boxes — app parity: components/OtpBoxesInput.jsx. Supports paste. */
function OtpBoxes({ value, onChange, disabled, error }: { value: string; onChange: (v: string) => void; disabled?: boolean; error?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!disabled) refs.current[Math.min(value.length, CODE_LENGTH - 1)]?.focus()
  }, [value.length, disabled])

  function setAt(i: number, digits: string) {
    const clean = digits.replace(/\D/g, '')
    if (!clean) return
    onChange((value.slice(0, i) + clean).slice(0, CODE_LENGTH))
  }

  return (
    <div className="flex justify-center gap-2.5" onPaste={e => { e.preventDefault(); setAt(0, e.clipboardData.getData('text')) }}>
      {Array.from({ length: CODE_LENGTH }, (_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1}`}
          maxLength={CODE_LENGTH}
          disabled={disabled}
          value={value[i] ?? ''}
          onChange={e => setAt(i, e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Backspace') {
              e.preventDefault()
              onChange(value.slice(0, value[i] ? i : Math.max(0, i - 1)))
            }
          }}
          className={`h-11 w-11 rounded-full border text-center text-[18px] font-bold text-[#1A1325] outline-none focus:border-brand disabled:border-[#ECECEF] disabled:bg-[#F2F2F5] ${
            error ? 'border-[#E23B3B] bg-[#FFF5F5]' : value[i] ? 'border-[#D8D8DE] bg-white' : 'border-[#E5E5EA] bg-white'
          }`}
        />
      ))}
    </div>
  )
}
