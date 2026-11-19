'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { GoogleSignInButton } from '@/components/GoogleSignInButton'
import { EMAIL_CARD, EmailAuth } from '@/components/auth/EmailAuth'
import { CODE_LENGTH, COUNTRY_CODE, RESEND_SECONDS, describeOtpError, normalizeLocalPhone } from '@/lib/phoneAuth'
import { usePlatformFlags } from '@/lib/context/PlatformFlagsContext'
import { describeReferralError } from '@/lib/referral'
import { cn } from '@/lib/utils'

/**
 * Design unit for the auth pop-up (Figma "Flow - Log in or sign up", 1920-wide
 * frames): `--u` is 1px at 1920 and proportional on other desktop widths, so
 * `p-32`, `h-54`, `gap-24` are design px. Below lg it stays 1px.
 */
const AUTH_UNIT = '[--u:1px] lg:[--u:calc(100vw/1920)] [--spacing:var(--u)]'

/** "Remember my details for faster sign in" — the number, kept on this device only. */
const REMEMBER_KEY = 'pp:login-phone'

function readRememberedPhone(): string {
  try { return localStorage.getItem(REMEMBER_KEY) ?? '' } catch { return '' }
}

function writeRememberedPhone(phone: string | null) {
  try {
    if (phone) localStorage.setItem(REMEMBER_KEY, phone)
    else localStorage.removeItem(REMEMBER_KEY)
  } catch { /* storage blocked — nothing to remember */ }
}

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
  // Figma "Flow - Log in or sign up_with email", opened from the OTP step's "Try another way"
  const [emailMode, setEmailMode] = useState(false)
  const [emailBusy, setEmailBusy] = useState(false)
  const [phone, setPhone] = useState('')
  const [remember, setRemember] = useState(true)
  const [code, setCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendIn, setResendIn] = useState(0)
  // code expired / too many attempts: only a resend can continue
  const [locked, setLocked] = useState(false)
  const [notice, setNotice] = useState('')
  // new number: verify-otp's single-use token, traded for the account on the details step
  const [signupToken, setSignupToken] = useState<string | null>(null)
  // app parity: Details.jsx referral field — shown when referrals are on and
  // the account is new, or (already signed in) `my_referral.can_apply`
  const platformFlags = usePlatformFlags()
  const [referralCode, setReferralCode] = useState('')
  const [referralEligible, setReferralEligible] = useState(false)
  // account saved but the code wasn't applied: show why, then Continue
  const [referralNotice, setReferralNotice] = useState('')
  const showReferral = platformFlags.referralEnabled && (!!signupToken || referralEligible)

  // resend countdown
  useEffect(() => {
    if (step !== 'otp' || resendIn <= 0) return
    const t = setTimeout(() => setResendIn(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [step, resendIn])

  function reset() {
    setStep('phone')
    const remembered = readRememberedPhone()
    setPhone(remembered)
    setRemember(true)
    setCode('')
    setFullName('')
    setEmail('')
    setError('')
    setLoading(false)
    setGoogleLoading(false)
    setResendIn(0)
    setLocked(false)
    setNotice('')
    setSignupToken(null)
    setReferralCode('')
    setReferralEligible(false)
    setReferralNotice('')
    setEmailMode(false)
    setEmailBusy(false)
  }

  function handleOpenChange(next: boolean) {
    if (loading || googleLoading || emailBusy) return
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
    if (step === 'phone') writeRememberedPhone(remember ? local : null)
    setLoading(true)
    setError('')
    setNotice('')
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: local }),
    }).catch(() => null)
    const data = (await res?.json().catch(() => ({}))) as { error?: string } | undefined
    setLoading(false)
    if (!res?.ok) {
      const info = describeOtpError(data?.error ?? 'network')
      // app parity: a cooldown still lands on the code screen, timer running
      if (info.kind === 'cooldown' && step === 'phone') {
        setPhone(local)
        setResendIn(info.seconds ?? RESEND_SECONDS)
        setStep('otp')
      } else if (info.kind === 'cooldown') {
        setResendIn(info.seconds ?? RESEND_SECONDS)
      }
      setError(info.message)
      return
    }
    if (step === 'otp') setNotice('A new code has been sent.')
    setPhone(local)
    setCode('')
    setLocked(false)
    setResendIn(RESEND_SECONDS)
    setStep('otp')
  }

  async function verify(fullCode: string) {
    setLoading(true)
    setError('')
    setNotice('')
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code: fullCode }),
    }).catch(() => null)
    const data = (await res?.json().catch(() => ({}))) as
      | { error?: string; registered?: boolean; signedIn?: boolean; signupToken?: string | null }
      | undefined
    setLoading(false)
    if (!res?.ok || !data) {
      const info = describeOtpError(data?.error ?? 'network')
      setError(info.message)
      setCode('')
      if (info.kind === 'locked' || info.kind === 'session') {
        setLocked(true)
        setResendIn(0)
      }
      return
    }
    if (data.registered) { finish(); return }
    setSignupToken(data.signupToken ?? null)
    if (!data.signedIn && !data.signupToken) {
      // The backend didn't create a session for this new number, so there is
      // no account to attach the profile to yet.
      setError('We couldn’t create your account right now. Please try again in a moment.')
      setCode('')
      return
    }
    if (!data.signupToken && platformFlags.referralEnabled) {
      fetch('/api/referral')
        .then(r => (r.ok ? r.json() : null))
        .then((info: { can_apply?: boolean } | null) => setReferralEligible(!!info?.can_apply))
        .catch(() => setReferralEligible(false))
    }
    setStep('details')
  }

  async function saveDetails() {
    if (!fullName.trim() || !email.trim()) { setError('Please fill all fields.'); return }
    setLoading(true)
    setError('')
    // app parity: an unknown code stops the save; a failed check doesn't
    const enteredCode = showReferral ? referralCode.trim().toUpperCase() : ''
    if (enteredCode) {
      const check = await fetch('/api/referral/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: enteredCode }),
      })
        .then(r => (r.ok ? (r.json() as Promise<{ valid?: boolean }>) : null))
        .catch(() => null)
      if (check?.valid === false) {
        setLoading(false)
        setError("That referral code doesn't exist. Check it or leave the field empty.")
        return
      }
    }
    const details = { fullName: fullName.trim(), email: email.trim(), phone: `${COUNTRY_CODE}${phone}` }
    // Already signed in (older backend) → just fill the profile; otherwise the
    // signup token creates the account first (app parity: Details.jsx).
    const res = await fetch(signupToken ? '/api/auth/otp/register' : '/api/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupToken ? { ...details, signupToken } : details),
    }).catch(() => null)
    const data = (await res?.json().catch(() => ({}))) as { error?: string } | undefined
    setLoading(false)
    if (!res?.ok) {
      const raw = data?.error ?? 'network'
      setError(/network|timeout/i.test(raw) ? describeOtpError(raw).message : raw)
      return
    }
    if (enteredCode) {
      setLoading(true)
      const applyRes = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: enteredCode }),
      })
        .then(r => (r.ok ? (r.json() as Promise<{ ok?: boolean; code?: string } | null>) : null))
        .catch(() => null)
      setLoading(false)
      if (!applyRes?.ok) {
        // the account exists now, so don't save again — explain and continue
        setReferralNotice(
          applyRes ? describeReferralError(applyRes.code) : 'We could not add your referral code. You can add it later from Profile.',
        )
        return
      }
    }
    finish()
  }

  async function handleResend() {
    if (resendIn > 0 || loading) return
    await sendCode()
  }

  const busy = loading || googleLoading
  // Figma "Phone input focused": once a number is typed, the remember option
  // replaces the Google / terms block
  const typing = phone.length > 0

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

      {/* Figma "Authentication pop-up": 512 wide, 32 padding, 24 between blocks */}
      <DialogContent
        showCloseButton={false}
        className={cn(
          AUTH_UNIT,
          'font-(family-name:--font-dm-sans)',
          emailMode
            ? EMAIL_CARD
            : 'flex flex-col gap-24 rounded-[calc(12*var(--u))] bg-white p-32 ring-0 shadow-[0_calc(4*var(--u))_calc(12*var(--u))_rgba(0,0,0,0.08)] sm:max-w-[512px] lg:max-w-512 max-lg:gap-20 max-lg:p-24',
        )}
      >
        {emailMode ? (
          <EmailAuth
            onBack={() => { setEmailMode(false); setError('') }}
            onClose={() => handleOpenChange(false)}
            onDone={finish}
            onBusyChange={setEmailBusy}
          />
        ) : (
        <>
        <DialogHeading
          title={step === 'phone' ? 'Log in or sign up' : step === 'otp' ? 'OTP Verification' : 'Almost there'}
          onClose={() => handleOpenChange(false)}
          disabled={busy}
        />

        {step === 'phone' && (
          <>
            <DialogDescription className="sr-only">Enter your mobile number to log in or create an account.</DialogDescription>

            <div>
              <label className="flex h-54 items-center gap-12 rounded-full border border-[#CAC5CD] px-16 focus-within:border-[1.5px] focus-within:border-brand">
                <span aria-hidden className="text-[calc(20*var(--u))] leading-none">🇲🇺</span>
                <span className="text-[calc(16*var(--u))] font-bold text-[#666666]">{COUNTRY_CODE}</span>
                <span aria-hidden className="h-20 w-px bg-[#CAC5CD]" />
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={15}
                  aria-label="Mobile number"
                  placeholder="Enter mobile number"
                  value={phone}
                  onChange={e => { setPhone(e.target.value.replace(/[^0-9]/g, '')); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && !busy && sendCode()}
                  className="h-full min-w-0 flex-1 bg-transparent text-[calc(14*var(--u))] leading-20 text-[#1A1325] outline-none placeholder:text-[#605D64]"
                />
              </label>
              {error && <ErrorText>{error}</ErrorText>}
            </div>

            {typing && (
              <label className="flex w-fit cursor-pointer items-center gap-4">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="peer sr-only"
                />
                {remember ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/assets/auth/remember-check.svg" alt="" width={23} height={23} className="size-23 shrink-0" />
                ) : (
                  <span aria-hidden className="size-23 shrink-0 rounded-full border-[1.5px] border-[#CAC5CD]" />
                )}
                <span className="font-(family-name:--font-inter) text-[calc(11*var(--u))] text-[#605D64] peer-focus-visible:underline">
                  Remember my details for faster sign in
                </span>
              </label>
            )}

            <PrimaryButton onClick={sendCode} disabled={busy}>
              {loading ? <Loader2 className="size-20 animate-spin" /> : 'Continue'}
            </PrimaryButton>

            {/* hidden, not unmounted, while typing — Google's button keeps its iframe and width */}
            <div
              aria-hidden={typing}
              className={cn('flex flex-col gap-24 max-lg:gap-20', typing && 'invisible -mt-24 h-0 overflow-hidden max-lg:-mt-20')}
            >
              <div className="flex items-center gap-12">
                <span aria-hidden className="h-px flex-1 bg-[#EDEDED]" />
                <span className="text-[calc(16*var(--u))] font-bold tracking-[-0.02em] text-[#666666]">or continue with</span>
                <span aria-hidden className="h-px flex-1 bg-[#EDEDED]" />
              </div>
              <GoogleSignInButton
                disabled={busy || typing}
                onBusyChange={setGoogleLoading}
                onSuccess={finish}
                onError={setError}
              />
              <Terms />
            </div>
          </>
        )}

        {step === 'otp' && (
          <div className="flex flex-col gap-32 max-lg:gap-24">
            <DialogDescription className="text-center text-[calc(14*var(--u))] leading-18 text-[#605D64]">
              Enter the code we just shared with
              <br />
              <span className="font-bold text-[#1A1325]">{COUNTRY_CODE} {phone}</span>
            </DialogDescription>

            <div className="relative">
              <OtpBoxes
                value={code}
                disabled={loading || locked}
                error={!!error && !locked}
                onChange={v => {
                  setCode(v)
                  setError('')
                  if (v.length === CODE_LENGTH) verify(v)
                }}
              />
              {/* Figma "Desktop · OTP loading": dots over the boxes */}
              {loading && (
                <div role="status" className="absolute inset-0 flex items-center justify-center gap-[calc(11*var(--u))] bg-white">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      aria-hidden
                      className="size-[calc(11*var(--u))] animate-bounce rounded-full bg-brand"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                  <span className="sr-only">Verifying code…</span>
                </div>
              )}
              {!loading && error && <ErrorText>{error}</ErrorText>}
              {!loading && !error && notice && (
                <p className="mt-8 text-center text-[calc(13*var(--u))] font-semibold text-[#3AA456]">{notice}</p>
              )}
            </div>

            <p className="text-center text-[calc(14*var(--u))] leading-18 text-[#605D64]">
              Didn’t receive the OTP?{' '}
              {resendIn > 0 ? (
                <>Resend SMS in <span className="font-bold">{formatCountdown(resendIn)}</span></>
              ) : (
                <button type="button" onClick={handleResend} disabled={loading} className="font-bold text-brand hover:underline">
                  Resend SMS
                </button>
              )}
            </p>

            <button
              type="button"
              disabled={loading}
              // opens the email login; its back arrow returns here
              onClick={() => { setEmailMode(true); setError(''); setNotice('') }}
              className="flex h-54 w-full items-center justify-center rounded-full border border-[#CAC5CD] text-[calc(16*var(--u))] font-semibold tracking-[-0.02em] text-[#605D64] transition-colors hover:bg-[#F7F7F8] disabled:opacity-60"
            >
              Try another way
            </button>
          </div>
        )}

        {step === 'details' && (
          <>
            <DialogDescription className="-mt-12 text-[calc(14*var(--u))] leading-20 text-[#605D64] max-lg:-mt-8">
              A couple of details to personalize your experience.
            </DialogDescription>

            <div className="flex flex-col gap-12">
              <TextField
                aria-label="Full name"
                autoFocus
                placeholder="Full name"
                value={fullName}
                onChange={e => { setFullName(e.target.value); setError('') }}
              />
              <TextField
                aria-label="Email address"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && !busy && !referralNotice && saveDetails()}
              />
              {showReferral && (
                <TextField
                  aria-label="Referral code, optional"
                  placeholder="Referral code (optional)"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={12}
                  value={referralCode}
                  disabled={!!referralNotice}
                  onChange={e => { setReferralCode(e.target.value.toUpperCase()); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && !busy && !referralNotice && saveDetails()}
                  className="uppercase placeholder:normal-case"
                />
              )}
              {showReferral && platformFlags.referralRefereeAmount > 0 && (
                <p className="px-8 text-[calc(12*var(--u))] leading-[1.4] text-[#605D64]">
                  Got a code from a friend? You get {platformFlags.referralRefereeAmount.toLocaleString('en-US')} Privé Credits after
                  your first bill paid through PassPrivé.
                </p>
              )}
              {error && <ErrorText>{error}</ErrorText>}
              {referralNotice && (
                <ErrorText>Your account is ready, but your referral code wasn’t added: {referralNotice}</ErrorText>
              )}
            </div>

            <PrimaryButton disabled={busy} onClick={referralNotice ? finish : saveDetails}>
              {loading ? <Loader2 className="size-20 animate-spin" /> : referralNotice ? 'Continue' : 'Save & continue'}
            </PrimaryButton>
            <Terms />
          </>
        )}
        </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** "1:05" / "0:28" */
function formatCountdown(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Figma "Dialog heading": title left, close icon right. */
function DialogHeading({ title, onClose, disabled }: { title: string; onClose: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-16">
      <DialogTitle className="flex-1 text-[calc(18*var(--u))] leading-[calc(26*var(--u))] font-bold text-[#605D64]">
        {title}
      </DialogTitle>
      <button
        type="button"
        onClick={onClose}
        disabled={disabled}
        aria-label="Close"
        className="-m-4 rounded-full p-4 transition-colors hover:bg-black/5 disabled:opacity-50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/auth/close.svg" alt="" width={24} height={24} className="size-24" />
      </button>
    </div>
  )
}

function PrimaryButton({ children, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      {...props}
      className="flex h-54 w-full items-center justify-center rounded-full bg-brand text-[calc(16*var(--u))] font-semibold tracking-[-0.02em] text-white transition-colors hover:bg-brand-dark disabled:opacity-70"
    >
      {children}
    </button>
  )
}

function TextField({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      {...props}
      className={cn(
        'h-54 rounded-full border border-[#CAC5CD] bg-white px-20 text-[calc(14*var(--u))] text-[#1A1325] outline-none placeholder:text-[#605D64] focus:border-[1.5px] focus:border-brand disabled:bg-[#F2F2F5]',
        className,
      )}
    />
  )
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="mt-8 text-center text-[calc(13*var(--u))] font-semibold text-[#E23B3B]">{children}</p>
}

function Terms() {
  return (
    <p className="text-center font-(family-name:--font-inter) text-[calc(12*var(--u))] text-[#605D64]">
      By continuing you agree to our{' '}
      <Link href="/terms" className="underline">Terms &amp; Privacy Policy</Link>
    </p>
  )
}

/** Six single-digit boxes — Figma "Six-digit verification code" (448 wide, 12 gaps, 56 tall). Supports paste. */
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
    <div
      // app parity: OtpBoxesInput — a wrong code shakes the boxes
      className="pp-motion flex gap-12 max-lg:gap-8"
      style={error ? { animation: 'pp-shake 260ms linear' } : undefined}
      onPaste={e => { e.preventDefault(); setAt(0, e.clipboardData.getData('text')) }}
    >
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
          className={cn(
            'h-56 w-full min-w-0 flex-1 rounded-[calc(12*var(--u))] border text-center text-[calc(20*var(--u))] font-bold text-[#1A1325] outline-none focus:border-[1.5px] focus:border-brand disabled:bg-[#F7F7F8]',
            error ? 'border-[#E23B3B] bg-[#FFF5F5]' : 'border-[#CAC5CD] bg-white',
          )}
        />
      ))}
    </div>
  )
}
