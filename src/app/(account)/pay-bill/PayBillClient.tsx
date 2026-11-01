'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight } from 'lucide-react'
import { useAuthPrompt } from '@/lib/context/AuthPromptContext'
import { useLocation } from '@/lib/context/LocationContext'
import { MEMBERSHIP_BADGE } from '@/lib/cashbackBadge'
import type { CashbackPlan } from '@/lib/cashback'
import { fetchCashbackBalance } from '@/lib/services/cashbackBalance'
import { cn, formatDistanceKm, haversineKm } from '@/lib/utils'
import { resolveMerchantTrace, resolveSessionId } from '@/lib/utils/payment'
import { usePaymentWindow } from '@/lib/hooks/usePaymentWindow'
import {
  MAX_BILL_DIGITS,
  PENDING_BILL_KEY,
  applyOffers,
  autoMerchantOffer,
  fmtMur,
  isAutoApplicable,
  offerHeadline,
  shareOffer,
  type BillOffer,
  type BillQuote,
  type PendingBillPayment,
} from '@/lib/payBill'
import { t, u } from '@/components/sections/dining/designUnit'
import { ProcessingScreen } from '@/components/sections/dining/PaymentScreens'
import { CardButton, Capsule, Radio, RestaurantPanel, type MerchantPanelData } from '@/components/sections/dining/MerchantFlowParts'

const PLAN_LABEL: Record<CashbackPlan, string> = { free: 'Free', premiere: 'Plus', black: 'Black' }
const D = '/figma/detail'
const P = '/figma/paybill'
const INTER = 'font-(family-name:--font-inter)'

type Step = 'amount' | 'summary' | 'method'

export type PayBillRestaurant = MerchantPanelData

/** One line of the bill breakdown. */
function Row({ label, value, accent = false, strong = false }: { label: React.ReactNode; value: string; accent?: boolean; strong?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between', !strong && 'border-b border-dashed border-[#f2c9b8]')} style={{ gap: t(16), padding: `${t(14)} ${t(24)}`, fontSize: t(strong ? 26 : 22) }}>
      <span className={cn('min-w-0 truncate', strong ? 'font-bold text-[#2c2d32]' : 'text-[#5b5a5a]')}>{label}</span>
      <span className={cn('shrink-0', strong ? 'font-bold text-[#2c2d32]' : 'font-semibold', accent ? 'text-[#ff4800]' : 'text-[#2c2d32]')}>{value}</span>
    </div>
  )
}

/**
 * Pay a restaurant bill. Flow from the app — PayBillScreen (amount; the best
 * restaurant offer is applied for you) → BillSummaryScreen (savings, Privé
 * Credits, what's paid) → payment method → the bank's secure card page (card
 * details + OTP / 3-D Secure) → /pay-bill/payment-return. UI from the Figma
 * "Flow Pay Bill" frames: the restaurant on the left, the step in a card.
 */
export function PayBillClient({
  restaurant: r,
  offers,
  plan,
  sharePct,
  cashbackPct,
  upsell,
}: {
  restaurant: PayBillRestaurant
  offers: BillOffer[]
  plan: CashbackPlan
  /** the member's share of a merchant's upfront discount (membership_discount_caps) */
  sharePct: number
  cashbackPct: number
  upsell: { plan: CashbackPlan; pct: number } | null
}) {
  const router = useRouter()
  const { promptLogin } = useAuthPrompt()
  const { location } = useLocation()
  const inputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('amount')
  const [digits, setDigits] = useState('')
  const [quote, setQuote] = useState<{ amount: number; data: BillQuote } | null>(null)
  const [balance, setBalance] = useState(0)
  const [useCredits, setUseCredits] = useState(false)
  const [method, setMethod] = useState<'card' | null>(null)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [authTick, setAuthTick] = useState(0)

  const amount = Number(digits) || 0

  // each step is a history entry, so the browser's back button steps back (as the app's does)
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const s = (e.state as { payBill?: Step } | null)?.payBill
      setStep(s === 'summary' || s === 'method' ? s : 'amount')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // signing in changes the plan (server props), the quotes and the balance
  useEffect(() => {
    const onAuth = () => {
      router.refresh()
      setAuthTick(n => n + 1)
    }
    window.addEventListener('pp:auth', onAuth)
    return () => window.removeEventListener('pp:auth', onAuth)
  }, [router])

  useEffect(() => {
    if (step !== 'amount') return
    const id = setTimeout(() => inputRef.current?.focus(), 150)
    return () => clearTimeout(id)
  }, [step])

  // cashback / repeat reward / credit rules for this amount (debounced like the app's 300ms)
  useEffect(() => {
    if (!(amount > 0)) return
    let live = true
    const id = setTimeout(() => {
      fetch(`/api/pay-bill/quote?restaurant_id=${r.id}&amount=${amount}`, { cache: 'no-store' })
        .then(res => (res.ok ? res.json() : null))
        .then((data: BillQuote | null) => { if (live && data) setQuote({ amount, data }) })
        .catch(() => {})
    }, 300)
    return () => { live = false; clearTimeout(id) }
  }, [amount, r.id, authTick])

  useEffect(() => {
    let live = true
    fetchCashbackBalance().then(b => { if (live) setBalance(b) })
    return () => { live = false }
  }, [authTick])

  const q = quote && quote.amount === amount ? quote.data : null

  // ── offers (PayBillScreen) ──
  const merchantOffers = offers.filter(isAutoApplicable)
  const extraOffers = offers.filter(o => !isAutoApplicable(o))
  const autoOffer = autoMerchantOffer(offers, amount, sharePct)
  const primary = autoOffer ?? merchantOffers[0] ?? null
  const application = useMemo(() => applyOffers(amount, autoOffer ? [shareOffer(autoOffer, sharePct)] : []), [amount, autoOffer, sharePct])
  const repeatDiscount = q?.repeatReward?.discount ?? 0
  const discount = Math.round((application.discount + repeatDiscount) * 100) / 100
  const cashback = Math.round((application.cashback + (q?.cashback ?? 0)) * 100) / 100
  const unlockGap = primary && !autoOffer && primary.minBillAmount > amount ? primary.minBillAmount - amount : 0

  // ── credits + total (BillSummaryScreen) ──
  const payableBeforeCredits = Math.max(0, amount - discount)
  const maxCreditSpend = Math.max(0, Math.round((payableBeforeCredits - 1) * 100) / 100)
  const burnCap = q?.burn ? q.burn.burnableNow : balance
  const creditsUsable = balance > 0 && maxCreditSpend > 0 && burnCap > 0
  const creditsApplied = useCredits && creditsUsable ? Math.round(Math.max(0, Math.min(balance, maxCreditSpend, burnCap)) * 100) / 100 : 0
  const toPay = Math.round((payableBeforeCredits - creditsApplied) * 100) / 100
  const creditsBlocked = q?.burn && !(q.burn.burnableNow > 0) ? q.burn.blockMessage : ''

  const distanceKm =
    location.lat != null && location.lng != null && r.lat != null && r.lng != null
      ? haversineKm(location.lat, location.lng, Number(r.lat), Number(r.lng))
      : null
  const distance = distanceKm != null ? formatDistanceKm(distanceKm) : null

  function onAmount(value: string) {
    const next = value.replace(/\D/g, '').replace(/^0+/, '')
    if (next.length > MAX_BILL_DIGITS) return
    setDigits(next)
    setError('')
  }

  function go(next: Step) {
    window.history.pushState({ payBill: next }, '', `#${next}`)
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toSummary() {
    if (!(amount > 0)) return
    if (q && !q.loggedIn) { promptLogin(); return }
    go('summary')
  }

  function back() {
    if (step !== 'amount') { window.history.back(); return }
    if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) router.back()
    else router.push(`/dining/${r.id}`)
  }

  // the bank's page opens in its own window; this page follows the session and
  // moves on to the receipt page — which verifies it — however the window ends
  const bank = usePaymentWindow(({ sessionId, merchantTrace, outcome }) => {
    const qs = new URLSearchParams({ session_id: sessionId, merchant_trace: merchantTrace })
    if (outcome) qs.set('outcome', outcome)
    router.replace(`/pay-bill/payment-return?${qs}`)
  })

  async function pay() {
    if (paying || method !== 'card' || !(toPay > 0)) return
    bank.open() // inside the click, so pop-up blockers allow it
    setPaying(true)
    setError('')
    try {
      const res = await fetch('/api/payments/dining/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dining_payload: {
            restaurant_id: r.id,
            amount: toPay,
            original_amount: amount,
            discount_amount: discount,
            cashback_amount: cashback,
            wallet_spend_amount: creditsApplied,
            // app parity: only `offers`-table ids are sent; the backend re-applies them
            selected_offer_ids: autoOffer?.fromOffersTable ? [autoOffer.id] : [],
            payment_instrument_type: 'CARD',
            currency_code: 'MUR',
          },
        }),
      })
      const data = (await res.json()) as Record<string, unknown>
      if (res.status === 401) { setPaying(false); promptLogin(); return }
      if (!res.ok) throw new Error((data.error as string) ?? 'Payment could not be started')

      const sessionId = resolveSessionId(data)
      if (!sessionId) throw new Error('No payment session was returned. Please try again.')
      const pending: PendingBillPayment = {
        sessionId,
        merchantTrace: resolveMerchantTrace(data),
        restaurantId: r.id,
        restaurantName: r.name,
        location: r.area ?? r.city ?? '',
        originalAmount: amount,
        discount,
        paidAmount: toPay,
        cashback,
      }
      try { sessionStorage.setItem(PENDING_BILL_KEY, JSON.stringify(pending)) } catch { /* private mode — the return page falls back to the gateway's numbers */ }

      // the bank's secure page takes the card details and the OTP / 3-D Secure check
      bank.launch(data, { sessionId, merchantTrace: pending.merchantTrace })
    } catch (err) {
      bank.close()
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setPaying(false)
    }
  }

  const title = { amount: 'Enter your bill amount', summary: 'Bill summary', method: 'Select payment method' }[step]
  const shown = digits ? Number(digits).toLocaleString('en-US') : ''

  return (
    <div className='relative overflow-x-clip'>
      {/* the frame's blurred peach circle in the top-left corner */}
      <Image
        src={`${D}/peach-glow.svg`}
        alt=''
        width={1750}
        height={1750}
        aria-hidden='true'
        className='pointer-events-none absolute max-w-none'
        style={{ left: u(-988), top: u(-1150), width: u(1750), height: u(1750) }}
      />

      <div className='relative mx-auto px-4 md:px-[calc(172*var(--u))]' style={{ maxWidth: u(1920), paddingTop: t(48), paddingBottom: t(120) }}>
        <button type='button' onClick={back} className='flex items-center font-semibold text-[#ff4800] hover:text-brand-dark' style={{ fontSize: t(24), height: t(40) }}>
          <Image src={`${D}/back-chevron.svg`} alt='' width={40} height={40} style={{ width: t(40), height: t(40), marginRight: t(-12) }} />
          Back
        </button>

        {/* phones: the place being paid, as the app's header */}
        <div className='mt-3 text-center md:hidden'>
          <p className='text-[14px] font-medium text-[#8e8e93]'>Paying bill to</p>
          <p className='truncate text-[22px] font-bold text-[#1c1c1e]'>{r.name}</p>
          {(r.area || r.city) && <p className='text-[14px] text-[#636366]'>{[r.area, r.city].filter(Boolean).join(', ')}</p>}
        </div>

        <div className='mt-5 grid md:mt-0 md:grid-cols-[calc(560*var(--u))_minmax(0,1fr)] md:items-start md:gap-[calc(43*var(--u))]'>
          <div className='hidden md:block' style={{ marginTop: t(45) }}>
            <RestaurantPanel r={r} distance={distance} />
          </div>

          <section
            aria-live='polite'
            className='flex min-w-0 flex-col bg-white md:shadow-[4px_4px_47px_rgba(0,0,0,0.1)] max-md:rounded-3xl! max-md:border max-md:border-[#efefef] max-md:p-5!'
            style={{ marginTop: t(45), borderRadius: t(40), padding: t(48), minHeight: t(549) }}
          >
            <h1 className='font-semibold text-[#2c2d32]' style={{ fontSize: t(44) }}>{title}</h1>

            {step === 'amount' && (
              <>
                {distanceKm != null && distanceKm >= 1 && (
                  <p
                    className='flex items-center self-start rounded-full bg-linear-to-b from-[#ffd46e] to-[#d7a634] text-[#fffbff]'
                    style={{ marginTop: t(21), height: t(54), padding: `0 ${t(28)} 0 ${t(14)}`, gap: t(16), fontSize: t(22) }}
                  >
                    <Image src={`${P}/info.svg`} alt='' width={26} height={26} className='rotate-180' style={{ width: t(26), height: t(26) }} />
                    You&rsquo;re {distance} away from this restaurant
                  </p>
                )}

                <label className='flex w-full cursor-text flex-col items-start' style={{ marginTop: t(32) }}>
                  <span className='flex items-baseline font-semibold text-[#2a2a2a]' style={{ fontSize: t(60), lineHeight: t(65) }}>
                    <span style={{ letterSpacing: t(-2) }}>MUR</span>&nbsp;
                    {/* the input takes the width of a hidden copy of its text */}
                    <span className='relative inline-block'>
                      <span aria-hidden='true' className='invisible pr-[0.05em] whitespace-pre'>{shown || '0'}</span>
                      <input
                        ref={inputRef}
                        value={shown}
                        onChange={e => onAmount(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') toSummary() }}
                        inputMode='numeric'
                        autoComplete='off'
                        placeholder='0'
                        aria-label='Bill amount in MUR'
                        className='absolute inset-0 w-full bg-transparent p-0 caret-[#ff4800] outline-none placeholder:text-[#c7c7cc]'
                      />
                    </span>
                  </span>
                  <span aria-hidden='true' className='block max-w-full rounded-full bg-linear-to-r from-[#bfc7ff] to-[#999fcc] opacity-50' style={{ marginTop: t(10), width: t(638), height: t(2.5) }} />
                </label>
                <p className='text-[#8e8e93]' style={{ marginTop: t(30), fontSize: t(24), letterSpacing: t(0.4) }}>Enter total amount as shown on the bill</p>

                {/* the restaurant's best offer is applied for you — app parity: PayBillScreen offer cards */}
                {(primary || extraOffers.length > 0) && (
                  <div className='flex flex-wrap' style={{ marginTop: t(28), gap: t(12) }}>
                    {primary && (
                      <span
                        className={cn('flex items-center rounded-full border-solid font-semibold', autoOffer && amount > 0 ? 'border-[#3aa456]/40 bg-[#effaf1] text-[#2c7b44]' : 'border-[#fecdc4] bg-[#fff1ee] text-[#ff4800]')}
                        style={{ minHeight: t(52), padding: `${t(8)} ${t(22)}`, gap: t(10), borderWidth: t(1.5), fontSize: t(20) }}
                      >
                        {autoOffer && amount > 0 && <Check style={{ width: t(22), height: t(22) }} strokeWidth={3} />}
                        <span>
                          {offerHeadline(primary)}
                          <span className='font-normal text-[#5b5a5a]'>
                            {' · '}
                            {autoOffer && amount > 0
                              ? application.discount > 0
                                ? `you save MUR ${fmtMur(application.discount)}`
                                : 'applied'
                              : unlockGap > 0
                                ? `add MUR ${fmtMur(unlockGap)} more to unlock`
                                : 'applied automatically'}
                          </span>
                        </span>
                      </span>
                    )}
                    {extraOffers.slice(0, 2).map(o => (
                      <span key={o.id} className='flex items-center rounded-full border-solid border-[#fecdc4] bg-[#fff1ee] font-semibold text-[#ff4800]' style={{ minHeight: t(52), padding: `${t(8)} ${t(22)}`, borderWidth: t(1.5), fontSize: t(20) }}>
                        {offerHeadline(o)}
                      </span>
                    ))}
                  </div>
                )}

                <div className='mt-auto' style={{ paddingTop: t(48) }}>
                  <CardButton onClick={toSummary} disabled={!(amount > 0)}>Apply offers &amp; pay</CardButton>
                </div>
              </>
            )}

            {step === 'summary' && (
              <>
                <div className='flex flex-wrap items-end' style={{ marginTop: t(24), gap: `${t(8)} ${t(18)}` }}>
                  <p className='font-semibold text-[#2a2a2a]' style={{ fontSize: t(60), lineHeight: t(65), letterSpacing: t(-2) }}>MUR {fmtMur(payableBeforeCredits)}</p>
                  {discount > 0 && <p className='text-[#8e8e93] line-through' style={{ fontSize: t(28), paddingBottom: t(6) }}>MUR {fmtMur(amount)}</p>}
                </div>
                {discount > 0 && (
                  <p className='self-start rounded-full bg-[#3aa456] text-white' style={{ marginTop: t(14), padding: `${t(8)} ${t(20)}`, fontSize: t(20) }}>
                    Wow! You are saving <span className='font-bold'>MUR {fmtMur(discount)}!</span>
                  </p>
                )}

                <div className='grid lg:grid-cols-2' style={{ marginTop: t(32), gap: t(28) }}>
                  {/* left — earning + options */}
                  <div className='flex min-w-0 flex-col' style={{ gap: t(16) }}>
                    {cashbackPct > 0 && (
                      // app parity: BillSummaryScreen CashbackPromo
                      <div className='relative w-full overflow-hidden text-white' style={{ aspectRatio: '1290 / 596', borderRadius: t(28) }}>
                        <Image src='/paybill/total-cashback.webp' alt='' fill sizes='(min-width: 1920px) 440px, 30vw' className='object-cover' />
                        <div className='relative flex h-full flex-col justify-between' style={{ padding: t(22) }}>
                          <span className='self-start rounded-full bg-white/20 font-bold backdrop-blur-sm' style={{ padding: `${t(6)} ${t(14)}`, fontSize: t(15), letterSpacing: t(1) }}>
                            YOU WILL EARN {cashbackPct}% CASH BACK
                          </span>
                          <div>
                            {plan !== 'free' && <Image src={MEMBERSHIP_BADGE[plan]} alt={`Privé ${PLAN_LABEL[plan]}`} width={102} height={44} className='h-auto' style={{ width: t(110), marginBottom: t(4) }} />}
                            <p className='flex items-baseline' style={{ gap: t(8) }}>
                              <span className='leading-none font-bold' style={{ fontSize: t(44) }}>{Math.round(balance).toLocaleString('en-US')}</span>
                              <span className='font-(family-name:--font-libre-baskerville) font-bold italic' style={{ fontSize: t(20) }}>Privé</span>
                              <span className='font-semibold' style={{ fontSize: t(20) }}>Credits</span>
                            </p>
                            <p className='text-white/85' style={{ marginTop: t(4), fontSize: t(15) }}>
                              1 <span className='font-(family-name:--font-libre-baskerville) italic'>Privé</span> Credit = MUR 1
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Capsule
                      role='switch'
                      selected={creditsApplied > 0}
                      disabled={!creditsUsable}
                      onClick={() => setUseCredits(v => !v)}
                      icon={<Image src='/membership/Wallet.webp' alt='' width={40} height={40} style={{ width: t(40), height: t(40) }} />}
                      title='Use Privé Credits'
                      sub={
                        creditsApplied > 0
                          ? `MUR ${fmtMur(creditsApplied)} applied`
                          : creditsBlocked || (burnCap < balance ? `Use up to MUR ${fmtMur(burnCap)} of MUR ${fmtMur(balance)}` : `MUR ${fmtMur(balance)} is available`)
                      }
                      trailing={<Radio on={creditsApplied > 0} />}
                    />

                    {upsell && upsell.pct > cashbackPct && (
                      <Link
                        href='/membership'
                        className='flex w-full items-center border-solid border-[#d5d5d5] bg-white transition-colors hover:border-[#bdbdbd]'
                        style={{ maxWidth: t(513), minHeight: t(81), borderWidth: t(1.5), borderRadius: t(40.5), padding: `${t(10)} ${t(30)} ${t(10)} ${t(16)}`, gap: t(16) }}
                      >
                        <Image src={MEMBERSHIP_BADGE[upsell.plan]} alt='' width={92} height={40} className='w-auto' style={{ height: t(44) }} />
                        <span className='min-w-0 flex-1'>
                          <span className='block truncate font-bold text-[#2c2d32]' style={{ fontSize: t(22) }}>{upsell.pct}% cashback with {PLAN_LABEL[upsell.plan]}</span>
                          <span className='block truncate text-[#8e8e93]' style={{ fontSize: t(18) }}>See membership plans</span>
                        </span>
                        <ChevronRight className='text-[#8e8e93]' style={{ width: t(24), height: t(24) }} />
                      </Link>
                    )}

                    {extraOffers.length > 0 && (
                      <p className='text-[#8e8e93]' style={{ fontSize: t(18) }}>
                        Card offers ({extraOffers.slice(0, 2).map(offerHeadline).join(', ')}) are applied by your bank when you pay with an eligible card.
                      </p>
                    )}
                  </div>

                  {/* right — the breakdown */}
                  <div className='min-w-0'>
                    <div className='overflow-hidden border border-[#f6dccf] bg-linear-to-b from-white to-[#ffe8de]' style={{ borderRadius: t(24) }}>
                      <Row label='Total bill amount' value={`MUR ${fmtMur(amount)}`} />
                      {application.discount > 0 && autoOffer && <Row label={`Offer “${offerHeadline(autoOffer)}”`} value={`-MUR ${fmtMur(application.discount)}`} accent />}
                      {repeatDiscount > 0 && <Row label={q?.repeatReward?.label} value={`-MUR ${fmtMur(repeatDiscount)}`} accent />}
                      {creditsApplied > 0 && <Row label='Privé Credits' value={`-MUR ${fmtMur(creditsApplied)}`} accent />}
                      <div className='bg-linear-to-r from-[#fff3ee] to-[#ffe8de]'>
                        <Row label='To be paid' value={`MUR ${fmtMur(toPay)}`} strong />
                      </div>
                    </div>
                    {cashback > 0 && (
                      <p className={`flex items-center font-semibold text-[#424144] ${INTER}`} style={{ marginTop: t(16), gap: t(6), fontSize: t(16) }}>
                        <Image src={`${D}/earn-coin.png`} alt='' width={40} height={40} style={{ width: t(40), height: t(40) }} />
                        You&rsquo;ll earn <span className='text-[#0248f6]'>MUR {fmtMur(cashback)} in Privé Credits</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className='mt-auto' style={{ paddingTop: t(40) }}>
                  <CardButton onClick={() => go('method')} disabled={!(toPay > 0)}>Proceed to pay MUR {fmtMur(toPay)}</CardButton>
                </div>
              </>
            )}

            {step === 'method' && (
              <>
                <p className='text-[#8e8e93]' style={{ marginTop: t(8), fontSize: t(24), letterSpacing: t(0.4) }}>Paying MUR {fmtMur(toPay)}</p>
                <div style={{ marginTop: t(44) }}>
                  <Capsule
                    role='radio'
                    selected={method === 'card'}
                    onClick={() => setMethod('card')}
                    icon={<Image src={`${P}/credit-card.svg`} alt='' width={36} height={36} style={{ width: t(36), height: t(36) }} />}
                    title='Credit/Debit Card'
                    trailing={
                      method === 'card' ? (
                        <Check className='text-[#ff4800]' style={{ width: t(26), height: t(26) }} strokeWidth={3} />
                      ) : (
                        <Image src={`${P}/chevron.svg`} alt='' width={14} height={24} className='rotate-180' style={{ width: t(13.5), height: t(24) }} />
                      )
                    }
                  />
                </div>
                <p className='text-[#8e8e93]' style={{ marginTop: t(20), fontSize: t(18) }}>
                  You&rsquo;ll enter your card details and the OTP from your bank on its secure page.
                </p>
                {error && (
                  <p role='alert' className='self-start rounded-2xl bg-[#fdecec] font-medium text-[#c62828]' style={{ marginTop: t(20), padding: `${t(12)} ${t(18)}`, fontSize: t(18) }}>
                    {error}
                  </p>
                )}
                <div className='mt-auto' style={{ paddingTop: t(48) }}>
                  <CardButton onClick={pay} disabled={method !== 'card' || paying}>Confirm Payment</CardButton>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {paying && !bank.waiting && <ProcessingScreen sub='Opening your bank’s secure page — please do not close this window' />}
      {bank.waiting && (
        <ProcessingScreen title='Waiting for your payment…' sub='Enter your card details and the OTP in the bank’s secure window. We’ll bring you to your receipt as soon as it’s done.'>
          <div className='flex flex-wrap justify-center' style={{ marginTop: t(12), gap: t(16) }}>
            <button
              type='button'
              onClick={bank.focus}
              className='rounded-full bg-[#ff4800] font-semibold text-white hover:bg-brand-dark'
              style={{ height: t(64), padding: `0 ${t(36)}`, fontSize: t(22) }}
            >
              Show payment window
            </button>
            <button
              type='button'
              onClick={bank.cancel}
              className='rounded-full border border-[#d5d5d5] font-semibold text-[#5b5a5a] hover:border-[#bdbdbd]'
              style={{ height: t(64), padding: `0 ${t(36)}`, fontSize: t(22) }}
            >
              Cancel
            </button>
          </div>
        </ProcessingScreen>
      )}
    </div>
  )
}
