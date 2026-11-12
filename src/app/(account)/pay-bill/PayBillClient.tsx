'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ORDER_CART_KEY, matchingOrder, type OrderLine, type PendingOrder } from '@/lib/orderCollect'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { useAuthPrompt } from '@/lib/context/AuthPromptContext'
import { useLocation } from '@/lib/context/LocationContext'
import { MEMBERSHIP_BADGE } from '@/lib/cashbackBadge'
import type { CashbackPlan } from '@/lib/cashback'
import { fetchCashbackBalance } from '@/lib/services/cashbackBalance'
import { cn, formatDistanceKm, haversineKm } from '@/lib/utils'
import { resolveMerchantTrace, resolveSessionId } from '@/lib/utils/payment'
import {
  MAX_BILL_DIGITS,
  PAY_BILL_RESUME_KEY,
  PENDING_BILL_KEY,
  applyOffers,
  billTotals,
  couponState,
  fmtMur,
  offerHeadline,
  offerRangeNote,
  primaryOffer,
  selectedCoupon,
  shareOffer,
  type BillOffer,
  type BillQuote,
  type PendingBillPayment,
} from '@/lib/payBill'
import { t, u } from '@/components/sections/dining/designUnit'
import { ProcessingScreen } from '@/components/sections/dining/PaymentScreens'
import { CardButton, Capsule, Radio, RestaurantPanel, type MerchantPanelData } from '@/components/sections/dining/MerchantFlowParts'

const PLAN_LABEL: Record<CashbackPlan, string> = { free: 'Free', premiere: 'Plus', black: 'Black' }
const D = '/assets/merchant-detail'
const P = '/assets/pay-bill'

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

/** One coupon on the Bill summary — app parity: BillSummaryScreen CouponCard. */
function CouponCard({ offer, amount, applied, onToggle }: { offer: BillOffer; amount: number; applied: boolean; onToggle: () => void }) {
  const { state, note } = couponState(offer, amount)
  const enabled = state === 'apply'
  return (
    <button
      type='button'
      role='radio'
      aria-checked={applied}
      disabled={!enabled}
      onClick={onToggle}
      className={cn('flex shrink-0 flex-col border-dashed bg-[#fff6f2] text-left', applied ? 'border-[#ff4800]' : 'border-[#ff4800]/40')}
      style={{ width: t(290), borderWidth: t(1.5), borderRadius: t(22), padding: t(18), gap: t(4) }}
    >
      {offer.logo ? (
        <Image src={offer.logo} alt='' width={80} height={32} className='w-auto object-contain' style={{ height: t(32) }} />
      ) : (
        <span className='truncate font-bold text-[#ff4800]' style={{ fontSize: t(22) }}>{offerHeadline(offer)}</span>
      )}
      <span className='truncate font-semibold text-[#2c2d32]' style={{ fontSize: t(18) }}>{offer.title}</span>
      {offer.sub && <span className='truncate text-[#767677]' style={{ fontSize: t(16) }}>{offer.sub}</span>}
      <span className='flex items-center border-t border-dashed border-[#ff4800]/40' style={{ marginTop: t(10), paddingTop: t(10), gap: t(8), fontSize: t(17) }}>
        {enabled ? (
          <>
            <Radio on={applied} />
            <span className='font-semibold text-[#ff4800]'>{applied ? 'Applied' : 'Apply'}</span>
          </>
        ) : (
          <span className='truncate text-[#8e8e93]'>{note}</span>
        )}
      </span>
    </button>
  )
}

/** The payment gateway's page, embedded as the app's WebView does; the page follows the session. */
function PaymentFrame({ src, srcDoc, onCancel }: { src: string; srcDoc: string; onCancel: () => void }) {
  return (
    <div className='fixed inset-0 z-50 flex flex-col bg-white'>
      <div className='flex items-center justify-between border-b border-[#efefef]' style={{ padding: `${t(16)} ${t(32)}` }}>
        <span className='font-semibold text-[#2c2d32]' style={{ fontSize: t(24) }}>Secure payment</span>
        <button type='button' onClick={onCancel} className='font-semibold text-[#ff4800]' style={{ fontSize: t(22) }}>Cancel</button>
      </div>
      {src ? (
        <iframe title='Secure payment' src={src} className='w-full flex-1 border-0' />
      ) : (
        <iframe title='Secure payment' srcDoc={srcDoc} sandbox='allow-scripts allow-forms allow-popups allow-top-navigation-by-user-activation' className='w-full flex-1 border-0' />
      )}
    </div>
  )
}

/**
 * Pay a restaurant bill. Flow from the app — PayBillScreen (amount; the first
 * restaurant offer can be ticked) → BillSummaryScreen (coupons, membership
 * upgrade, Privé Credits, what's paid) → payment method → the MIPS payment
 * page → /pay-bill/payment-return. UI from the Figma "Flow Pay Bill" frames:
 * the restaurant on the left, the step in a card.
 */
export function PayBillClient({
  restaurant: r,
  offers,
  plan,
  sharePct,
  cashbackPct,
  burnEnabled,
  upsell,
  initialAmount,
  initialOffer,
  isOrder,
  merchantKind = 'restaurant',
  merchantHref,
}: {
  restaurant: PayBillRestaurant
  /** app parity: PayBillScreen paymentSource 'store' — store and salon bills */
  merchantKind?: 'restaurant' | 'store'
  /** the merchant's page, for back */
  merchantHref: string
  offers: BillOffer[]
  plan: CashbackPlan
  /** the member's share of a merchant's upfront discount (membership_discount_caps) */
  sharePct: number
  cashbackPct: number
  /** platform_settings.cashback_burn_enabled */
  burnEnabled: boolean
  /** app parity: one tier up, payable before the bill (startMembershipPayment) */
  upsell: { plan: CashbackPlan; pct: number; planId: string; amount: number; multiplier: string | null } | null
  /** back from buying a membership: reopen the bill's summary */
  initialAmount: number | null
  initialOffer: string | null | undefined
  /** arrived from Order & Collect with a cart */
  isOrder: boolean
}) {
  const router = useRouter()
  const idParam = merchantKind === 'store' ? 'store_id' : 'restaurant_id'
  const { promptLogin } = useAuthPrompt()
  const { location } = useLocation()
  const inputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>(initialAmount ? 'summary' : 'amount')
  const [digits, setDigits] = useState(initialAmount ? String(initialAmount) : '')
  // amount screen: the first offer's tick
  const [offerTicked, setOfferTicked] = useState(true)
  // summary: the coupon picked (undefined = no choice yet, null = none)
  const [couponChoice, setCouponChoice] = useState<string | null | undefined>(initialOffer)
  const [upgradeApplied, setUpgradeApplied] = useState(false)
  const [frame, setFrame] = useState<{ sessionId: string; merchantTrace: string; src: string; srcDoc: string } | null>(null)
  const [quote, setQuote] = useState<{ amount: number; data: BillQuote } | null>(null)
  const [balance, setBalance] = useState(0)
  const [useCredits, setUseCredits] = useState(false)
  const [method, setMethod] = useState<'card' | null>(null)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [authTick, setAuthTick] = useState(0)
  // app parity: OrderBillSummary → the cart travels with the payment
  const [orderLines] = useState<OrderLine[] | null>(() => {
    if (!isOrder || !initialAmount || typeof window === 'undefined') return null
    try {
      return matchingOrder(JSON.parse(sessionStorage.getItem(ORDER_CART_KEY) ?? 'null') as PendingOrder | null, r.id, initialAmount)
    } catch { return null }
  })

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
      fetch(`/api/pay-bill/quote?${idParam}=${r.id}&amount=${amount}`, { cache: 'no-store' })
        .then(res => (res.ok ? res.json() : null))
        .then((data: BillQuote | null) => { if (live && data) setQuote({ amount, data }) })
        .catch(() => {})
    }, 300)
    return () => { live = false; clearTimeout(id) }
  }, [amount, r.id, idParam, authTick])

  useEffect(() => {
    let live = true
    fetchCashbackBalance().then(b => { if (live) setBalance(b) })
    return () => { live = false }
  }, [authTick])

  const q = quote && quote.amount === amount ? quote.data : null

  // ── amount screen offers (PayBillScreen) ──
  const primary = primaryOffer(offers)
  const primaryIsMerchant = primary?.source === 'MERCHANT'
  const extraOffers = offers.filter(o => o.source !== 'MERCHANT')
  const rangeNote = primary && amount > 0 ? offerRangeNote(primary, amount) : ''
  const offerApplied = primaryIsMerchant && offerTicked && !rangeNote

  // ── coupon + totals (BillSummaryScreen) ──
  const selected = selectedCoupon(offers, amount, couponChoice)
  const application = useMemo(() => applyOffers(amount, selected ? [shareOffer(selected, sharePct)] : []), [amount, selected, sharePct])
  const offerDiscount = Math.round(application.discount * 100) / 100
  const rewardDiscount = q?.repeatReward?.discount ?? 0
  const discount = Math.round((offerDiscount + rewardDiscount) * 100) / 100
  const cashback = Math.round((application.cashback + (q?.cashback ?? 0)) * 100) / 100
  const upgradeAmount = upgradeApplied && upsell ? upsell.amount : 0
  const burnCap = q?.burn ? q.burn.burnableNow : balance
  const { creditsUsable, creditsApplied, toPay } = billTotals({ amount, discount, balance, burnCap, useCredits: useCredits && burnEnabled, upgradeAmount })
  const creditsBlocked = q?.burn && !(q.burn.burnableNow > 0) ? q.burn.blockMessage : ''
  const earnCredits = (Math.max(0, toPay - upgradeAmount) * cashbackPct) / 100

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
    setCouponChoice(primaryIsMerchant && primary ? (offerApplied ? primary.id : null) : undefined)
    go('summary')
  }

  function back() {
    if (step !== 'amount') { window.history.back(); return }
    if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) router.back()
    else router.push(merchantHref)
  }

  // Follow the session as the app does (waitForMipsPayment: payment_sessions.status
  // every 2.5s, up to 15 minutes); the backend finalizes the bill and credits the cashback.
  useEffect(() => {
    if (!frame) return
    let live = true
    let timer: ReturnType<typeof setTimeout>
    const started = Date.now()
    const end = (outcome: string) => {
      const qs = new URLSearchParams({ session_id: frame.sessionId, outcome })
      router.replace(`/pay-bill/payment-return?${qs}`)
    }
    const tick = async () => {
      const status = await fetch(`/api/pay-bill/status?session_id=${encodeURIComponent(frame.sessionId)}`, { cache: 'no-store' })
        .then(res => res.json() as Promise<{ status?: string }>)
        .then(d => String(d.status ?? ''))
        .catch(() => '')
      if (!live) return
      if (status === 'VERIFIED_SUCCESS' || status === 'FINALIZED') return end('success')
      if (status === 'VERIFIED_FAILED' || status === 'FAILED') return end('failed')
      if (Date.now() - started > 15 * 60 * 1000) return end('failed')
      timer = setTimeout(tick, 2500)
    }
    timer = setTimeout(tick, 2500)
    return () => { live = false; clearTimeout(timer) }
  }, [frame, router])

  function proceedFromSummary() {
    // app parity: startMembershipPayment — buy the plan first, then come back to this bill
    if (upgradeApplied && upsell) {
      const qs = new URLSearchParams({ [idParam]: r.id, amount: String(amount), offer: selected?.id ?? 'none' })
      if (orderLines) qs.set('order', '1')
      try { sessionStorage.setItem(PAY_BILL_RESUME_KEY, `/pay-bill?${qs}`) } catch { /* private mode — they land on the membership page */ }
      router.push(`/membership/checkout?plan=${encodeURIComponent(upsell.planId)}`)
      return
    }
    go('method')
  }

  async function pay() {
    if (paying || method !== 'card' || !(toPay > 0)) return
    setPaying(true)
    setError('')
    try {
      const res = await fetch('/api/payments/bill/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // app parity: buildPayload — the amount before credits, and the credits used
        body: JSON.stringify({
          [idParam]: r.id,
          total_amount: Math.round((toPay + creditsApplied) * 100) / 100,
          coins_amount: creditsApplied,
          ...(orderLines ? { order_items: orderLines.map(l => ({ id: l.id, qty: l.qty })) } : {}),
        }),
      })
      const data = (await res.json()) as Record<string, unknown>
      if (res.status === 401) { setPaying(false); promptLogin(); return }
      if (!res.ok) throw new Error((data.error as string) ?? 'Payment could not be started')

      const sessionId = resolveSessionId(data)
      if (!sessionId) throw new Error('Payment session id was not returned.')
      const pending: PendingBillPayment = {
        sessionId,
        merchantTrace: resolveMerchantTrace(data),
        restaurantId: r.id,
        restaurantName: r.name,
        merchantKind,
        merchantHref,
        location: r.area ?? r.city ?? '',
        originalAmount: amount,
        discount,
        paidAmount: toPay,
        cashback,
        orderItems: orderLines ?? undefined,
      }
      try { sessionStorage.setItem(PENDING_BILL_KEY, JSON.stringify(pending)) } catch { /* private mode — the receipt shows less */ }

      // app parity: payment_zone_html is an iframe to its page, a URL, or HTML to show as is
      const rawZone = String(data.payment_zone_html ?? '').trim()
      const frameSrc = rawZone.match(/<iframe[^>]+src=["'](https?:\/\/[^"']+)["']/i)?.[1]?.replace(/&amp;/g, '&')
      const zone = frameSrc || rawZone
      if (!zone) throw new Error('Payment launch URL not returned.')
      const isUrl = /^https?:\/\//i.test(zone)
      setFrame({ sessionId, merchantTrace: pending.merchantTrace, src: isUrl ? zone : '', srcDoc: isUrl ? '' : zone })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.')
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
                {distanceKm != null && (
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

                {/* app parity: PayBillScreen offer cards — the first merchant offer has a tick */}
                {(primary || extraOffers.length > 0) && (
                  <div className='flex flex-col' style={{ marginTop: t(28), gap: t(12) }}>
                    {primary && primaryIsMerchant ? (
                      <button
                        type='button'
                        role='radio'
                        aria-checked={offerApplied}
                        disabled={!!rangeNote}
                        onClick={() => setOfferTicked(v => !v)}
                        className='flex items-center self-start rounded-full border-solid border-[#fecdc4] bg-[#fff1ee] text-left disabled:opacity-70'
                        style={{ minHeight: t(64), padding: `${t(8)} ${t(26)} ${t(8)} ${t(16)}`, gap: t(12), borderWidth: t(1.5) }}
                      >
                        <Radio on={offerApplied} />
                        <span>
                          <span className='block font-semibold text-[#ff4800]' style={{ fontSize: t(20) }}>{primary.badgeText || primary.title}</span>
                          {rangeNote && <span className='block text-[#5b5a5a]' style={{ fontSize: t(16) }}>{rangeNote}</span>}
                        </span>
                      </button>
                    ) : primary ? (
                      <span className='self-start rounded-full border-solid border-[#fecdc4] bg-[#fff1ee] font-semibold text-[#ff4800]' style={{ padding: `${t(14)} ${t(24)}`, borderWidth: t(1.5), fontSize: t(20) }}>
                        {primary.badgeText || primary.title}
                      </span>
                    ) : null}
                    {extraOffers.length > 0 && (
                      <div className='flex flex-wrap' style={{ gap: t(12) }}>
                        {extraOffers.slice(0, 2).map(o => (
                          <span key={o.id} className='rounded-full border-solid border-[#fecdc4] bg-[#fff1ee] font-semibold text-[#ff4800]' style={{ padding: `${t(10)} ${t(22)}`, borderWidth: t(1.5), fontSize: t(18) }}>
                            {o.badgeText || o.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className='mt-auto' style={{ paddingTop: t(48) }}>
                  <CardButton onClick={toSummary} disabled={!(amount > 0)}>{offerApplied ? 'Apply offer and continue' : 'Continue'}</CardButton>
                </div>
              </>
            )}

            {step === 'summary' && (
              <>
                <p className='text-[#8e8e93]' style={{ marginTop: t(20), fontSize: t(22) }}>Your bill</p>
                <div className='flex flex-wrap items-end' style={{ marginTop: t(4), gap: `${t(8)} ${t(18)}` }}>
                  <p className='font-semibold text-[#2a2a2a]' style={{ fontSize: t(60), lineHeight: t(65), letterSpacing: t(-2) }}>MUR {fmtMur(amount - discount)}</p>
                  {discount > 0 && <p className='text-[#8e8e93] line-through' style={{ fontSize: t(28), paddingBottom: t(6) }}>MUR {fmtMur(amount)}</p>}
                </div>
                {discount > 0 && (
                  <p className='self-start rounded-full bg-[#3aa456] text-white' style={{ marginTop: t(14), padding: `${t(8)} ${t(20)}`, fontSize: t(20) }}>
                    Wow! You are saving <span className='font-bold'>MUR {fmtMur(discount)}!</span>
                  </p>
                )}

                <div className='grid lg:grid-cols-2' style={{ marginTop: t(32), gap: t(28) }}>
                  {/* left — what this bill earns, and the coupons */}
                  <div className='flex min-w-0 flex-col' style={{ gap: t(20) }}>
                    {cashbackPct > 0 && (
                      // app parity: BillSummaryScreen CashbackPromo — the credits this bill earns
                      <div className='relative w-full overflow-hidden text-white' style={{ aspectRatio: '1290 / 596', borderRadius: t(28) }}>
                        <Image src='/assets/pay-bill/total-cashback.webp' alt='' fill sizes='(min-width: 1920px) 440px, 30vw' className='object-cover' />
                        <div className='relative flex h-full flex-col justify-between' style={{ padding: t(22) }}>
                          <span className='self-start rounded-full bg-white/20 font-bold backdrop-blur-sm' style={{ padding: `${t(6)} ${t(14)}`, fontSize: t(15), letterSpacing: t(1) }}>
                            YOU WILL EARN {cashbackPct}% CASH BACK
                          </span>
                          <div>
                            {plan !== 'free' && <Image src={MEMBERSHIP_BADGE[plan]} alt={`Privé ${PLAN_LABEL[plan]}`} width={102} height={44} className='h-auto' style={{ width: t(110), marginBottom: t(4) }} />}
                            <p className='flex items-baseline' style={{ gap: t(8) }}>
                              <span className='leading-none font-bold' style={{ fontSize: t(44) }}>{fmtMur(earnCredits)}</span>
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

                    {offers.length > 0 && (
                      <div>
                        <p className='font-semibold text-[#2c2d32]' style={{ fontSize: t(22), marginBottom: t(12) }}>Apply coupons and offers</p>
                        <div className='scrollbar-hide flex overflow-x-auto' style={{ gap: t(14) }}>
                          {offers.map(o => (
                            <CouponCard
                              key={o.id}
                              offer={o}
                              amount={amount}
                              applied={selected?.id === o.id}
                              onToggle={() => setCouponChoice(selected?.id === o.id ? null : o.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* right — the bill summary */}
                  <div className='flex min-w-0 flex-col' style={{ gap: t(14) }}>
                    {upsell && upsell.amount > 0 && (
                      <Capsule
                        role='switch'
                        selected={upgradeApplied}
                        onClick={() => setUpgradeApplied(v => !v)}
                        icon={<Image src={MEMBERSHIP_BADGE[upsell.plan]} alt='' width={92} height={40} className='w-auto' style={{ height: t(44) }} />}
                        title={`Add ${PLAN_LABEL[upsell.plan]} at MUR ${fmtMur(upsell.amount)}`}
                        sub={
                          upgradeApplied
                            ? `Upgrade first, then pay your bill with ${PLAN_LABEL[upsell.plan]} benefits`
                            : [upsell.multiplier && `Get ${upsell.multiplier} OFF`, upsell.pct > 0 && `${upsell.pct}% cashback`].filter(Boolean).join(' and ')
                        }
                        trailing={<Radio on={upgradeApplied} />}
                      />
                    )}
                    {burnEnabled && (
                      <Capsule
                        role='switch'
                        selected={creditsApplied > 0}
                        disabled={!creditsUsable}
                        onClick={() => setUseCredits(v => !v)}
                        icon={<Image src='/assets/membership/Wallet.webp' alt='' width={40} height={40} style={{ width: t(40), height: t(40) }} />}
                        title='Use Privé Credits'
                        sub={
                          creditsApplied > 0
                            ? `MUR ${fmtMur(creditsApplied)} applied`
                            : creditsBlocked || (burnCap < balance ? `Use up to MUR ${fmtMur(burnCap)} of MUR ${fmtMur(balance)}` : `MUR ${fmtMur(balance)} is available`)
                        }
                        trailing={<Radio on={creditsApplied > 0} />}
                      />
                    )}
                    <div className='overflow-hidden border border-[#f6dccf] bg-linear-to-b from-white to-[#ffe8de]' style={{ borderRadius: t(24) }}>
                      <Row label='Total bill amount' value={`MUR ${fmtMur(amount)}`} />
                      {upgradeAmount > 0 && upsell && <Row label={`${PLAN_LABEL[upsell.plan]} membership`} value={`+MUR ${fmtMur(upgradeAmount)}`} />}
                      {selected && offerDiscount > 0 && (
                        <Row
                          label={
                            <>
                              Offer · {selected.title}
                              <button type='button' onClick={() => setCouponChoice(null)} className='block font-semibold text-[#ff4800]' style={{ fontSize: t(16) }}>Remove</button>
                            </>
                          }
                          value={`-MUR ${fmtMur(offerDiscount)}`}
                          accent
                        />
                      )}
                      {rewardDiscount > 0 && <Row label='Visit reward' value={`-MUR ${fmtMur(rewardDiscount)}`} accent />}
                      {creditsApplied > 0 && <Row label='Privé Credits' value={`-MUR ${fmtMur(creditsApplied)}`} accent />}
                      <div className='bg-linear-to-r from-[#fff3ee] to-[#ffe8de]'>
                        <Row label='To be paid' value={`MUR ${fmtMur(toPay)}`} strong />
                      </div>
                    </div>
                  </div>
                </div>

                <div className='mt-auto' style={{ paddingTop: t(40) }}>
                  <CardButton onClick={proceedFromSummary} disabled={!(toPay > 0)}>
                    {upgradeApplied && upsell ? `Upgrade to ${PLAN_LABEL[upsell.plan]} • MUR ${fmtMur(upgradeAmount)}` : `Proceed to pay MUR ${fmtMur(toPay)}`}
                  </CardButton>
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
                  You&rsquo;ll enter your card details and the OTP on the secure payment page.
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

      {paying && !frame && <ProcessingScreen />}
      {frame && (
        <PaymentFrame
          src={frame.src}
          srcDoc={frame.srcDoc}
          onCancel={() => router.replace(`/pay-bill/payment-return?${new URLSearchParams({ session_id: frame.sessionId })}`)}
        />
      )}
    </div>
  )
}
