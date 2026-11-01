'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Check, Info, Loader2, ShoppingBag, Utensils } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { sentence, type RedeemResult, type RevealItem } from '@/lib/deals'

const PIN_LENGTH = 4
const TOKEN_PATTERN = /(?:^|[^a-f0-9])([a-f0-9]{64})(?![a-f0-9])/i

type NdefRecord = { recordType: string; encoding?: string; data?: DataView }
type NdefReader = {
  scan: (opts: { signal: AbortSignal }) => Promise<void>
  onreading: ((event: { message: { records: NdefRecord[] } }) => void) | null
  onreadingerror: (() => void) | null
}

/** Web NFC (Chrome on Android) — the browser equivalent of react-native-nfc-manager. */
function nfcSupported() {
  return typeof window !== 'undefined' && 'NDEFReader' in window
}

/** app parity: nfcRedeem.js tokenFromNdef — the 64-hex merchant token in any record. */
function tokenFromRecords(records: NdefRecord[]): string | null {
  for (const record of records) {
    if (!record.data) continue
    const text = new TextDecoder(record.encoding || 'utf-8').decode(record.data)
    const match = text.match(TOKEN_PATTERN)
    if (match) return match[1].toLowerCase()
  }
  return null
}

async function redeemCall(body: Record<string, unknown>): Promise<RedeemResult> {
  const res = await fetch('/api/deals/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null)
  const data = (await res?.json().catch(() => null)) as RedeemResult | null
  return data ?? { allowed: false, reason: 'Could not redeem this deal right now. Please try again.' }
}

function attemptsNote(left: unknown) {
  const n = Number(left)
  if (!Number.isFinite(n) || n <= 0 || n >= 5) return ''
  return ` ${n} ${n === 1 ? 'attempt' : 'attempts'} left.`
}

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (v: number) => String(v).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** Orange "Redeem your Deal Now" header — app parity: RedeemBackdrop + RedeemHeader. */
function RedeemHeader() {
  return (
    <div className="relative h-32 overflow-hidden bg-linear-to-br from-[#EF5D24] to-[#FACF96] px-6 pt-6 text-white">
      <p className="text-[10px] font-semibold tracking-[2px]">REDEEM YOUR</p>
      <p className="text-[28px] leading-9 font-black italic [text-shadow:0_4px_19px_rgba(0,0,0,0.11)]">
        Deal<span className="text-[#FEEC93]"> Now</span>
      </p>
      <p className="text-[11px]">Get your exclusive discount at the merchant.</p>
      <Image src="/deals/redeem-gift.webp" alt="" width={133} height={121} className="pointer-events-none absolute -right-2 top-2" />
    </div>
  )
}

function PinBody({
  item,
  onSuccess,
  onLimit,
  onBusy,
  onUseNfc,
  onCancel,
}: {
  item: RevealItem
  onSuccess: (r: RedeemResult) => void
  onLimit: (reason: string) => void
  onBusy: (busy: boolean) => void
  onUseNfc?: () => void
  onCancel: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState<'idle' | 'checking' | 'error' | 'success' | 'locked'>('idle')
  const [error, setError] = useState<{ title: string; body: string } | null>(null)
  const [lockedUntil, setLockedUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let active = true
    redeemCall({ action: 'pin_status' }).then(state => {
      if (!active) return
      const until = state?.locked_until ? Date.parse(state.locked_until) : 0
      if (until > Date.now()) {
        setLockedUntil(until)
        setStatus('locked')
      } else {
        inputRef.current?.focus()
      }
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (status !== 'locked' || !lockedUntil) return
    const timer = setInterval(() => {
      const current = Date.now()
      if (current >= lockedUntil) {
        clearInterval(timer)
        setLockedUntil(0)
        setPin('')
        setStatus('idle')
        return
      }
      setNow(current)
    }, 1000)
    return () => clearInterval(timer)
  }, [status, lockedUntil])

  const verify = useCallback(async (digits: string) => {
    if (status === 'checking' || status === 'success') return
    setError(null)
    setStatus('checking')
    onBusy(true)
    const result = await redeemCall({ action: 'pin', kind: item.kind, id: item.id, pin: digits })
    if (result.allowed) {
      setStatus('success')
      setTimeout(() => onSuccess(result), 700)
      return
    }
    onBusy(false)
    const reason = String(result.reason ?? '')
    if (reason === 'locked') {
      const until = result.locked_until ? Date.parse(result.locked_until) : 0
      setPin('')
      if (until > Date.now()) {
        setLockedUntil(until)
        setNow(Date.now())
        setStatus('locked')
      } else {
        setStatus('idle')
      }
      return
    }
    if (/limit reached/i.test(reason)) {
      setStatus('idle')
      onLimit(reason)
      return
    }
    setStatus('error')
    setError(
      reason === 'incorrect pin'
        ? {
            title: 'Incorrect PIN',
            body: attemptsNote(result.attempts_left)
              ? `Ask the merchant to check the PIN and try again.${attemptsNote(result.attempts_left)}`
              : 'The PIN you entered is not valid. Ask the merchant to check and try again.',
          }
        : { title: 'Couldn’t redeem', body: sentence(reason) || 'Something went wrong. Please try again.' },
    )
  }, [item, status, onBusy, onSuccess, onLimit])

  const busy = status === 'checking' || status === 'success' || status === 'locked'

  function onChange(value: string) {
    if (busy) return
    const digits = value.replace(/\D/g, '').slice(0, PIN_LENGTH)
    setPin(digits)
    if (status === 'error') { setStatus('idle'); setError(null) }
    if (digits.length === PIN_LENGTH) verify(digits)
  }

  function confirm() {
    if (status === 'error') {
      setPin('')
      setStatus('idle')
      setError(null)
      inputRef.current?.focus()
      return
    }
    if (pin.length === PIN_LENGTH) verify(pin)
    else inputRef.current?.focus()
  }

  return (
    <div className="px-6 pt-4 pb-6 text-center">
      <Image src="/deals/redeem-pin-phone.webp" alt="" width={112} height={102} className="mx-auto" />
      <DialogTitle className="mt-3 text-[20px] font-bold text-[#2C2D32]">
        {error?.title ?? (status === 'locked' ? 'PIN entry paused' : 'Enter Merchant PIN')}
      </DialogTitle>
      <DialogDescription className={cn('mt-2 text-[14px] leading-4.5 font-semibold', error ? 'text-[#FD2E38]' : 'text-[#666666]')}>
        {error?.body ?? (status === 'locked'
          ? 'Too many wrong attempts. You can try again when the timer ends.'
          : 'Ask the staff for the 4-digit deal PIN and enter it below.')}
      </DialogDescription>

      <label className="relative mt-5 flex justify-center gap-3">
        <span className="sr-only">Merchant PIN</span>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            className={cn(
              'flex size-14 items-center justify-center rounded-lg border bg-[#FAFAFA] transition-colors',
              status === 'error' ? 'border-[#FD2E38] bg-white' : status === 'success' ? 'border-[#1BA94C] bg-white' : 'border-[#E2E1E1]',
              status === 'checking' && 'animate-pulse border-[#FF6A30]',
              status === 'locked' && 'opacity-50',
              i === pin.length && status === 'idle' && 'border-brand',
            )}
          >
            {(i < pin.length || status === 'error' || status === 'success') && (
              <span className={cn('size-3 rounded-full', status === 'error' ? 'bg-[#FD2E38]' : status === 'success' ? 'bg-[#1BA94C]' : 'bg-[#666666]')} />
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          value={pin}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && confirm()}
          inputMode="numeric"
          autoComplete="one-time-code"
          type="password"
          maxLength={PIN_LENGTH}
          disabled={busy}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>

      <button
        type="button"
        onClick={confirm}
        disabled={busy}
        className={cn(
          'mt-6 flex h-12 w-full items-center justify-center rounded-full text-[16px] font-semibold text-white',
          status === 'locked' ? 'bg-[#B8B8B8]' : 'bg-brand hover:bg-brand-dark',
        )}
      >
        {status === 'checking' ? <Loader2 className="size-5 animate-spin" />
          : status === 'locked' ? `Try again in ${formatCountdown(lockedUntil - now)}`
          : status === 'error' ? 'Try Again' : 'Confirm PIN'}
      </button>
      <button
        type="button"
        onClick={onUseNfc ?? onCancel}
        disabled={status === 'checking' || status === 'success'}
        className="mt-3 flex h-12 w-full items-center justify-center rounded-full border border-brand text-[16px] font-semibold text-brand hover:bg-brand-tint"
      >
        {onUseNfc ? 'Back to Tap Now' : 'Cancel'}
      </button>
    </div>
  )
}

function NfcBody({
  item,
  onSuccess,
  onLimit,
  onBusy,
  onUsePin,
}: {
  item: RevealItem
  onSuccess: (r: RedeemResult) => void
  onLimit: (reason: string) => void
  onBusy: (busy: boolean) => void
  onUsePin: () => void
}) {
  const [phase, setPhase] = useState<'tap' | 'holding'>('tap')
  const [note, setNote] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  async function redeem(token: string) {
    onBusy(true)
    const result = await redeemCall({ action: 'nfc', kind: item.kind, id: item.id, token })
    if (result.allowed) { onSuccess(result); return }
    onBusy(false)
    const reason = String(result.reason ?? '')
    if (/limit reached/i.test(reason)) { onLimit(reason); return }
    setPhase('tap')
    setNote(
      reason === 'wrong tag'
        ? 'This tag belongs to a different merchant. Ask the staff for the right tag or use the PIN.'
        : sentence(reason) || 'Something went wrong. Please try again.',
    )
  }

  async function startReading() {
    setNote(null)
    setPhase('holding')
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const Reader = (window as unknown as { NDEFReader: new () => NdefReader }).NDEFReader
      const reader = new Reader()
      reader.onreading = event => {
        controller.abort()
        const token = tokenFromRecords(event.message.records)
        if (token) redeem(token)
        else {
          setPhase('tap')
          setNote('We couldn’t read a PassPrivé tag. Try again or use the PIN.')
        }
      }
      reader.onreadingerror = () => {
        setPhase('tap')
        setNote('We couldn’t read a PassPrivé tag. Try again or use the PIN.')
      }
      await reader.scan({ signal: controller.signal })
    } catch {
      setPhase('tap')
      setNote('NFC isn’t available right now. Allow NFC for this site or use the PIN.')
    }
  }

  return (
    <div className="px-6 pt-4 pb-6 text-center">
      {phase === 'tap' ? (
        <>
          <button type="button" onClick={startReading} aria-label="Tap to redeem with NFC" className="mx-auto block">
            <Image src="/deals/redeem-tap-finger.webp" alt="" width={119} height={124} />
          </button>
          <DialogTitle className="mt-2 text-[24px] font-bold text-[#2C2D32]">Tap here</DialogTitle>
          <DialogDescription className={cn('mt-3 text-[12px] leading-4 font-medium', note ? 'text-[#FD2E38]' : 'text-[#666666]')}>
            {note ?? 'Then hold your phone near the merchant’s NFC device to redeem this deal.'}
          </DialogDescription>
        </>
      ) : (
        <>
          <Image src="/deals/redeem-nfc-phone.webp" alt="" width={135} height={124} className="mx-auto" />
          <DialogTitle className="mt-3 text-[20px] font-bold text-[#2C2D32]">Hold Near Merchant’s Device</DialogTitle>
          <DialogDescription className="mt-2 text-[14px] leading-4.5 font-semibold text-[#666666]">
            Keep your phone close to the merchant’s NFC device until we confirm.
          </DialogDescription>
          <p className="mt-4 flex items-center gap-3 rounded-xl bg-[#FCEDE6] px-5 py-3 text-left text-[12px] font-semibold text-[#2C2D32]">
            <Info className="size-5 shrink-0 text-[#FF6A30]" /> This may take a few seconds.
          </p>
        </>
      )}
      <button
        type="button"
        onClick={() => { abortRef.current?.abort(); onUsePin() }}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-full border border-brand text-[16px] font-semibold text-brand hover:bg-brand-tint"
      >
        Don’t have NFC?
      </button>
    </div>
  )
}

function SuccessBody({
  result,
  merchantName,
  merchantKind,
  onDone,
}: {
  result: RedeemResult
  merchantName: string
  merchantKind: 'restaurant' | 'store'
  onDone: () => void
}) {
  return (
    <div className="px-6 pt-10 pb-6 text-center">
      <span className="relative mx-auto flex size-32.5 items-center justify-center rounded-full bg-[#CEE8D5]">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#CEE8D5] opacity-60 [animation-iteration-count:3]" />
        <span className="relative flex size-28 items-center justify-center rounded-full bg-[#9DD1AB]">
          <span className="flex size-22.5 animate-in zoom-in-50 items-center justify-center rounded-full bg-[#3AA456] duration-500">
            <Check className="size-11 text-white" strokeWidth={3.5} />
          </span>
        </span>
      </span>
      <DialogTitle className="mt-8 text-[24px] leading-8 font-black text-[#2C2D32]">Deal Redeemed Successfully</DialogTitle>
      <DialogDescription className="mt-2 text-[14px] leading-4.5 font-semibold text-[#666666]">
        Your deal has been redeemed. Show this confirmation to the merchant.
      </DialogDescription>
      <div className="mt-6 rounded-[20px] border border-dashed border-[#FF6A30] bg-[#FCEDE6] px-4 pt-2.5 pb-1">
        <p className="text-[12px] font-semibold tracking-[1.44px] text-[#666666]">CONFIRMATION CODE</p>
        <p className="truncate text-[56px] leading-[1.3] font-black text-[#2C2D32]">{result.confirmation_code || '—'}</p>
      </div>
      <div className="mt-6 flex items-center justify-center gap-3 border-t border-[#EAEAEA] pt-5 text-[16px] font-semibold text-[#2C2D32]">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand">
          {merchantKind === 'store' ? <ShoppingBag className="size-4 text-white" /> : <Utensils className="size-4 text-white" />}
        </span>
        <span>PassPrivé Deal</span>
        {merchantName && (
          <>
            <span className="size-1 shrink-0 rounded-full bg-[#2C2D32]" />
            <span className="truncate">{merchantName}</span>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={onDone}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand text-[16px] font-semibold text-white hover:bg-brand-dark"
      >
        Done
      </button>
    </div>
  )
}

/**
 * Redeem a revealed deal at the counter — app parity:
 * components/DealRedeemSheet.jsx. Tap the merchant's NFC tag (Web NFC, where
 * the browser has it) or enter the staff's 4-digit PIN; success shows the
 * confirmation code for the staff.
 */
export function DealRedeemDialog({
  item,
  merchantName,
  merchantKind,
  onClose,
  onRedeemed,
  onLimit,
}: {
  item: RevealItem | null
  merchantName: string
  merchantKind: 'restaurant' | 'store'
  onClose: () => void
  onRedeemed: (item: RevealItem, result: RedeemResult) => void
  onLimit: (reason: string) => void
}) {
  // keyed by item in the parent, so this state starts fresh for every redeem
  const [result, setResult] = useState<RedeemResult | null>(null)
  const [mode, setMode] = useState<'nfc' | 'pin'>(() => (nfcSupported() ? 'nfc' : 'pin'))
  const busyRef = useRef(false)

  const onBusy = useCallback((value: boolean) => { busyRef.current = value }, [])
  const onSuccess = useCallback((value: RedeemResult) => {
    busyRef.current = false
    setResult(value)
  }, [])
  const limit = useCallback((reason: string) => {
    busyRef.current = false
    onClose()
    onLimit(reason)
  }, [onClose, onLimit])

  function finish() {
    if (item && result) onRedeemed(item, result)
    else onClose()
  }

  return (
    <Dialog open={!!item} onOpenChange={open => { if (!open && !busyRef.current) finish() }}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-3xl bg-white p-0 font-(family-name:--font-dm-sans) sm:max-w-sm"
      >
        {item && result ? (
          <SuccessBody result={result} merchantName={merchantName} merchantKind={merchantKind} onDone={finish} />
        ) : item ? (
          <>
            <RedeemHeader />
            {mode === 'nfc' ? (
              <NfcBody item={item} onSuccess={onSuccess} onLimit={limit} onBusy={onBusy} onUsePin={() => setMode('pin')} />
            ) : (
              <PinBody
                item={item}
                onSuccess={onSuccess}
                onLimit={limit}
                onBusy={onBusy}
                onUseNfc={nfcSupported() ? () => setMode('nfc') : undefined}
                onCancel={finish}
              />
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
