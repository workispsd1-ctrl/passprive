'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserPlan } from '@/lib/context/PlanContext'
import { useAuthPrompt } from '@/lib/context/AuthPromptContext'
import { MEMBERSHIP_BADGE } from '@/lib/cashbackBadge'
import { canPayBill, getCashbackPct, type CashbackPlan, type MerchantCapabilityFields } from '@/lib/cashback'
import { buildDates, buildSlots, defaultMeal, longDate, type HoursRow, type Meal, type Slot } from '@/lib/booking/slots'
import type { BookingOption, DiningBooking } from '@/lib/booking/payload'
import { confirmBooking, initiateBookingPayment } from '@/lib/booking/client'
import { useExistingBookingGuard } from './useExistingBookingGuard'
import { usePaymentWindow } from '@/lib/hooks/usePaymentWindow'
import type { DiningOffer } from '@/lib/types/dining'
import { t } from '@/components/sections/dining/designUnit'
import { CardButton, Capsule, FlowLayout, type MerchantPanelData } from '@/components/sections/dining/MerchantFlowParts'
import { ProcessingScreen } from '@/components/sections/dining/PaymentScreens'
import { cancelDeadline } from './bookingTimes'

const GUESTS = Array.from({ length: 15 }, (_, i) => i + 1)
const MEALS: Meal[] = ['Lunch', 'Dinner']
// app parity: BookTableModal.jsx DATE_COUNT
const DATE_COUNT = 14
const NEXT_PLAN: Partial<Record<CashbackPlan, CashbackPlan>> = { free: 'premiere', premiere: 'black' }
const PLAN_LABEL: Record<CashbackPlan, string> = { free: 'Free', premiere: 'Plus', black: 'Black' }
const P = '/assets/pay-bill'

// app parity: ReviewRestaurantBooking.jsx default terms
const TERMS = [
  'Please arrive 15 minutes prior to your reservation time.',
  'Booking valid for the specified number of guests entered during reservation',
  'Cover charges upon entry are subject to the discretion of the restaurant',
  'Additional service charges on the bill are at the restaurant’s discretion',
  'House rules are to be observed at all times',
  'Special requests will be accommodated at the restaurant’s discretion',
  'Offers can be availed only by paying via PassPrivé',
  'Cover charges cannot be refunded if slot is cancelled within 30 minutes of slot start time',
  'Other T&Cs may apply',
]

/** app parity: `mapRestaurantOfferToCardOffer` + `getOfferLabel` — "10% Off" / "MUR 100 Off" */
function offerLabel(o: DiningOffer): string {
  const type = (o.offer_type ?? '').toLowerCase()
  const v = Number(o.discount_value)
  if (Number.isFinite(v) && v > 0) return type === 'percentage' || type === 'percent' ? `${v}% Off` : `MUR ${v} Off`
  return o.title
}
const kindOf = (o: DiningOffer) => String(o.metadata?.offerKind ?? '').trim().toUpperCase()

type Option = { key: string; label: string; title: string; perk: string | null; offer: DiningOffer | null }
type Step = 'select' | 'option' | 'review' | 'method'

export interface DiningBookingRestaurant extends MerchantCapabilityFields {
  id: string
  name: string
  cover_charge_enabled: boolean
  cover_charge_amount: number | null
  /** the platform booking fee (booking_fee_amount) */
  booking_fee: number
}

interface Props {
  restaurant: DiningBookingRestaurant
  panel: MerchantPanelData
  hours: HoursRow[]
  offers: DiningOffer[]
  isLoggedIn: boolean
  backHref: string
  /** this page — the receipt is drawn here with ?booked= */
  bookHref: string
  cancellation: { available: boolean; cutoffMinutes: number | null }
}

/** Section label — Figma 22 SemiBold. */
function Label({ children }: { children: React.ReactNode }) {
  return <p className='font-semibold text-[#2c2d32]' style={{ fontSize: t(22), marginBottom: t(16) }}>{children}</p>
}

/** A row that scrolls sideways, with round arrows while more is hidden (Figma slot rail). */
function Rail({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })
  const measure = () => {
    const el = ref.current
    if (el) setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const page = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' })
  const arrow = 'absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#2c2d32] shadow-[0_2px_10px_rgba(0,0,0,0.18)] hover:bg-gray-50'
  return (
    <div className='relative'>
      <div ref={ref} onScroll={measure} className={cn('scrollbar-hide overflow-x-auto', className)}>{children}</div>
      {!edges.start && (
        <button type='button' aria-label='Earlier' onClick={() => page(-1)} className={arrow} style={{ left: t(-18), width: t(36), height: t(36) }}>
          <ChevronLeft style={{ width: t(20), height: t(20) }} />
        </button>
      )}
      {!edges.end && (
        <button type='button' aria-label='Later' onClick={() => page(1)} className={arrow} style={{ right: t(-18), width: t(36), height: t(36) }}>
          <ChevronRight style={{ width: t(20), height: t(20) }} />
        </button>
      )}
    </div>
  )
}

/** One Figma detail line — label on the left, value on the right. */
function Line({ label, value, sub, strong = false }: { label: React.ReactNode; value: React.ReactNode; sub?: string; strong?: boolean }) {
  return (
    <div className='flex items-start justify-between' style={{ gap: t(16), padding: `${t(12)} 0` }}>
      <span className='min-w-0'>
        <span className={cn('block', strong ? 'font-bold text-[#2c2d32]' : 'text-[#5b5a5a]')} style={{ fontSize: t(strong ? 24 : 20) }}>{label}</span>
        {sub && <span className='block text-[#8e8e93]' style={{ fontSize: t(16) }}>{sub}</span>}
      </span>
      <span className={cn('shrink-0 text-right', strong ? 'font-bold text-[#2c2d32]' : 'font-semibold text-[#2c2d32]')} style={{ fontSize: t(strong ? 24 : 20) }}>{value}</span>
    </div>
  )
}

/**
 * Book a table — flow from the app (BookTableModal → slot options →
 * ReviewRestaurantBooking → PaymentMethod → CardPayment for a cover charge),
 * UI from the Figma "Flow Book Table" frames: the restaurant on the left, the
 * step in a card. A free booking confirms straight away; a cover charge is
 * paid on the bank's page in its own window. The receipt ("Table booked" /
 * "Requested table") is drawn by the page with ?booked=.
 */
export function DiningBookingFlow({ restaurant, panel, hours, offers, isLoggedIn, backHref, bookHref, cancellation }: Props) {
  const router = useRouter()
  const plan = useUserPlan()
  const { promptLogin } = useAuthPrompt()
  const dates = useMemo(() => buildDates(DATE_COUNT), [])
  const guard = useExistingBookingGuard({ restaurantId: restaurant.id, bookHref })

  const [step, setStep] = useState<Step>('select')
  const [guests, setGuests] = useState(2)
  const [dateId, setDateId] = useState(dates[0].id)
  const [pickedMeal, setPickedMeal] = useState<Meal>(defaultMeal)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [optionKey, setOptionKey] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [method, setMethod] = useState<'card' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // each step is a history entry, so the browser's back button steps back
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const s = (e.state as { bookStep?: Step } | null)?.bookStep
      setStep(s ?? 'select')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  function go(next: Step) {
    window.history.pushState({ bookStep: next }, '', `#${next}`)
    setStep(next)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function back() {
    if (step !== 'select') { window.history.back(); return }
    router.push(backHref)
  }

  const date = dates.find(d => d.id === dateId) ?? dates[0]
  const slots = useMemo(() => buildSlots(hours, date), [hours, date])
  const lunch = slots.filter(s => s.meal === 'Lunch')
  const dinner = slots.filter(s => s.meal === 'Dinner')
  // app parity: fall over to the other meal when the chosen one has no slots
  const meal: Meal =
    pickedMeal === 'Lunch' && !lunch.length && dinner.length ? 'Dinner'
      : pickedMeal === 'Dinner' && !dinner.length && lunch.length ? 'Lunch'
        : pickedMeal
  const mealSlots = meal === 'Lunch' ? lunch : dinner

  const payBillLive = canPayBill(restaurant)
  const cashbackPct = payBillLive ? getCashbackPct(restaurant, plan) : 0
  const nextPlan = NEXT_PLAN[plan]
  const nextCashbackPct = nextPlan && payBillLive ? getCashbackPct(restaurant, nextPlan) : 0
  const coverAmount = Number(restaurant.cover_charge_amount)
  const hasCoverCharge = restaurant.cover_charge_enabled && Number.isFinite(coverAmount) && coverAmount > 0

  // app parity: BookTableModal — only a TIME_SLOT offer is printed on the slots
  const slotOffer = payBillLive ? offers.find(o => kindOf(o) === 'TIME_SLOT') : undefined
  const slotLabel = slotOffer ? offerLabel(slotOffer) : ''

  // app parity: BookTableModal `offerOptions` — offers only when pay-bill is live; visit rewards are stamps, not booking options
  const options: Option[] = useMemo(() => {
    const fromOffers = payBillLive
      ? offers
          .filter(o => kindOf(o) !== 'VISIT')
          .map(o => ({ key: `offer-${o.id}`, label: offerLabel(o), title: o.title || offerLabel(o), perk: o.description?.trim() || null, offer: o }))
          .filter(o => o.label)
      : []
    return fromOffers.length ? fromOffers : [{ key: 'regular', label: 'Regular table reservation', title: 'Regular table reservation', perk: null, offer: null }]
  }, [offers, payBillLive])
  const chosen = options.find(o => o.key === optionKey) ?? null

  /** app parity: RestaurantDetails.jsx BookTableModal `onSelectSlot` option shape. */
  const bookingOption: BookingOption | null = chosen
    ? chosen.offer
      ? {
          type: 'Discount for selected time',
          label: chosen.label,
          id: chosen.offer.id,
          offerId: chosen.offer.id,
          offer_id: chosen.offer.id,
          title: chosen.offer.title,
          benefitLabel: chosen.label,
          upgradePlan: null,
          coverChargeRequired: hasCoverCharge,
          coverChargeAmount: hasCoverCharge ? coverAmount : null,
        }
      : {
          type: 'Regular table reservation',
          label: hasCoverCharge ? `MUR ${coverAmount} cover charge required` : 'No cover charge required',
          coverChargeRequired: hasCoverCharge,
          coverChargeAmount: hasCoverCharge ? coverAmount : null,
        }
    : null

  // app parity (fbaf070): ReviewRestaurantBooking bookingSummaryAmount — the booking fee, or the
  // cover charge when that's higher; one amount per booking, redeemed on the bill
  const payAmount = bookingOption
    ? Math.max(restaurant.booking_fee, bookingOption.coverChargeRequired ? (bookingOption.coverChargeAmount ?? 0) : 0)
    : 0
  const isFree = payAmount <= 0
  const deadline = slot ? cancelDeadline(dateId, slot.time24, cancellation.cutoffMinutes) : null

  function pickSlot(s: Slot) {
    setSlot(s)
    setOptionKey(k => k ?? options[0]?.key ?? null)
  }
  function clearSlot() {
    setSlot(null)
    setOptionKey(null)
  }

  const booking: DiningBooking | null =
    slot && bookingOption
      ? { kind: 'restaurant', restaurantId: restaurant.id, guests, dateId, time24: slot.time24, meal, option: bookingOption, notes: notes.trim() }
      : null
  const receiptHref = (id: string) => {
    const qs = new URLSearchParams({ booked: id })
    if (chosen?.offer) qs.set('offer', chosen.title)
    return `${bookHref}?${qs}`
  }

  // a cover charge is paid on the bank's page in its own window; the return page verifies + creates the booking
  const bank = usePaymentWindow(({ sessionId, merchantTrace, outcome }) => {
    const qs = new URLSearchParams({ session_id: sessionId, merchant_trace: merchantTrace })
    if (outcome) qs.set('outcome', outcome)
    router.replace(`/dining/cover-charge-return?${qs}`)
  })

  async function confirmFree() {
    if (!booking) return
    if (!isLoggedIn) { promptLogin(); return }
    setError(null)
    setSubmitting(true)
    try {
      const { booking: row } = await confirmBooking(booking)
      if (row?.id) { router.push(receiptHref(String(row.id))); return }
      router.push('/bookings')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not confirm your booking right now.')
      setSubmitting(false)
    }
  }

  async function payCover() {
    if (!booking || method !== 'card' || submitting) return
    if (!isLoggedIn) { promptLogin(); return }
    bank.open() // inside the click, so pop-up blockers allow it
    setError(null)
    setSubmitting(true)
    try {
      const { data, session } = await initiateBookingPayment(booking, { bookHref, offerLabel: chosen?.offer ? chosen.title : undefined })
      bank.launch(data, session)
    } catch (err) {
      bank.close()
      setError(err instanceof Error ? err.message : 'Payment could not be started. Please try again.')
      setSubmitting(false)
    }
  }

  const titleNode = (
    <h1 className='text-[#2c2d32]' style={{ fontSize: t(34) }}>
      {step === 'method' ? <span className='font-semibold' style={{ fontSize: t(44) }}>Select payment method</span> : <>Booking table at <span className='font-bold'>{restaurant.name}</span></>}
    </h1>
  )

  const chip = (label: string, onClick: () => void) => (
    <button
      key={label}
      type='button'
      onClick={onClick}
      className='flex items-center rounded-full border-solid border-[#ff4800]/30 bg-[#fff8f5] font-semibold text-[#2c2d32] hover:border-[#ff4800]'
      style={{ height: t(48), padding: `0 ${t(18)}`, gap: t(6), borderWidth: t(1.5), fontSize: t(20) }}
    >
      {label} <ChevronDown className='text-[#ff4800]' style={{ width: t(18), height: t(18) }} />
    </button>
  )

  return (
    <>
      <FlowLayout r={panel} label='Booking table at' onBack={back}>
        {titleNode}

        {/* ── 1. guests, date, meal, slot (Figma 11429:1184 / 1411) ── */}
        {step === 'select' && (
          <>
            <section style={{ marginTop: t(36) }}>
              <Label>Number of guest(s)</Label>
              <Rail className='flex' >
                <div className='flex' style={{ gap: t(12), padding: `${t(2)} ${t(2)}` }}>
                  {GUESTS.map(g => (
                    <button
                      key={g}
                      type='button'
                      onClick={() => setGuests(g)}
                      aria-pressed={g === guests}
                      className={cn(
                        'flex shrink-0 items-center justify-center rounded-full border-solid transition-colors',
                        g === guests ? 'border-[#ff4800] bg-[#fff1eb] font-semibold text-[#ff4800]' : 'border-[#d5d5d5] text-[#5b5a5a] hover:border-[#bdbdbd]',
                      )}
                      style={{ width: t(70), height: t(70), borderWidth: t(1.5), fontSize: t(24) }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </Rail>
            </section>

            <section style={{ marginTop: t(36) }}>
              <Label>When are you planning to visit?</Label>
              <Rail>
                <div className='flex border-b-solid border-[#fecdc4]' style={{ borderBottomWidth: t(2) }}>
                  {dates.map(d => {
                    const on = d.id === dateId
                    return (
                      <button
                        key={d.id}
                        type='button'
                        onClick={() => { setDateId(d.id); clearSlot() }}
                        aria-pressed={on}
                        className={cn('relative flex shrink-0 flex-col items-center', on ? 'text-[#ff4800]' : 'text-[#5b5a5a] hover:text-[#2c2d32]')}
                        style={{ minWidth: t(116), padding: `0 ${t(12)} ${t(10)}` }}
                      >
                        <span className={cn(on && 'font-bold')} style={{ fontSize: t(20) }}>{d.topLabel}</span>
                        <span style={{ fontSize: t(15) }}>{d.weekday}</span>
                        {on && <span className='absolute inset-x-0 rounded-full bg-[#ff4800]' style={{ bottom: t(-2), height: t(4) }} />}
                      </button>
                    )
                  })}
                </div>
              </Rail>
            </section>

            <div className='flex self-start rounded-full bg-[#f1f1f1] max-md:self-stretch' style={{ marginTop: t(32), padding: t(4) }}>
              {MEALS.map(m => {
                const count = (m === 'Lunch' ? lunch : dinner).length
                return (
                  <button
                    key={m}
                    type='button'
                    disabled={!count}
                    onClick={() => { setPickedMeal(m); clearSlot() }}
                    className={cn('rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 max-md:w-auto! max-md:flex-1', meal === m ? 'bg-[#2c2d32] text-white' : 'text-[#5b5a5a]')}
                    style={{ width: t(260), height: t(56), fontSize: t(20) }}
                  >
                    {m}
                  </button>
                )
              })}
            </div>

            <div style={{ marginTop: t(24) }}>
              {mealSlots.length ? (
                <Rail>
                  <div className='grid w-max grid-flow-col grid-rows-2' style={{ gap: t(14), padding: t(2) }}>
                    {mealSlots.map(s => {
                      const on = slot?.time24 === s.time24
                      return (
                        <button
                          key={s.absoluteMinutes}
                          type='button'
                          onClick={() => pickSlot(s)}
                          aria-pressed={on}
                          className={cn('flex flex-col items-center justify-center rounded-full border-solid transition-colors', on ? 'border-[#ff4800] bg-[#fff1eb]' : 'border-[#d5d5d5] hover:border-[#bdbdbd]')}
                          style={{ width: t(170), height: t(88), borderWidth: t(1.5) }}
                        >
                          <span className={cn('font-medium', on ? 'text-[#ff4800]' : 'text-[#2c2d32]')} style={{ fontSize: t(20) }}>{s.label}</span>
                          {slotLabel && <span className='text-[#ff4800]' style={{ fontSize: t(15) }}>{slotLabel}</span>}
                        </button>
                      )
                    })}
                  </div>
                </Rail>
              ) : (
                <p className='rounded-2xl bg-[#f6f6f6] text-center text-[#8e8e93]' style={{ padding: t(28), fontSize: t(20) }}>
                  {slots.length ? `No ${meal.toLowerCase()} slots on this day` : 'The restaurant is closed on this day — pick another date'}
                </p>
              )}
            </div>

            <div className='mt-auto' style={{ paddingTop: t(44) }}>
              {guard.error && <p role='alert' className='text-center font-medium text-red-600' style={{ marginBottom: t(12), fontSize: t(18) }}>{guard.error}</p>}
              <CardButton onClick={() => { if (slot) void guard.check({ dateId, time24: slot.time24 }, () => go('option')) }} disabled={!slot}>Proceed</CardButton>
            </div>
          </>
        )}

        {/* ── 2. choose the option for the slot (Figma 11429:1638) ── */}
        {step === 'option' && slot && (
          <>
            <div className='flex flex-wrap' style={{ marginTop: t(28), gap: t(12) }}>
              {[meal, `${date.day} ${date.month}`, `${guests} guest${guests === 1 ? '' : 's'}`].map(l => chip(l, back))}
            </div>
            <Rail>
              <div className='flex' style={{ marginTop: t(20), gap: t(12), padding: t(2) }}>
                {mealSlots.map(s => (
                  <button
                    key={s.absoluteMinutes}
                    type='button'
                    onClick={() => setSlot(s)}
                    className={cn('shrink-0 rounded-full border-solid font-semibold', s.time24 === slot.time24 ? 'border-[#ff4800] bg-[#fff1eb] text-[#ff4800]' : 'border-[#d5d5d5] text-[#2c2d32] hover:border-[#bdbdbd]')}
                    style={{ height: t(52), padding: `0 ${t(22)}`, borderWidth: t(1.5), fontSize: t(18) }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Rail>

            <p className='font-semibold text-[#2c2d32]' style={{ marginTop: t(32), fontSize: t(24) }}>Choose preferred option for {slot.label}</p>
            <div className='flex flex-col' style={{ marginTop: t(16), gap: t(16) }}>
              {options.map(o => {
                const on = o.key === optionKey
                return (
                  <div key={o.key}>
                    <button
                      type='button'
                      role='radio'
                      aria-checked={on}
                      onClick={() => setOptionKey(o.key)}
                      className={cn('relative z-10 flex w-full flex-col border-solid bg-white text-left transition-colors', on ? 'border-[#ff4800]' : 'border-[#e5e5e5] hover:border-[#c9c9c9]')}
                      style={{ borderWidth: t(2), borderRadius: t(28), padding: `${t(20)} ${t(24)}`, gap: t(10) }}
                    >
                      {o.offer && (
                        <span className='flex items-center justify-between'>
                          <span className='font-bold tracking-wider text-[#ff4800]' style={{ fontSize: t(16) }}>EXCLUSIVE</span>
                          {plan !== 'free' && <Image src={MEMBERSHIP_BADGE[plan]} alt={`Privé ${PLAN_LABEL[plan]}`} width={102} height={44} className='w-auto' style={{ height: t(36) }} />}
                        </span>
                      )}
                      <span className='flex items-start justify-between' style={{ gap: t(16) }}>
                        <span className='font-bold text-[#111]' style={{ fontSize: t(26) }}>{o.offer ? o.title : o.label}</span>
                        <span className={cn('flex shrink-0 items-center justify-center rounded-full border-solid', on ? 'border-[#ff4800]' : 'border-[#c7c7cc]')} style={{ width: t(28), height: t(28), borderWidth: t(2.5) }}>
                          {on && <span className='rounded-full bg-[#ff4800]' style={{ width: t(14), height: t(14) }} />}
                        </span>
                      </span>
                      {hasCoverCharge && <span className='text-[#5b5a5a]' style={{ fontSize: t(18) }}>Redeemable cover charge: MUR {coverAmount}</span>}
                      {(cashbackPct > 0 || o.perk) && (
                        <span className='flex flex-wrap items-center' style={{ gap: t(10) }}>
                          {cashbackPct > 0 && <span className='rounded-full bg-[#eef3ff] font-semibold text-[#0248f6]' style={{ padding: `${t(4)} ${t(14)}`, fontSize: t(16) }}>+ {cashbackPct}% cashback</span>}
                          {o.perk && <span className='rounded-full bg-[#fff1eb] font-semibold text-[#d93d00]' style={{ padding: `${t(4)} ${t(14)}`, fontSize: t(16) }}>{o.perk}</span>}
                        </span>
                      )}
                    </button>
                    {/* app parity: one-tier-up upsell under each offer */}
                    {o.offer && nextPlan && nextCashbackPct > cashbackPct && (
                      <Link
                        href='/membership'
                        className='flex items-center justify-between bg-linear-to-r from-[#211b1b] to-[#685125] font-semibold text-white'
                        style={{ marginTop: t(-24), padding: `${t(36)} ${t(24)} ${t(14)}`, borderRadius: `0 0 ${t(28)} ${t(28)}`, fontSize: t(18) }}
                      >
                        <span>{nextCashbackPct}% cashback with {PLAN_LABEL[nextPlan]}</span>
                        <span className='text-[#ff8a50]'>Upgrade &amp; Apply →</span>
                      </Link>
                    )}
                  </div>
                )
              })}
              {!payBillLive && <p className='text-[#8e8e93]' style={{ fontSize: t(16) }}>Offers and cashback aren’t available at this restaurant yet.</p>}
            </div>

            {hasCoverCharge && (
              <p className='text-[#5b5a5a]' style={{ marginTop: t(20), fontSize: t(18) }}>
                Cover charge is <span className='font-semibold text-[#0248f6]'>redeemable</span> when you pay bill via PassPrivé
              </p>
            )}
            <div className='mt-auto' style={{ paddingTop: t(40) }}>
              <CardButton onClick={() => go('review')} disabled={!optionKey}>Proceed</CardButton>
            </div>
          </>
        )}

        {/* ── 3. booking summary (Figma 11429:1853) ── */}
        {step === 'review' && slot && bookingOption && (
          <>
            {chosen?.offer && (
              <p className='self-start rounded-full bg-[#fff1eb] font-semibold text-[#ff4800]' style={{ marginTop: t(20), padding: `${t(8)} ${t(20)}`, fontSize: t(20) }}>
                {chosen.title}
              </p>
            )}

            <div className='grid lg:grid-cols-2' style={{ marginTop: t(28), gap: t(28) }}>
              <div className='rounded-[inherit] border border-[#efefef]' style={{ borderRadius: t(24), padding: `${t(12)} ${t(24)}` }}>
                <p className='font-bold text-[#2c2d32]' style={{ fontSize: t(22), padding: `${t(10)} 0` }}>Booking table details</p>
                <Line label={longDate(dateId)} value={date.topLabel} />
                <Line label={meal} value={slot.label} />
                <Line label='Guests' value={`for ${guests}`} />
                {(panel.area || panel.city) && <Line label='Location' value={[panel.area, panel.city].filter(Boolean).join(', ')} />}
              </div>

              <div className='border border-[#f6dccf] bg-linear-to-b from-white to-[#fff3ee]' style={{ borderRadius: t(24), padding: `${t(12)} ${t(24)}` }}>
                <p className='font-bold text-[#2c2d32]' style={{ fontSize: t(22), padding: `${t(10)} 0` }}>Bill details</p>
                {cashbackPct > 0 && (
                  <p className='text-[#5b5a5a]' style={{ fontSize: t(18), padding: `${t(6)} 0` }}>
                    You will earn <span className='font-semibold text-[#0248f6]'>{cashbackPct}% cashback</span> when you pay bill
                    {nextPlan && nextCashbackPct > cashbackPct && (
                      <Link href='/membership' className='block font-semibold text-[#ff4800] hover:underline'>See how you can earn {nextCashbackPct}% →</Link>
                    )}
                  </p>
                )}
                {hasCoverCharge ? (
                  <Line label='Cover charge' sub='Redeemable when you pay bill via PassPrivé' value={`MUR ${payAmount}`} />
                ) : (
                  <Line label='Cover charge' value='None' />
                )}
                <div className='border-t border-dashed border-[#f2c9b8]'>
                  <Line label='To be paid' value={`MUR ${payAmount}`} strong />
                </div>
              </div>
            </div>

            <div className='flex flex-col' style={{ marginTop: t(24), gap: t(10), fontSize: t(18) }}>
              <p className='text-[#5b5a5a]'>
                <span className='font-semibold text-[#2c2d32]'>Need modifications? </span>
                {cancellation.available && deadline ? `Valid till ${deadline}` : 'Contact the restaurant or support'}
              </p>
              <p className='text-[#5b5a5a]'>
                <span className='font-semibold text-[#2c2d32]'>Might need to cancel? </span>
                {cancellation.available && deadline ? `100% refund till ${deadline}` : 'This booking can’t be cancelled online'}
              </p>
            </div>

            <div style={{ marginTop: t(20) }}>
              <button type='button' onClick={() => setShowNotes(v => !v)} className='font-semibold text-[#ff4800]' style={{ fontSize: t(18) }}>
                {showNotes ? 'Hide special request' : '+ Add special request'}
              </button>
              {showNotes && (
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder='Birthday, window seat, allergies…'
                  className='mt-3 w-full rounded-2xl border border-[#d5d5d5] p-3 text-[15px] focus:border-[#ff4800] focus:outline-none'
                />
              )}
            </div>

            <div style={{ marginTop: t(12) }}>
              <button type='button' onClick={() => setShowTerms(v => !v)} className='flex items-center font-semibold text-[#2c2d32]' style={{ fontSize: t(18), gap: t(6) }}>
                Terms &amp; Conditions <ChevronDown className={cn('transition-transform', showTerms && 'rotate-180')} style={{ width: t(18), height: t(18) }} />
              </button>
              {showTerms && (
                <ul className='list-disc text-[#5b5a5a]' style={{ marginTop: t(10), paddingLeft: t(24), fontSize: t(16), lineHeight: 1.6 }}>
                  {TERMS.map(term => <li key={term}>{term}</li>)}
                </ul>
              )}
            </div>

            {error && <p role='alert' className='self-start rounded-2xl bg-[#fdecec] font-medium text-[#c62828]' style={{ marginTop: t(16), padding: `${t(12)} ${t(18)}`, fontSize: t(18) }}>{error}</p>}
            <div className='mt-auto' style={{ paddingTop: t(36) }}>
              {isFree ? (
                <CardButton onClick={confirmFree} disabled={submitting}>{submitting ? 'Booking…' : isLoggedIn ? 'Book table' : 'Log in to book'}</CardButton>
              ) : (
                <CardButton onClick={() => (isLoggedIn ? go('method') : promptLogin())}>{isLoggedIn ? `Proceed to pay MUR ${payAmount}` : 'Log in to book'}</CardButton>
              )}
            </div>
          </>
        )}

        {/* ── 4. payment method (Figma 11429:2048) — cover charge only ── */}
        {step === 'method' && (
          <>
            <p className='text-[#8e8e93]' style={{ marginTop: t(8), fontSize: t(24), letterSpacing: t(0.4) }}>Paying MUR {payAmount}</p>
            <div style={{ marginTop: t(44) }}>
              <Capsule
                role='radio'
                selected={method === 'card'}
                onClick={() => setMethod('card')}
                icon={<Image src={`${P}/credit-card.svg`} alt='' width={36} height={36} style={{ width: t(36), height: t(36) }} />}
                title='Credit/Debit Card'
                trailing={
                  method === 'card'
                    ? <Check className='text-[#ff4800]' style={{ width: t(26), height: t(26) }} strokeWidth={3} />
                    : <Image src={`${P}/chevron.svg`} alt='' width={14} height={24} className='rotate-180' style={{ width: t(13.5), height: t(24) }} />
                }
              />
            </div>
            <p className='flex items-start text-[#8e8e93]' style={{ marginTop: t(20), gap: t(8), fontSize: t(18) }}>
              <Info className='shrink-0' style={{ width: t(20), height: t(20), marginTop: t(3) }} />
              You’ll enter your card details and the OTP from your bank on its secure page. The cover charge is redeemed on your bill.
            </p>
            {error && <p role='alert' className='self-start rounded-2xl bg-[#fdecec] font-medium text-[#c62828]' style={{ marginTop: t(16), padding: `${t(12)} ${t(18)}`, fontSize: t(18) }}>{error}</p>}
            <div className='mt-auto' style={{ paddingTop: t(48) }}>
              <CardButton onClick={payCover} disabled={method !== 'card' || submitting}>Confirm Payment</CardButton>
            </div>
          </>
        )}
      </FlowLayout>

      {submitting && !bank.waiting && step === 'method' && <ProcessingScreen sub='Opening your bank’s secure page — please do not close this window' />}
      {guard.modals}
      {bank.waiting && (
        <ProcessingScreen title='Waiting for your payment…' sub='Enter your card details and the OTP in the bank’s secure window. We’ll confirm your table as soon as it’s done.'>
          <div className='flex flex-wrap justify-center' style={{ marginTop: t(12), gap: t(16) }}>
            <button type='button' onClick={bank.focus} className='rounded-full bg-[#ff4800] font-semibold text-white hover:bg-brand-dark' style={{ height: t(64), padding: `0 ${t(36)}`, fontSize: t(22) }}>
              Show payment window
            </button>
            <button type='button' onClick={bank.cancel} className='rounded-full border border-[#d5d5d5] font-semibold text-[#5b5a5a] hover:border-[#bdbdbd]' style={{ height: t(64), padding: `0 ${t(36)}`, fontSize: t(22) }}>
              Cancel
            </button>
          </div>
        </ProcessingScreen>
      )}
    </>
  )
}
