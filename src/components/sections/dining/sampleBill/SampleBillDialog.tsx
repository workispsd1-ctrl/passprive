'use client'

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, ChevronDown, Info, SquarePen } from 'lucide-react'
import { useUserPlan } from '@/lib/context/PlanContext'
import type { CashbackPlan, MerchantCapabilityFields } from '@/lib/cashback'
import type { RestaurantDeal } from '@/lib/deals'
import { MAX_BILL_DIGITS, type BillOffer } from '@/lib/payBill'
import type { DiscountCaps } from '@/lib/services/membershipCaps'
import { billCashbackPct, computeSampleBill, rs, sampleBase } from '@/lib/sampleBill'
import { cn } from '@/lib/utils'

/**
 * Design unit for these popups. The Figma frames are 1920 wide and every
 * class below is the exact Figma value in design px: `--u` is exactly 1px on a
 * 1920 screen and scales with the viewport on every other desktop width
 * (100vw / 1920). Phones and tablets keep 1 design px = 1px. `--spacing`
 * follows it, so `w-520`, `h-54`, `gap-12`, `leading-20` are design px.
 */
const UNIT = '[--u:1px] lg:[--u:calc(100vw/1920)] [--spacing:var(--u)]'

const PRIMARY_BTN = 'flex h-54 w-full items-center justify-center rounded-full bg-[#FF4800] text-[calc(16*var(--u))] leading-21 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50'

// app parity: SampleBill.jsx GUEST_OPTIONS / MEAL_OPTIONS / currentMeal
const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8]
const MEALS = [
  { key: 'Breakfast', hours: 'Till 12 PM' },
  { key: 'Lunch', hours: '12–6 PM' },
  { key: 'Dinner', hours: '6 PM onwards' },
] as const
type Meal = (typeof MEALS)[number]['key']
function currentMeal(): Meal {
  const h = new Date().getHours()
  return h < 11 ? 'Breakfast' : h < 16 ? 'Lunch' : 'Dinner'
}

/** Today, Tomorrow, then the next three days — "25 Nov" over "Sun". */
function dayOptions(): { key: string; label: string; weekday: string }[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' })
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    return { key: d.toDateString(), label, weekday }
  })
}

// "Privé Plus" pill in the credits card (Figma "Prive Plus unit" / "Prive Black unit")
const PLAN_PILL: Record<CashbackPlan, { name: string; bg: string; glow: string; prive: string; label: string }> = {
  free: { name: 'Free', bg: 'bg-[#FF4800]', glow: 'bg-[#FFB38F]', prive: 'text-[#FFF0CE]', label: 'text-white' },
  premiere: { name: 'Plus', bg: 'bg-[#0044FF]', glow: 'bg-[#00A5B9]', prive: 'text-[#BFF6FC]', label: 'text-white' },
  black: { name: 'Black', bg: 'bg-[#0E0C18]', glow: 'bg-[#BF9531]', prive: 'text-[#FFF6F2]', label: 'text-[#FFC53D]' },
}

type Step = 'bill' | 'amount' | 'guests' | 'date' | 'meal'

const subscribeNever = () => () => {}

/* ───────────────────────── shell ───────────────────────── */

/** Dialog card: Figma "… dialog" — white, radius 24, 0 16 56 rgba(0,0,0,.16), title 24/31 at 32,28, close 36 at top 24 / right 24. */
function Modal({ title, width, onClose, children }: {
  title: string
  /** design width class, e.g. 'w-520' */
  width: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label={title}
      className={cn('fixed inset-0 z-110 flex items-center justify-center overflow-y-auto bg-black/33 p-16 font-(family-name:--font-dm-sans)', UNIT)}
      onClick={onClose}
    >
      <div
        className={cn('relative my-auto max-w-full rounded-[calc(24*var(--u))] bg-white px-32 pt-28 pb-32 shadow-[0_calc(16*var(--u))_calc(56*var(--u))_rgba(0,0,0,0.16)] max-lg:px-20', width)}
        onClick={e => e.stopPropagation()}
      >
        <h2 className='pr-48 text-[calc(24*var(--u))] leading-31 font-bold text-[#1C1C1E]'>{title}</h2>
        <button
          type='button'
          aria-label='Close'
          onClick={onClose}
          className='absolute top-24 right-24 flex size-36 items-center justify-center rounded-full bg-[#F2F2F7] text-[calc(26*var(--u))] leading-34 font-bold text-[#1C1C1E] hover:bg-[#E5E5EA]'
        >
          <span aria-hidden className='-mt-2'>×</span>
        </button>
        {children}
      </div>
    </div>
  )
}

/* ───────────────────────── sample bill ───────────────────────── */

/** Figma "2 guests selector": padding 10/16, gap 4, h 37, #FFF5F0, 1.5px #FF4800, radius 20, 600 13/17. */
function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex h-37 items-center gap-4 rounded-[calc(20*var(--u))] border-[calc(1.5*var(--u))] border-[#FF4800] bg-[#FFF5F0] px-16 py-10 text-[calc(13*var(--u))] leading-17 font-semibold text-[#FF4800] hover:bg-[#FFEBE0]'
    >
      {label}
      <ChevronDown className='size-12' strokeWidth={2} />
    </button>
  )
}

/** Figma "Frame 2147223842": "You can save Rs 20,005" — 369.2 × 80.08, the piggy bank top right. */
function SavingsCard({ saved }: { saved: number }) {
  return (
    <div className='relative h-[calc(80.08*var(--u))] w-[calc(369.2*var(--u))] overflow-hidden rounded-[calc(16.64*var(--u))] bg-white shadow-[0_calc(4.16*var(--u))_calc(8.216*var(--u))_rgba(0,0,0,0.1)]'>
      <span aria-hidden className='absolute top-[calc(-5.2*var(--u))] left-0 h-[calc(216.32*var(--u))] w-full rounded-[calc(16.64*var(--u))] bg-[linear-gradient(180deg,#2C7B44_0%,#0445F8_100%)] shadow-[inset_0_calc(3.936*var(--u))_calc(16.43*var(--u))_rgba(255,255,255,0.25)]' />
      {/* "Star 25" glow + "Ellipse 43795" behind the piggy */}
      <span aria-hidden className='absolute top-[calc(-24.43*var(--u))] left-[calc(253.24*var(--u))] size-[calc(152.88*var(--u))] rounded-[calc(1.39*var(--u))] bg-[radial-gradient(circle,#FFE695_0%,rgba(255,230,149,0)_68%)] mix-blend-screen blur-[calc(5.35*var(--u))]' />
      <span aria-hidden className='absolute top-[calc(18.21*var(--u))] left-[calc(300.04*var(--u))] h-[calc(73.84*var(--u))] w-[calc(74.88*var(--u))] rounded-full bg-[#FFDCA6] blur-[calc(3.9*var(--u))]' />
      {/* "Savings - Piggy Bank" 123.76 at 274.04, -15.07 — masked out of the card artwork */}
      <Image
        src='/assets/profile/card-savings.webp'
        alt=''
        width={692}
        height={532}
        className='pointer-events-none absolute top-[calc(-118.5*var(--u))] left-[calc(93.6*var(--u))] h-[calc(234*var(--u))] w-[calc(304.5*var(--u))] max-w-none mask-[radial-gradient(ellipse_19%_27%_at_80%_73%,black_86%,transparent_100%)]'
      />
      <p className='absolute top-27 left-[calc(18.2*var(--u))] text-[calc(26.1981*var(--u))] leading-24 font-extrabold tracking-[calc(-1.29382*var(--u))] whitespace-nowrap text-[#FFF0CE] [text-shadow:0_calc(3.02*var(--u))_calc(3.02*var(--u))_rgba(0,0,0,0.1)]'>
        You can save {rs(saved)}
      </p>
    </div>
  )
}

const PRIVE = 'font-(family-name:--font-libre-baskerville) italic font-bold'

/**
 * Figma "Frame 2147223800": "You can earn 100 Privé Credits" — 278.36 wide,
 * 149.34 tall with the gold "Upgrade to Black" box (card-Black), shorter
 * without it (Black members, or when Black earns no more here).
 */
function CreditsCard({ credits, plan, upsellX }: { credits: number; plan: CashbackPlan; upsellX: number | null }) {
  const pill = PLAN_PILL[plan]
  return (
    <div
      className={cn(
        'relative w-[calc(278.36*var(--u))] overflow-hidden rounded-[calc(12.51*var(--u))] bg-white shadow-[0_calc(3.13*var(--u))_calc(6.18*var(--u))_rgba(0,0,0,0.1)]',
        upsellX ? 'h-[calc(149.34*var(--u))]' : 'h-[calc(88*var(--u))]',
      )}
    >
      <span aria-hidden className='absolute top-0 left-[calc(-38.31*var(--u))] h-[calc(335.44*var(--u))] w-[calc(319.02*var(--u))] rounded-[calc(12.51*var(--u))] bg-[linear-gradient(180deg,#FF4800_-13.94%,#0044FF_75.72%)] shadow-[inset_0_calc(2.96*var(--u))_calc(12.36*var(--u))_rgba(255,255,255,0.25)]' />
      {/* "Star 25" glow behind the plan pill */}
      <span aria-hidden className='absolute top-[calc(9.07*var(--u))] left-182 size-[calc(122.37*var(--u))] rounded-[calc(1.11*var(--u))] bg-[radial-gradient(circle,#FFE695_0%,rgba(255,230,149,0)_60%)] mix-blend-screen blur-[calc(4.28*var(--u))]' />

      <p className='absolute top-[calc(13.29*var(--u))] left-[calc(10.94*var(--u))] text-[calc(19.6966*var(--u))] leading-18 font-extrabold tracking-[calc(-0.972734*var(--u))] whitespace-nowrap text-[#FFF0CE] [text-shadow:0_calc(2.27*var(--u))_calc(2.27*var(--u))_rgba(0,0,0,0.1)]'>
        You can earn
      </p>
      <p className='absolute top-[calc(34.03*var(--u))] left-[calc(11.44*var(--u))] flex items-baseline whitespace-nowrap'>
        <span className='text-[calc(24.4667*var(--u))] leading-22 font-extrabold tracking-[calc(-1.20831*var(--u))] text-[#FFF0CE] [text-shadow:0_calc(2.82*var(--u))_calc(2.82*var(--u))_rgba(0,0,0,0.1)]'>
          {credits.toLocaleString('en-US')}
        </span>
        <span className={cn(PRIVE, 'ml-[calc(4*var(--u))] text-[calc(13.5421*var(--u))] leading-15 tracking-[calc(-0.685715*var(--u))] text-white [text-shadow:0_calc(1.29*var(--u))_calc(1.29*var(--u))_rgba(0,0,0,0.1)]')}>
          Privé
        </span>
        <span className='text-[calc(14.3931*var(--u))] leading-14 tracking-[calc(-0.763711*var(--u))] text-[#FFF0CE] [text-shadow:0_calc(1.79*var(--u))_calc(1.79*var(--u))_rgba(0,0,0,0.25)]'>
          Credits
        </span>
      </p>
      <p className='absolute top-[calc(65.23*var(--u))] left-[calc(12.48*var(--u))] flex items-baseline gap-[calc(2.5*var(--u))] text-[calc(9.97331*var(--u))] leading-10 tracking-[calc(-0.529195*var(--u))] whitespace-nowrap text-white [text-shadow:0_calc(1.24*var(--u))_calc(1.24*var(--u))_rgba(0,0,0,0.25)]'>
        1
        <span>
          <span className={cn(PRIVE, 'text-[calc(9.38363*var(--u))] tracking-[calc(-0.475149*var(--u))]')}>Privé</span>
          <span className='text-[#FFF0CE]'>Credit</span>
        </span>
        = 1 Rs
      </p>

      {/* "Prive Plus unit" — the member's plan, 60.21 × 25.8 at 208, 9.07 */}
      <span className={cn('absolute top-[calc(9.07*var(--u))] left-208 h-[calc(25.8*var(--u))] w-[calc(60.21*var(--u))] overflow-hidden rounded-[calc(18.92*var(--u))]', pill.bg)}>
        <span aria-hidden className={cn('absolute top-[calc(-20.39*var(--u))] left-[calc(-14.59*var(--u))] h-[calc(24.82*var(--u))] w-[calc(78.22*var(--u))] -rotate-[9.48deg] rounded-full blur-[calc(7.98*var(--u))]', pill.glow)} />
        <span className='absolute inset-0 flex items-center justify-center pl-[calc(1.7*var(--u))]'>
          <span className={cn(PRIVE, 'mt-[calc(2.6*var(--u))] text-[calc(9.10434*var(--u))] leading-11 tracking-[-0.03em] [text-shadow:0_calc(2.64*var(--u))_calc(2.64*var(--u))_rgba(0,0,0,0.1)]', pill.prive)}>Privé</span>
          <span className={cn('text-[calc(11.0163*var(--u))] leading-14 font-extrabold tracking-[-0.07em] [text-shadow:0_calc(2.64*var(--u))_calc(2.64*var(--u))_rgba(0,0,0,0.1)]', pill.label)}>{pill.name}</span>
        </span>
      </span>

      {/* "card-Black" — 212.16 × 52 at 35.36, 88.11 */}
      {upsellX && (
        <div className='absolute top-[calc(88.11*var(--u))] left-[calc(35.36*var(--u))] h-52 w-[calc(212.16*var(--u))] overflow-hidden rounded-[calc(9.38*var(--u))] bg-[#6E4301] shadow-[inset_0_calc(3.13*var(--u))_calc(12.51*var(--u))_#FFB541] drop-shadow-[0_calc(4.69*var(--u))_calc(3.91*var(--u))_rgba(37,26,8,0.1)]'>
          <span aria-hidden className='absolute top-[calc(20*var(--u))] left-[calc(150*var(--u))] h-[calc(110*var(--u))] w-[calc(120*var(--u))] rounded-[calc(23.46*var(--u))] bg-[#FF3278] opacity-60 blur-[calc(30*var(--u))]' />
          <span aria-hidden className='absolute top-[calc(26*var(--u))] left-[calc(-10*var(--u))] h-[calc(80*var(--u))] w-[calc(110*var(--u))] rounded-[calc(23.46*var(--u))] bg-white opacity-30 blur-[calc(30*var(--u))]' />
          <span aria-hidden className='absolute top-[calc(-4*var(--u))] left-[calc(134.23*var(--u))] h-[calc(42.05*var(--u))] w-[calc(95.82*var(--u))] rotate-[0.48deg] bg-[radial-gradient(ellipse,#FFE695_0%,rgba(255,230,149,0)_65%)] mix-blend-screen blur-[calc(3.35*var(--u))]' />

          <Info aria-hidden className='absolute top-[calc(12.72*var(--u))] left-[calc(9.99*var(--u))] size-[calc(9.39*var(--u))] text-white' strokeWidth={2} />
          <p className='absolute top-[calc(11.77*var(--u))] left-[calc(24.07*var(--u))] text-[calc(9.38287*var(--u))] leading-12 whitespace-nowrap text-white'>
            You could earn {upsellX}x credits with
          </p>
          {/* "Prive Black unit" — 46.4 × 19.88 at 159.17, 7.86 */}
          <span className='absolute top-[calc(7.86*var(--u))] left-[calc(159.17*var(--u))] h-[calc(19.88*var(--u))] w-[calc(46.4*var(--u))] overflow-hidden rounded-[calc(14.58*var(--u))] bg-[#0E0C18]'>
            <span aria-hidden className='absolute top-[calc(-15.66*var(--u))] left-[calc(-12.67*var(--u))] h-[calc(13.38*var(--u))] w-[calc(60.28*var(--u))] -rotate-[9.48deg] rounded-full bg-[#BF9531] blur-[calc(6.15*var(--u))]' />
            <span className={cn(PRIVE, 'absolute top-[calc(6.12*var(--u))] left-[calc(4.81*var(--u))] text-[calc(6.69736*var(--u))] leading-8 tracking-[-0.03em] text-[#FFF6F2]')}>Privé</span>
            <span className='absolute top-[calc(4.23*var(--u))] left-[calc(22.27*var(--u))] text-[calc(8.10381*var(--u))] leading-11 font-extrabold tracking-[-0.07em] text-[#FFC53D]'>Black</span>
          </span>
          {/* "Upgrade to Black" — 75.84 × 13.86 at 70.2, 28.13 */}
          <Link
            href='/membership'
            className='absolute top-[calc(28.13*var(--u))] left-[calc(70.2*var(--u))] flex h-[calc(13.86*var(--u))] w-[calc(75.84*var(--u))] items-center gap-[calc(2.5*var(--u))] rounded-[calc(6.94*var(--u))] bg-white pl-[calc(5.94*var(--u))] font-(family-name:--font-inter) text-[calc(6.73421*var(--u))] leading-10 font-medium text-[#0044FF] hover:bg-[#F2F5FF]'
          >
            Upgrade to Black
            <ArrowRight className='size-[calc(7*var(--u))]' strokeWidth={2.2} />
          </Link>
        </div>
      )}
    </div>
  )
}

/** Figma "Breakdown Row": 500 15/20 #767676 label, 600 15/20 value (#FF4800 for discounts). */
function Line({ label, value, minus }: { label: React.ReactNode; value: string; minus?: boolean }) {
  return (
    <div className='flex h-20 items-center justify-between gap-16 text-[calc(15*var(--u))] leading-20'>
      <span className='min-w-0 truncate font-medium text-[#767676]'>{label}</span>
      <span className={cn('shrink-0 font-semibold', minus ? 'text-[#FF4800]' : 'text-[#1C1C1E]')}>{value}</span>
    </div>
  )
}

/* ───────────────────────── dialog ───────────────────────── */

export type SampleBillProps = {
  merchant: MerchantCapabilityFields
  costForTwo: number
  offers: BillOffer[]
  dealRows: RestaurantDeal[]
  caps: DiscountCaps
  bookHref: string | null
  payHref: string | null
}

/**
 * "Your Sample Bill" and its pickers — app parity: components/SampleBill.jsx
 * (the bill sheet: guests / day / meal, estimated amount with the pencil to
 * edit it, restaurant + bank offer and tier deal lines, You pay, Book / Pay).
 * Desktop look: Figma "Your Sample Bill — Desktop", "Calculate Your Savings",
 * "Number of guest(s)", "Select date", "Select meal time".
 */
export function SampleBillDialog({ open, onClose, ...props }: SampleBillProps & { open: boolean; onClose: () => void }) {
  const { merchant, costForTwo: listedCost, offers, dealRows, caps, bookHref, payHref } = props
  const plan = useUserPlan()
  const [step, setStep] = useState<Step>('bill')
  const [guests, setGuests] = useState(2)
  const [customAmount, setCustomAmount] = useState<number | null>(null)
  const [days] = useState(dayOptions)
  const [day, setDay] = useState(() => days[0].key)
  const [meal, setMeal] = useState<Meal>(currentMeal)
  // drafts for the pickers — committed with their button, dropped on close
  const [draftAmount, setDraftAmount] = useState('')
  const [draftGuests, setDraftGuests] = useState(guests)
  const [draftDay, setDraftDay] = useState(day)
  const [draftMeal, setDraftMeal] = useState<Meal>(meal)

  // app: sampleBase(costForTwo, restaurantOffers); bill = cost for two ÷ 2 × guests unless typed in
  const costForTwo = sampleBase(listedCost, offers.filter(o => o.source === 'MERCHANT'))
  const subtotal = customAmount ?? Math.round((costForTwo / 2) * guests)
  const bill = useMemo(
    () => computeSampleBill({ subtotal, merchant, offers, dealRows, plan, caps }),
    [subtotal, merchant, offers, dealRows, plan, caps],
  )

  // upsell: how many times more credits Black earns here (none for Black members or when it isn't more)
  const pct = billCashbackPct(merchant, plan)
  const blackPct = billCashbackPct(merchant, 'black')
  const upsellX = plan !== 'black' && pct > 0 && blackPct > pct ? Number((blackPct / pct).toFixed(1)) : null

  // the bill is where every picker returns to; closing the bill closes the dialog
  // the bill is shown once an amount has been calculated in this session
  const [billShown, setBillShown] = useState(false)
  // pickers return to the bill; closing the bill — or the opening keypad — closes the dialog
  const back = useCallback(
    () => (step === 'bill' || (step === 'amount' && !billShown) ? onClose() : setStep('bill')),
    [step, billShown, onClose],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && back()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, back])

  // Figma flow: every open starts on "Calculate Your Savings" with an empty keypad
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setStep('amount')
      setDraftAmount('')
      setBillShown(false)
    }
  }

  // the portal needs document.body — false while server-rendering and hydrating
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false)
  if (!open || !mounted) return null

  const dayLabel = days.find(d => d.key === day)?.label ?? 'Today'
  const cta = bookHref ? { href: bookHref, label: 'Book a Table' } : payHref ? { href: payHref, label: 'Pay bill' } : null

  let content: React.ReactNode
  if (step === 'amount') {
    content = <AmountStep draft={draftAmount} setDraft={setDraftAmount} onClose={back} onApply={() => {
      // app: applyAmount — a blank or zero amount goes back to the guest-based estimate
      const n = Math.round(Number(draftAmount))
      setCustomAmount(n > 0 ? n : null)
      setBillShown(true)
      setStep('bill')
    }} />
  } else if (step === 'guests') {
    // Figma "Number of guest(s) dialog" — 624 wide, 56px circles gap 16 at top 100, Done at top 202
    content = (
      <Modal title='Number of guest(s)' width='w-624' onClose={back}>
        <div className='mt-41 flex gap-16 max-lg:grid max-lg:grid-cols-4'>
          {GUEST_OPTIONS.map(n => (
            <button
              key={n}
              type='button'
              aria-pressed={draftGuests === n}
              onClick={() => setDraftGuests(n)}
              className={cn(
                'flex size-56 shrink-0 items-center justify-center justify-self-center rounded-full border text-[calc(15*var(--u))] leading-20 font-bold transition-colors',
                draftGuests === n ? 'border-transparent bg-[#FF4800] text-white' : 'border-[#E5E5EA] text-[#1C1C1E] hover:border-[#FF4800]',
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <button
          type='button'
          className={cn(PRIMARY_BTN, 'mt-46')}
          onClick={() => {
            // app: picking guests drops a typed-in amount
            if (draftGuests !== guests) setCustomAmount(null)
            setGuests(draftGuests)
            setStep('bill')
          }}
        >
          Done
        </button>
      </Modal>
    )
  } else if (step === 'date') {
    // Figma "Select date dialog" — 664 wide, 80-tall tiles gap 12 at top 100, Confirm at top 214
    content = (
      <Modal title='Select date' width='w-664' onClose={back}>
        <div className='mt-41 flex gap-12'>
          {days.map(d => {
            const on = draftDay === d.key
            return (
              <button
                key={d.key}
                type='button'
                aria-pressed={on}
                onClick={() => setDraftDay(d.key)}
                className={cn(
                  'flex h-80 min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-[calc(12*var(--u))] border transition-colors',
                  on ? 'border-[#FF4800] bg-[#FFF5F0] font-bold text-[#FF5410]' : 'border-[#E6E6EA] bg-white font-medium text-[#424144] hover:border-[#FF4800]',
                )}
              >
                <span className='text-[calc(15*var(--u))] leading-20 whitespace-nowrap'>{d.label}</span>
                <span className='text-[calc(13*var(--u))] leading-20'>{d.weekday}</span>
              </button>
            )
          })}
        </div>
        <button type='button' className={cn(PRIMARY_BTN, 'mt-34')} onClick={() => { setDay(draftDay); setStep('bill') }}>Confirm</button>
      </Modal>
    )
  } else if (step === 'meal') {
    // Figma "Select meal time dialog" — 520 wide, 56-tall rows gap 12 at top 96, Select Time at top 310
    content = (
      <Modal title='Select meal time' width='w-520' onClose={back}>
        <div className='mt-37 flex flex-col gap-12'>
          {MEALS.map(m => {
            const on = draftMeal === m.key
            return (
              <button
                key={m.key}
                type='button'
                aria-pressed={on}
                onClick={() => setDraftMeal(m.key)}
                className={cn(
                  'flex h-56 items-center justify-between rounded-[calc(12*var(--u))] border px-16 py-14 text-left transition-colors',
                  on ? 'border-transparent bg-[#FFF5F0]' : 'border-[#E6E6EA] hover:border-[#FF4800]',
                )}
              >
                <span className='flex items-center gap-8'>
                  <span className={cn('text-[calc(15*var(--u))] leading-20', on ? 'font-bold text-[#FF4800]' : 'font-medium text-[#1C1C1E]')}>{m.key}</span>
                  <span className='text-[calc(13*var(--u))] leading-17 text-[#767676]'>({m.hours})</span>
                </span>
                {on && <Check className='size-16 text-[#FF4800]' strokeWidth={2} />}
              </button>
            )
          })}
        </div>
        <button type='button' className={cn(PRIMARY_BTN, 'mt-22')} onClick={() => { setMeal(draftMeal); setStep('bill') }}>Select Time</button>
      </Modal>
    )
  } else {
    // Figma "Your Sample Bill dialog" — 880 wide: pills at top 80, artwork 369.2 at 32,151,
    // breakdown 396 at 452,144, CTA 54 tall 24 below it
    const showArt = bill.saved > 0 || bill.credits > 0
    content = (
      <Modal title='Your Sample Bill' width='w-880' onClose={onClose}>
        <div className='mt-21 flex min-h-42 flex-wrap items-start gap-12'>
          <Chip label={`${guests} guest${guests === 1 ? '' : 's'}`} onClick={() => { setDraftGuests(guests); setStep('guests') }} />
          <Chip label={dayLabel} onClick={() => { setDraftDay(day); setStep('date') }} />
          <Chip label={meal} onClick={() => { setDraftMeal(meal); setStep('meal') }} />
        </div>

        <div className='mt-22 flex flex-col gap-32 lg:flex-row lg:gap-[calc(50.8*var(--u))]'>
          {showArt && (
            // phones: the artwork keeps its proportions, shrunk to fit the dialog
            <div className='relative w-[calc(369.2*var(--u))] shrink-0 self-center max-lg:[--spacing:var(--u)] max-lg:[--u:min(1px,calc((100vw-72px)/369.2))] lg:mt-7 lg:self-start'>
              {bill.saved > 0 && <SavingsCard saved={bill.saved} />}
              {bill.credits > 0 && (
                <div className={cn('ml-[calc(47.32*var(--u))]', bill.saved > 0 && 'mt-[calc(8.19*var(--u))]')}>
                  <CreditsCard credits={bill.credits} plan={plan} upsellX={upsellX} />
                </div>
              )}
              {bill.saved > 0 && bill.credits > 0 && (
                // Figma "Frame": 23.92 circle #373741, "+" 700 15.95/21
                <span className='absolute top-[calc(73.83*var(--u))] left-[calc(173.16*var(--u))] z-10 flex size-[calc(23.92*var(--u))] items-center justify-center rounded-full bg-[#373741] text-[calc(15.9467*var(--u))] leading-21 font-bold text-white'>
                  +
                </span>
              )}
            </div>
          )}

          <div className='flex min-w-0 flex-1 flex-col lg:w-396 lg:flex-none'>
            {/* Figma "Breakdown Section": padding 8/0, gap 16 */}
            <div className='flex flex-col gap-16 py-8'>
              <Line
                label={
                  <button
                    type='button'
                    onClick={() => { setDraftAmount(customAmount ? String(customAmount) : ''); setStep('amount') }}
                    className='flex items-center gap-6 hover:text-[#1C1C1E]'
                  >
                    Bill amount <SquarePen className='size-18 text-[#FF4800]' strokeWidth={2.06} />
                  </button>
                }
                value={rs(bill.subtotal)}
              />
              {bill.merchantOff > 0 && <Line label={bill.merchant?.offer.title || 'Restaurant offer'} value={`- ${rs(bill.merchantOff)}`} minus />}
              {bill.bankOff > 0 && <Line label={bill.bank?.offer.title || 'Bank offer'} value={`- ${rs(bill.bankOff)}`} minus />}
              {bill.dealOff > 0 && <Line label={`Deal: ${bill.deal?.label || 'Restaurant deal'}`} value={`- ${rs(bill.dealOff)}`} minus />}
              <div className='border-t border-[#E5E5EA]' />
              <div className='flex h-23 items-center justify-between text-[calc(18*var(--u))] leading-23 font-bold text-[#1C1C1E]'>
                <span>You pay</span>
                <span>{rs(bill.youPay)}</span>
              </div>
            </div>
            {cta && (
              <Link href={cta.href} onClick={onClose} className={cn(PRIMARY_BTN, 'mt-24')}>
                {cta.label}
              </Link>
            )}
          </div>
        </div>
      </Modal>
    )
  }

  return createPortal(content, document.body)
}

/* ───────────────────────── calculator ───────────────────────── */

const QUICK_AMOUNTS = [500, 1000, 1500, 2000]
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'] as const

/** Digits with one '.', at most 2 decimals and MAX_BILL_DIGITS whole digits. */
function typeKey(draft: string, key: string): string {
  if (key === 'back') return draft.slice(0, -1)
  if (key === '.') return draft.includes('.') ? draft : `${draft || '0'}.`
  const [whole, frac] = draft.split('.')
  if (frac !== undefined) return frac.length >= 2 ? draft : draft + key
  if (whole === '0') return key
  return whole.length >= MAX_BILL_DIGITS ? draft : draft + key
}

/** "Calculate Your Savings" — keypad for the bill amount (app: the "Enter bill amount" sheet). */
function AmountStep({ draft, setDraft, onClose, onApply }: {
  draft: string
  setDraft: (v: string) => void
  onClose: () => void
  onApply: () => void
}) {
  // the physical keyboard works too
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9.]$/.test(e.key)) setDraft(typeKey(draft, e.key))
      else if (e.key === 'Backspace') setDraft(typeKey(draft, 'back'))
      else if (e.key === 'Enter') onApply()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [draft, setDraft, onApply])

  const shown = draft ? (draft.includes('.') ? draft : Number(draft).toLocaleString('en-US')) : '0'

  // Figma "Calculate Your Savings dialog" — 520 × 600: amount at top 90, quick pills at 203,
  // keypad at 247, Calculate Savings at 514
  return (
    <Modal title='Calculate Your Savings' width='w-520' onClose={onClose}>
      <div className='mt-31 flex flex-col items-center gap-4 py-12 text-center'>
        <p className='text-[calc(44*var(--u))] leading-57 font-extrabold text-[#FF4800]' aria-live='polite'>Rs {shown}</p>
        <p className='text-[calc(12*var(--u))] leading-16 text-[#767676]'>Enter your estimated food &amp; drinks bill amount</p>
      </div>

      <div className='mt-12 flex justify-between gap-8'>
        {QUICK_AMOUNTS.map(n => (
          <button
            key={n}
            type='button'
            onClick={() => setDraft(String(n))}
            className={cn(
              'flex h-36 w-108 justify-center rounded-[calc(16*var(--u))] py-8 text-[calc(13*var(--u))] leading-17 font-semibold transition-colors max-lg:w-auto max-lg:flex-1',
              draft === String(n) ? 'bg-[#FFF5F0] text-[#FF4800]' : 'bg-[#F2F2F7] text-[#1C1C1E] hover:bg-[#E9E9EE]',
            )}
          >
            Rs {n}
          </button>
        ))}
      </div>

      <div className='mt-8 grid grid-cols-3 gap-12 py-12'>
        {KEYS.map(k => (
          <button
            key={k}
            type='button'
            aria-label={k === 'back' ? 'Delete' : k}
            onClick={() => setDraft(typeKey(draft, k))}
            className='flex h-48 items-center justify-center rounded-[calc(12*var(--u))] bg-[#F2F2F7] text-[calc(20*var(--u))] leading-26 font-semibold text-[#1C1C1E] transition-colors hover:bg-[#E9E9EE] active:bg-[#DEDEE4]'
          >
            {k === 'back' ? '⌫' : k}
          </button>
        ))}
      </div>

      {/* app: applyAmount never blocks — with no amount the bill uses the guest-based estimate */}
      <button type='button' onClick={onApply} className={cn(PRIMARY_BTN, 'mt-15')}>
        Calculate Savings
      </button>
    </Modal>
  )
}
