'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { CODE_LENGTH, COUNTRY_CODE, RESEND_SECONDS, describeOtpError, normalizeLocalPhone } from '@/lib/phoneAuth'
import { GENDER_OPTIONS, type ProfileDetails } from '@/lib/profileDetails'
import { cn } from '@/lib/utils'

/*
 * Profile details — app parity: screens/ProfileDetailsScreen.jsx +
 * OtpVerification.jsx (mode "changePhone"). Name, address, gender and date of
 * birth save together from the bar that appears once something changes; the
 * phone number changes on its own, after the new number is verified by SMS.
 */

const LABEL = 'mt-24 mb-8 block text-[calc(16*var(--u))] leading-6 font-semibold text-[#1D1B20] max-lg:text-[15px]'
const FIELD =
  'flex h-56 w-full items-center rounded-[calc(12*var(--u))] border border-[#D5D5D5] bg-white px-16 text-[calc(16*var(--u))] text-[#1D1B20] outline-none focus-within:border-[#FF6A30] focus:border-[#FF6A30] max-lg:h-12 max-lg:rounded-xl max-lg:text-[15px]'
const BTN = 'flex h-48 items-center justify-center rounded-full px-24 text-[calc(16*var(--u))] font-semibold transition-colors disabled:opacity-60 max-lg:h-11 max-lg:text-[15px]'
const BTN_PRIMARY = cn(BTN, 'bg-[#FF6A30] text-white hover:bg-[#F25A1F]')
const BTN_GHOST = cn(BTN, 'border border-[#D5D5D5] text-[#1D1B20] hover:bg-[#F7F7F7]')

const today = () => new Date().toISOString().slice(0, 10)
/** last 8 digits — the app's "already your number" check */
const tail = (p: string) => p.replace(/\D/g, '').slice(-8)

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null)
  const data = (await res?.json().catch(() => null)) as { error?: string; phone?: string } | null
  return { ok: !!res?.ok, error: data?.error ?? (res ? '' : 'network'), phone: data?.phone }
}

export function ProfileDetailsClient({ initial }: { initial: ProfileDetails }) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const set = <K extends keyof ProfileDetails>(key: K) => (value: ProfileDetails[K]) => {
    setForm(f => ({ ...f, [key]: value }))
    setDirty(true)
    setSaveMsg(null)
  }

  async function save() {
    if (!form.fullName.trim()) {
      setSaveMsg({ ok: false, text: 'Please enter your name.' })
      return
    }
    setSaving(true)
    const res = await fetch('/api/profile/details', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: form.fullName, address: form.address, gender: form.gender, dob: form.dob }),
    }).catch(() => null)
    const data = (await res?.json().catch(() => null)) as { error?: string } | null
    setSaving(false)
    if (!res?.ok) {
      setSaveMsg({ ok: false, text: data?.error || 'Failed to save changes. Please try again.' })
      return
    }
    setDirty(false)
    setSaveMsg({ ok: true, text: 'Changes saved.' })
    // the header / profile drawer show the name too
    window.dispatchEvent(new Event('pp:auth'))
    router.refresh()
  }

  // ── phone change: number → code → verified ──
  const [phoneStep, setPhoneStep] = useState<'view' | 'number' | 'code'>('view')
  const [newPhone, setNewPhone] = useState('')
  const [code, setCode] = useState('')
  const [phoneBusy, setPhoneBusy] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [phoneNotice, setPhoneNotice] = useState('')
  const [resendIn, setResendIn] = useState(0)
  // code expired / too many attempts: only a new code can continue
  const [codeDead, setCodeDead] = useState(false)

  useEffect(() => {
    if (phoneStep !== 'code' || resendIn <= 0) return
    const timer = setTimeout(() => setResendIn(s => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [phoneStep, resendIn])

  function cancelPhone() {
    setPhoneStep('view')
    setNewPhone('')
    setCode('')
    setPhoneError('')
  }

  async function sendCode() {
    const local = normalizeLocalPhone(newPhone)
    if (!local) {
      setPhoneError('Please enter a valid mobile number.')
      return
    }
    if (form.phone && tail(form.phone) === tail(`${COUNTRY_CODE}${local}`)) {
      setPhoneError('This is already your phone number.')
      return
    }
    setPhoneBusy(true)
    setPhoneError('')
    setPhoneNotice('')
    const r = await post('/api/auth/otp/send', { phone: local })
    setPhoneBusy(false)
    if (r.ok) {
      setPhoneStep('code')
      setCode('')
      setCodeDead(false)
      setResendIn(RESEND_SECONDS)
      return
    }
    const info = describeOtpError(r.error || 'network')
    // app parity: a cooldown still lands on the code step, timer running
    if (info.kind === 'cooldown') {
      setPhoneStep('code')
      setResendIn(info.seconds ?? RESEND_SECONDS)
      setPhoneError(info.message)
      return
    }
    setPhoneError(info.message)
  }

  async function verify() {
    if (code.length !== CODE_LENGTH || codeDead) return
    setPhoneBusy(true)
    setPhoneError('')
    const r = await post('/api/auth/otp/change-phone', { phone: newPhone, code })
    setPhoneBusy(false)
    if (r.ok) {
      setForm(f => ({ ...f, phone: r.phone ?? `${COUNTRY_CODE}${normalizeLocalPhone(newPhone)}` }))
      cancelPhone()
      setPhoneNotice('Phone number updated.')
      window.dispatchEvent(new Event('pp:auth'))
      router.refresh()
      return
    }
    const info = describeOtpError(r.error || 'network')
    if (info.kind === 'locked') setCodeDead(true)
    if (info.kind === 'auth') {
      setPhoneError(info.message)
      return
    }
    // "already linked to another account" comes through as written
    setPhoneError(info.kind === 'taken' ? info.message : info.kind === 'unknown' && r.error ? r.error : info.message)
  }

  const initialLetter = (form.fullName[0] || form.email[0] || 'U').toUpperCase()

  return (
    <div className='mx-auto mt-24 max-w-640 lg:mt-32'>
      <div className='flex justify-center'>
        <span className='flex size-96 items-center justify-center rounded-full border-2 border-[#FF6A30] text-[calc(40*var(--u))] font-bold text-[#FF6A30] max-lg:size-20 max-lg:text-[32px]'>
          {initialLetter}
        </span>
      </div>

      <label className={LABEL} htmlFor='pd-name'>Name</label>
      <input
        id='pd-name'
        className={FIELD}
        value={form.fullName}
        onChange={e => set('fullName')(e.target.value)}
        placeholder='Your full name'
        autoComplete='name'
        maxLength={120}
      />

      <span className={LABEL}>Phone number</span>
      <div className={cn(FIELD, 'justify-between gap-12')}>
        <span className={cn('truncate', !form.phone && 'text-[#9E9E9E]')}>{form.phone || 'No phone number added'}</span>
        {phoneStep === 'view' && (
          <button type='button' onClick={() => { setPhoneStep('number'); setPhoneNotice(''); setPhoneError('') }} className='shrink-0 font-semibold text-[#FF6A30] hover:underline'>
            {form.phone ? 'Change' : 'Add'}
          </button>
        )}
      </div>
      {phoneNotice && <p className='mt-8 text-[calc(14*var(--u))] font-medium text-[#2E7D32] max-lg:text-[13px]'>{phoneNotice}</p>}

      {phoneStep === 'number' && (
        <form onSubmit={e => { e.preventDefault(); sendCode() }} className='mt-12 flex flex-col gap-12 rounded-[calc(16*var(--u))] bg-[#FAFAFA] p-16'>
          <div className={cn(FIELD, 'gap-10')}>
            <span className='shrink-0 font-medium text-[#5B5A5A]'>{COUNTRY_CODE}</span>
            <input
              autoFocus
              type='tel'
              inputMode='numeric'
              autoComplete='tel-national'
              value={newPhone}
              onChange={e => { setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 8)); setPhoneError('') }}
              placeholder='New mobile number'
              aria-label='New mobile number'
              className='min-w-0 flex-1 bg-transparent outline-none'
            />
          </div>
          <p className='text-[calc(14*var(--u))] text-[#666666] max-lg:text-[13px]'>We&rsquo;ll send a code to verify the new number.</p>
          {phoneError && <p role='alert' className='text-[calc(14*var(--u))] font-medium text-[#C62828] max-lg:text-[13px]'>{phoneError}</p>}
          <div className='flex gap-12'>
            <button type='button' onClick={cancelPhone} disabled={phoneBusy} className={cn(BTN_GHOST, 'flex-1')}>Cancel</button>
            <button type='submit' disabled={phoneBusy} className={cn(BTN_PRIMARY, 'flex-1')}>
              {phoneBusy ? <Loader2 className='size-20 animate-spin' /> : 'Send code'}
            </button>
          </div>
        </form>
      )}

      {phoneStep === 'code' && (
        <form onSubmit={e => { e.preventDefault(); verify() }} className='mt-12 flex flex-col gap-12 rounded-[calc(16*var(--u))] bg-[#FAFAFA] p-16'>
          <p className='text-[calc(14*var(--u))] text-[#666666] max-lg:text-[13px]'>
            Enter the {CODE_LENGTH}-digit code sent to <span className='font-semibold text-[#1D1B20]'>{COUNTRY_CODE} {newPhone}</span>
          </p>
          <input
            autoFocus
            inputMode='numeric'
            autoComplete='one-time-code'
            value={code}
            onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH)); setPhoneError('') }}
            placeholder={'•'.repeat(CODE_LENGTH)}
            aria-label='Verification code'
            className={cn(FIELD, 'text-center tracking-[0.5em]')}
          />
          {phoneError && <p role='alert' className='text-[calc(14*var(--u))] font-medium text-[#C62828] max-lg:text-[13px]'>{phoneError}</p>}
          <div className='flex items-center justify-between text-[calc(14*var(--u))] max-lg:text-[13px]'>
            <button type='button' onClick={() => { setPhoneStep('number'); setPhoneError('') }} className='font-medium text-[#666666] hover:underline'>
              Change number
            </button>
            {resendIn > 0 ? (
              <span className='text-[#666666]'>Resend code in {resendIn}s</span>
            ) : (
              <button type='button' onClick={sendCode} disabled={phoneBusy} className='font-semibold text-[#FF6A30] hover:underline'>Resend code</button>
            )}
          </div>
          <div className='flex gap-12'>
            <button type='button' onClick={cancelPhone} disabled={phoneBusy} className={cn(BTN_GHOST, 'flex-1')}>Cancel</button>
            <button type='submit' disabled={phoneBusy || code.length !== CODE_LENGTH || codeDead} className={cn(BTN_PRIMARY, 'flex-1')}>
              {phoneBusy ? <Loader2 className='size-20 animate-spin' /> : 'Verify'}
            </button>
          </div>
        </form>
      )}

      <span className={LABEL}>Email</span>
      <div className={cn(FIELD, 'bg-[#FAFAFA] text-[#5B5A5A]')}>
        <span className='truncate'>{form.email || '—'}</span>
      </div>

      <label className={LABEL} htmlFor='pd-gender'>Gender</label>
      <select
        id='pd-gender'
        className={cn(FIELD, 'appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2718%27%20height=%2718%27%20fill=%27none%27%20stroke=%27%239E9E9E%27%20stroke-width=%272%27%20viewBox=%270%200%2024%2024%27%3E%3Cpath%20d=%27m6%209%206%206%206-6%27/%3E%3C/svg%3E")] bg-position-[right_16px_center] bg-no-repeat pr-44', !form.gender && 'text-[#9E9E9E]')}
        value={form.gender}
        onChange={e => set('gender')(e.target.value)}
      >
        <option value=''>Select gender</option>
        {GENDER_OPTIONS.map(g => <option key={g} value={g} className='text-[#1D1B20]'>{g}</option>)}
      </select>

      <label className={LABEL} htmlFor='pd-address'>Address</label>
      <input
        id='pd-address'
        className={FIELD}
        value={form.address}
        onChange={e => set('address')(e.target.value)}
        placeholder='Add your address'
        autoComplete='street-address'
        maxLength={300}
      />

      <label className={LABEL} htmlFor='pd-dob'>Date of birth</label>
      <input
        id='pd-dob'
        type='date'
        className={cn(FIELD, !form.dob && 'text-[#9E9E9E]')}
        value={form.dob}
        max={today()}
        min='1900-01-01'
        onChange={e => set('dob')(e.target.value)}
      />

      {saveMsg && (
        <p role={saveMsg.ok ? 'status' : 'alert'} className={cn('mt-20 text-[calc(14*var(--u))] font-medium max-lg:text-[13px]', saveMsg.ok ? 'text-[#2E7D32]' : 'text-[#C62828]')}>
          {saveMsg.text}
        </p>
      )}

      {/* app parity: the save bar shows once a field changes */}
      {dirty && (
        <div className='fixed inset-x-0 bottom-0 z-40 border-t border-[#E6E0E9] bg-white/95 px-16 py-12 backdrop-blur'>
          <div className='mx-auto flex max-w-640 justify-end'>
            <button type='button' onClick={save} disabled={saving} className={cn(BTN_PRIMARY, 'w-full lg:w-240')}>
              {saving ? <Loader2 className='size-20 animate-spin' /> : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
