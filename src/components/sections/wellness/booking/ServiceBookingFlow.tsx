'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, Clock, Loader2, Minus, Plus, Sparkles, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCashbackPct, type MerchantCapabilityFields } from '@/lib/cashback'
import { useAuthPrompt } from '@/lib/context/AuthPromptContext'
import { buildDates, buildSlots, dayLabel, longDate, type HoursRow, type Slot } from '@/lib/booking/slots'
import type { BookingOption, SelectedService, ServiceBooking } from '@/lib/booking/payload'
import { confirmBooking, startBookingPayment } from '@/lib/booking/client'
import { DateStrip, TermsBlock } from '@/components/sections/booking/BookingPickers'
import type { ServiceCategory, ServiceItem, ServiceOffer } from '@/lib/types/stores'

// app parity: ServiceBookSlotScreen.jsx `buildContinuousDates(30)`
const DATE_COUNT = 30
const GENDERS = ['WOMEN', 'MEN'] as const
type Gender = (typeof GENDERS)[number]

// app parity: ReviewStoreBooking.jsx default terms
const DEFAULT_TERMS = [
  'The cover charge is non refundable upon cancellation',
  'Services added to the cart are subject to availability at the time of checkout',
  'Adding items to the cart does not confirm the booking until payment is completed',
]

type ActiveOrder = { id: string; slot_start_at: string | null }

function formatDuration(mins: number | null): string | null {
  if (!mins || mins <= 0) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return [h ? `${h} hr` : null, m ? `${m} min` : null].filter(Boolean).join(' ')
}

function money(n: number): string {
  return `MUR ${n.toLocaleString()}`
}

export interface ServiceBookingStore {
  id: string
  name: string
  href: string
  address: string | null
  cover?: string | null
  logo?: string | null
  /** cashback rules — the summary's "You will earn X% cashback" */
  caps?: MerchantCapabilityFields
  coverChargeEnabled: boolean
  coverChargeAmount: number | null
  /** the platform booking fee (booking_fee_amount) */
  bookingFee: number
  bookingTerms: string[]
}

interface Props {
  store: ServiceBookingStore
  categories: ServiceCategory[]
  hours: HoursRow[]
  offers: ServiceOffer[]
  initialCategoryId: string | null
  isLoggedIn: boolean
}

export function ServiceBookingFlow({ store, categories, hours, offers, initialCategoryId, isLoggedIn }: Props) {
  const { promptLogin } = useAuthPrompt()
  const plan = useUserPlan()
  const dates = useMemo(() => buildDates(DATE_COUNT), [])

  const [step, setStep] = useState<'services' | 'slot' | 'summary' | 'done'>('services')
  const [categoryId, setCategoryId] = useState(
    categories.find(c => c.id === initialCategoryId)?.id ?? categories[0]?.id ?? null,
  )
  const [gender, setGender] = useState<Gender>('WOMEN')
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [dateId, setDateId] = useState(dates[0].id)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [offerIdx, setOfferIdx] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState<{ sameSlot: boolean; order: ActiveOrder } | null>(null)

  const itemsById = useMemo(() => {
    const map = new Map<string, ServiceItem>()
    categories.forEach(c => c.items.forEach(i => map.set(i.id, i)))
    return map
  }, [categories])

  const category = categories.find(c => c.id === categoryId) ?? categories[0]
  // app parity: ServiceSelectionScreen `filteredServices` — unisex / untagged always show
  const visibleItems = (category?.items ?? []).filter(i => {
    const sf = (i.service_for ?? '').trim().toUpperCase()
    return !sf || sf === 'UNISEX' || sf === gender
  })

  const selected: SelectedService[] = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .flatMap(([id, n]) => {
      const item = itemsById.get(id)
      return item ? [{ id, title: item.title, quantity: n, price: Number(item.price) || 0 }] : []
    })
  const totalCount = selected.reduce((s, x) => s + x.quantity, 0)
  const servicesTotal = selected.reduce((s, x) => s + x.quantity * x.price, 0)

  const change = (id: string, delta: number) =>
    setCounts(cur => {
      const n = (cur[id] ?? 0) + delta
      const next = { ...cur }
      if (n <= 0) delete next[id]
      else next[id] = n
      return next
    })

  const date = dates.find(d => d.id === dateId) ?? dates[0]
  const slots = useMemo(() => buildSlots(hours, date), [hours, date])

  const offer = offers[offerIdx] ?? null
  // app parity: ServiceBookSlotScreen `bookingPayload.option`
  const option: BookingOption = offer
    ? { type: offer.title, label: offer.description || offer.title, coverChargeRequired: false, coverChargeAmount: null }
    : { type: 'Regular appointment slot', label: 'No cover charge required', coverChargeRequired: false, coverChargeAmount: null }

  // app parity (fbaf070): ReviewStoreBooking `bookingSummaryAmount` — the platform booking fee
  const payAmount = store.bookingFee > 0 ? store.bookingFee : 0
  const isFree = payAmount <= 0

  /** app parity: ServiceBookSlotScreen `onProceed` — login, then the existing-booking check. */
  async function proceedFromSlot() {
    if (!slot) return
    if (!isLoggedIn) { promptLogin(); return }
    setError(null)
    setBusy(true)
    try {
      const res = await fetch(`/api/bookings/store/active?store_id=${encodeURIComponent(store.id)}`)
      const data = await res.json() as { bookings?: ActiveOrder[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'check failed')
      const orders = data.bookings ?? []
      const wanted = new Date(`${dateId}T${slot.time24}:00`).getTime()
      const same = orders.find(o => o.slot_start_at && new Date(o.slot_start_at).getTime() === wanted)
      if (same) setConflict({ sameSlot: true, order: same })
      else if (orders.length) setConflict({ sameSlot: false, order: orders[0] })
      else setStep('summary')
    } catch {
      setError('We could not verify your existing bookings right now. Please try again.')
    }
    setBusy(false)
  }

  async function cancelExisting() {
    if (!conflict) return
    setBusy(true)
    try {
      const res = await fetch(`/api/bookings/store/${conflict.order.id}/cancel`, { method: 'PATCH' })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})) as { error?: string }).error ?? 'Cancellation failed')
      setConflict(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not cancel the existing booking right now.')
      setConflict(null)
    }
    setBusy(false)
  }

  async function confirm() {
    if (!slot) return
    if (!isLoggedIn) { promptLogin(); return }
    setError(null)
    setBusy(true)
    const booking: ServiceBooking = {
      kind: 'store',
      storeId: store.id,
      guests: 1,
      dateId,
      time24: slot.time24,
      services: selected,
      option,
      notes: '',
    }
    try {
      if (isFree) {
        await confirmBooking(booking)
        setStep('done')
      } else {
        await startBookingPayment(booking, { storeHref: store.href, storeName: store.name })
        return // navigating to the gateway
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not confirm your booking right now.')
    }
    setBusy(false)
  }

  // app parity: ServiceSelection → ServiceBookSlot → ReviewStoreBooking (the bill summary) → pay
  const STEPS = [
    { key: 'services', label: 'Services' },
    { key: 'slot', label: 'Date & time' },
    { key: 'summary', label: 'Summary' },
  ] as const
  const stepIndex = step === 'done' ? STEPS.length : STEPS.findIndex(x => x.key === step)
  const CARD = 'rounded-2xl border border-[#F0F0F0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]'

  // the page frame: banner with the salon and the steps, then the website's side margins
  const frame = (children: React.ReactNode) => (
    <main className='min-h-screen bg-[#FAFAFA] pb-32 font-(family-name:--font-dm-sans) md:mx-[calc(50%-50vw)] md:-mt-9.5 md:w-screen md:[--u:calc(100vw/1920)] lg:pb-16'>
      <section className='relative overflow-hidden bg-[#1A1311] text-white'>
        {store.cover && <Image src={store.cover} alt='' fill priority sizes='100vw' className='object-cover opacity-45' />}
        <span aria-hidden='true' className='absolute inset-0 bg-linear-to-t from-black/75 via-black/35 to-transparent' />
        <div className='relative flex flex-col gap-5 px-4 pt-6 pb-7 md:px-[max(32px,calc(172*var(--u)))] md:pt-14 md:pb-9'>
          <Link href={store.href} className='flex w-fit items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium backdrop-blur-sm hover:bg-white/25'>
            <ArrowLeft className='size-4' /> Back to {store.name}
          </Link>
          <div className='flex items-end justify-between gap-6 max-md:flex-col max-md:items-start'>
            <div className='flex items-center gap-4'>
              {store.logo && (
                <span className='relative size-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white/80 bg-white md:size-20'>
                  <Image src={store.logo} alt='' fill sizes='80px' className='object-cover' />
                </span>
              )}
              <div className='min-w-0'>
                <p className='text-sm font-semibold tracking-[0.14em] text-[#FFB899] uppercase'>Book an appointment</p>
                <h1 className='mt-1 text-3xl font-bold md:text-[44px] md:leading-tight'>{store.name}</h1>
                {store.address && <p className='mt-1 text-sm text-white/80 md:text-base'>{store.address}</p>}
              </div>
            </div>
            {/* steps */}
            <ol className='flex items-center gap-2 text-sm'>
              {STEPS.map((x, i) => (
                <li key={x.key} className='flex items-center gap-2'>
                  {i > 0 && <span className={cn('h-px w-6 md:w-10', i <= stepIndex ? 'bg-white' : 'bg-white/30')} />}
                  <span className={cn('flex size-7 items-center justify-center rounded-full text-xs font-bold', i < stepIndex ? 'bg-white text-brand' : i === stepIndex ? 'bg-brand text-white' : 'bg-white/15 text-white/70')}>
                    {i < stepIndex ? <Check className='size-3.5' strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={cn('font-semibold max-sm:hidden', i === stepIndex ? 'text-white' : 'text-white/70')}>{x.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
      <div className='px-4 pt-6 md:px-[max(32px,calc(172*var(--u)))] lg:pt-8'>{children}</div>
    </main>
  )

  // "Your appointment" — the services, the slot once picked, the totals and the step's button
  const summary = (cta: React.ReactNode, editable: boolean) => (
    <div className={cn(CARD, 'p-4')}>
      <h2 className='flex items-center gap-2 text-[15px] font-bold text-[#101010]'>
        <Sparkles className='size-4 text-brand' /> Your appointment
        {totalCount > 0 && <span className='ml-auto text-xs font-medium text-[#8A8A8E]'>{totalCount} service{totalCount === 1 ? '' : 's'}</span>}
      </h2>
      {selected.length === 0 ? (
        <p className='mt-3 rounded-xl bg-[#FAFAFA] px-3 py-4 text-center text-[13px] leading-5 text-[#8A8A8E]'>No services yet.<br />Add the ones you&rsquo;d like to book.</p>
      ) : (
        <ul className='mt-3 flex max-h-[38vh] flex-col divide-y divide-[#F3F3F3] overflow-y-auto pr-1'>
          {selected.map(sv => (
            <li key={sv.id} className='flex items-center gap-2.5 py-2.5 first:pt-0'>
              <span className='min-w-0 flex-1'>
                <span className='block truncate text-[13px] font-semibold text-[#2C2D32]'>{sv.title}</span>
                <span className='block text-xs text-[#8A8A8E]'>{sv.price > 0 ? money(sv.price * sv.quantity) : 'Price at the salon'}{!editable && sv.quantity > 1 ? ` · ×${sv.quantity}` : ''}</span>
              </span>
              {editable && <Stepper n={sv.quantity} onAdd={() => change(sv.id, 1)} onRemove={() => change(sv.id, -1)} small />}
            </li>
          ))}
        </ul>
      )}
      {slot && step !== 'services' && (
        <p className='mt-3 flex items-center gap-2 rounded-xl bg-[#FFF5F0] px-3 py-2 text-[13px] font-semibold text-[#2C2D32]'>
          <CalendarDays className='size-4 text-brand' /> {dayLabel(dateId)}, {longDate(dateId)} · {slot.label}
        </p>
      )}
      {selected.length > 0 && (
        <div className='mt-3 flex flex-col gap-1.5 border-t border-dashed border-[#EAEAEA] pt-3 text-[13px]'>
          {servicesTotal > 0 && (
            <p className='flex justify-between'><span className='text-[#5B5A5A]'>Services <span className='text-[#8A8A8E]'>(pay at salon)</span></span><span className='font-semibold text-[#101010]'>{money(servicesTotal)}</span></p>
          )}
          <p className='flex justify-between'><span className='text-[#5B5A5A]'>Pay now</span><span className='text-base font-bold text-[#101010]'>{isFree ? 'Free' : money(payAmount)}</span></p>
        </div>
      )}
      {error && <p className='mt-3 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-600'>{error}</p>}
      <div className='mt-3'>{cta}</div>
    </div>
  )

  const button = (label: React.ReactNode, onClick: () => void, disabled = false) => (
    <button
      type='button'
      disabled={disabled || busy}
      onClick={onClick}
      className='flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-40'
    >
      {busy && <Loader2 className='size-4 animate-spin' />}
      {label}
    </button>
  )

  // two columns on desktop: the step, and the sticky summary; phones stack them
  const twoCol = (main: React.ReactNode, side: React.ReactNode) => (
    <div className='flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_340px]'>
      <div className='min-w-0'>{main}</div>
      <aside className='lg:sticky lg:top-6'>{side}</aside>
    </div>
  )

  if (!categories.length) {
    return frame(
      <div className={cn(CARD, 'mx-auto max-w-md p-8 text-center')}>
        <p className='font-semibold text-gray-800'>This salon hasn&rsquo;t listed bookable services yet.</p>
        <Link href={store.href} className='mt-3 inline-block text-sm font-semibold text-brand'>Back to {store.name}</Link>
      </div>,
    )
  }

  /* ── Done (app parity: PaymentSuccess after BookingSaving) ─────────── */
  if (step === 'done' && slot) {
    return frame(
      <div className={cn(CARD, 'mx-auto flex max-w-lg flex-col items-center gap-3 p-10 text-center')}>
        <CheckCircle2 className='size-16 text-green-600' />
        <p className='text-2xl font-bold text-gray-900'>Appointment booked</p>
        <p className='text-sm text-gray-500'>{store.name} · {dayLabel(dateId)}, {longDate(dateId)} at {slot.label}</p>
        <p className='text-sm text-gray-500'>{selected.map(sv => (sv.quantity > 1 ? `${sv.title} ×${sv.quantity}` : sv.title)).join(', ')}</p>
        <Link href={store.href} className='mt-3 rounded-full bg-brand px-8 py-3 text-sm font-bold text-white hover:bg-brand-dark'>Done</Link>
      </div>,
    )
  }

  /* ── Summary (app parity: ReviewStoreBooking.jsx) — everything before paying ── */
  if (step === 'summary' && slot) {
    const cashbackPct = store.caps ? getCashbackPct(store.caps, plan) : 0
    const terms = store.bookingTerms.length ? store.bookingTerms : DEFAULT_TERMS
    const [hhmm, period] = slot.label.split(' ')
    return frame(twoCol(
      <div className='flex flex-col gap-5'>
        <button type='button' onClick={() => setStep('slot')} className='flex w-fit items-center gap-1 text-sm font-semibold text-[#5B5A5A] hover:text-[#101010]'>
          <ChevronLeft className='size-4' /> Change date &amp; time
        </button>

        {/* Booking slot details — with the offer band underneath when one is picked */}
        <div className={cn(CARD, 'overflow-hidden', offer && 'border-brand/40')}>
          <div className='p-6'>
            <h2 className='text-[17px] font-bold text-[#101010]'>Booking slot details</h2>
            <div className='mt-5 grid grid-cols-3 divide-x divide-[#F0F0F0] text-center'>
              <div className='px-2'><p className='text-lg font-bold text-[#101010] underline decoration-[#D5D5D5] underline-offset-4'>{dayLabel(dateId)}</p><p className='mt-1 text-sm text-[#8A8A8E]'>{longDate(dateId)}</p></div>
              <div className='px-2'><p className='text-lg font-bold text-[#101010]'>{hhmm}</p><p className='mt-1 text-sm text-[#8A8A8E]'>{period ?? ''}</p></div>
              <div className='px-2'><p className='text-lg font-bold text-[#101010]'>Stylist</p><p className='mt-1 text-sm text-[#8A8A8E]'>Best available</p></div>
            </div>
            <div className='mt-5 flex gap-4 rounded-xl bg-[#FAFAFA] px-4 py-3'>
              <span className='text-sm font-bold text-[#101010]'>Service</span>
              <span className='text-sm text-[#5B5A5A]'>{selected.map(sv => (sv.quantity > 1 ? `${sv.title} ×${sv.quantity}` : sv.title)).join(', ')}</span>
            </div>
          </div>
          {offer && (
            <p className='flex items-center justify-center gap-2 bg-brand px-4 py-2.5 text-sm font-semibold text-white'>
              <Ticket className='size-4' /> {offer.title}
            </p>
          )}
        </div>

        {/* Bill details */}
        <div>
          <h2 className='mb-3 text-[17px] font-bold text-[#101010]'>Bill details</h2>
          <div className='rounded-2xl border border-[#FFD9C7] bg-linear-to-b from-white to-[#FFF1EA] p-6'>
            {payAmount > 0 && (
              <>
                <p className='flex justify-between text-[15px] text-[#2C2D32]'><span>Cover charges: 1 guest</span><span className='font-semibold'>{money(payAmount)}</span></p>
                <p className='mt-1 text-[13px] text-brand'>Redeemable when you pay bill via PassPrivé</p>
                <div className='my-4 border-t border-dashed border-[#FFD9C7]' />
              </>
            )}
            <p className='flex justify-between text-[17px] font-bold text-[#101010]'><span>To be paid</span><span>{isFree ? 'Free' : money(payAmount)}</span></p>
            {servicesTotal > 0 && <p className='mt-2 text-[13px] text-[#8A8A8E]'>Services ({money(servicesTotal)}) are paid at the salon.</p>}
          </div>
        </div>

        {/* cashback on the bill */}
        <div className='flex items-center gap-4 rounded-2xl border border-[#FFD9C7] bg-linear-to-b from-[#FFF1EA] to-white px-5 py-4'>
          <Image src='/assets/merchant-detail/earn-coin.png' alt='' width={96} height={96} className='size-12 shrink-0 -rotate-12' />
          <p className='text-[15px] font-semibold text-[#424144]'>
            {cashbackPct > 0 ? <>You will earn <span className='text-[#0248F6]'>{cashbackPct}% cashback</span> when you pay bill</> : 'Earn cashback when you pay bill via PassPrivé'}
          </p>
        </div>

        {/* Terms & conditions */}
        <details className={cn(CARD, 'group p-0')}>
          <summary className='flex cursor-pointer list-none items-center justify-between px-6 py-4 text-[15px] font-semibold text-[#101010]'>
            Terms &amp; Conditions <ChevronDown className='size-4 text-[#8A8A8E] transition-transform group-open:rotate-180' />
          </summary>
          <div className='border-t border-[#F3F3F3] px-6 py-4'><TermsBlock terms={terms} /></div>
        </details>
      </div>,
      <div className={cn(CARD, 'p-5')}>
        <p className='flex items-baseline justify-between'><span className='text-sm font-medium text-[#5B5A5A]'>To be paid</span><span className='text-2xl font-bold text-[#101010]'>{isFree ? 'Free' : money(payAmount)}</span></p>
        {payAmount > 0 && <p className='mt-2 text-[13px] text-[#8A8A8E]'>Cover charge is <span className='text-brand'>redeemable</span> when you pay bill via PassPrivé</p>}
        {error && <p className='mt-3 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-600'>{error}</p>}
        <div className='mt-4'>{button(!isLoggedIn ? 'Log in to book' : isFree ? 'Proceed to book' : `Proceed to pay ${money(payAmount)}`, confirm)}</div>
      </div>,
    ))
  }

  /* ── Slot (app parity: ServiceBookSlotScreen.jsx) ──────────────────── */
  if (step === 'slot') {
    return frame(<>
      {twoCol(
        <div className='flex flex-col gap-5'>
          <button type='button' onClick={() => setStep('services')} className='flex w-fit items-center gap-1 text-sm font-semibold text-[#5B5A5A] hover:text-[#101010]'>
            <ChevronLeft className='size-4' /> Change services
          </button>
          <section className={cn(CARD, 'p-6')}>
            <h2 className='mb-4 text-[17px] font-bold text-[#101010]'>Pick a date</h2>
            <DateStrip dates={dates} selectedId={dateId} onSelect={id => { setDateId(id); setSlot(null) }} />
          </section>
          <section className={cn(CARD, 'p-6')}>
            <h2 className='mb-4 text-[17px] font-bold text-[#101010]'>Pick a time <span className='text-sm font-medium text-[#8A8A8E]'>· {dayLabel(dateId)}, {longDate(dateId)}</span></h2>
            <SlotPills slots={slots} selected={slot?.time24 ?? null} onSelect={setSlot} />
          </section>
          {offers.length > 0 && (
            <section className={cn(CARD, 'p-6')}>
              <h2 className='mb-4 text-[17px] font-bold text-[#101010]'>Offers</h2>
              <div className='grid gap-3 sm:grid-cols-2'>
                {offers.map((o, i) => (
                  <button key={o.id} type='button' onClick={() => setOfferIdx(i)} className={cn('flex items-start justify-between gap-3 rounded-2xl border p-4 text-left transition-colors', i === offerIdx ? 'border-brand bg-[#FFF5F0]' : 'border-[#EAEAEA] hover:border-[#D5D5D5]')}>
                    <div><p className='text-[14px] font-bold text-[#101010]'>{o.title}</p>{o.description && <p className='mt-0.5 text-[12px] text-[#8A8A8E]'>{o.description}</p>}</div>
                    <span className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2', i === offerIdx ? 'border-brand' : 'border-gray-300')}>{i === offerIdx && <span className='size-2.5 rounded-full bg-brand' />}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>,
        summary(
          button(
            !isLoggedIn ? 'Log in to continue' : !slot ? 'Pick a time to continue' : 'Continue',
            proceedFromSlot,
            !slot,
          ),
          false,
        ),
      )}
      {conflict && (
        <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center' onClick={() => !busy && setConflict(null)}>
          <div className='w-full max-w-sm rounded-2xl bg-white p-6' onClick={e => e.stopPropagation()}>
            <p className='text-[17px] font-bold text-gray-900'>{conflict.sameSlot ? 'Booking already exists' : 'Active booking found'}</p>
            <p className='mt-1 text-[13px] text-gray-500'>{conflict.sameSlot ? 'A booking already exists for the same slot.' : 'Cancel existing booking or continue booking.'}</p>
            {conflict.order.slot_start_at && (
              <p className='mt-3 rounded-xl bg-gray-50 px-3 py-2 text-[13px] text-gray-700'>
                Existing: {new Date(conflict.order.slot_start_at).toLocaleString('en-US', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              </p>
            )}
            <div className='mt-5 flex flex-col gap-2'>
              {!conflict.sameSlot && (
                <button type='button' disabled={busy} onClick={cancelExisting} className='rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50'>
                  {busy ? 'Cancelling…' : 'Cancel existing booking'}
                </button>
              )}
              <button type='button' disabled={busy} onClick={() => { const same = conflict.sameSlot; setConflict(null); if (!same) setStep('summary') }} className='rounded-full bg-brand py-3 text-sm font-bold text-white hover:bg-brand-dark'>
                {conflict.sameSlot ? 'Okay' : 'Continue booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>)
  }

  /* ── Services (app parity: ServiceSelectionScreen.jsx) ─────────────── */
  return frame(<>
    <div className='flex flex-col gap-6 lg:grid lg:grid-cols-[200px_minmax(0,1fr)_280px] lg:items-start lg:gap-8 xl:grid-cols-[240px_minmax(0,1fr)_320px]'>
      {/* categories — a card on desktop, image chips on phones */}
      <nav aria-label='Service categories' className='lg:sticky lg:top-6'>
        <div className={cn('lg:overflow-hidden', 'lg:rounded-2xl lg:border lg:border-[#F0F0F0] lg:bg-white lg:shadow-[0_2px_12px_rgba(0,0,0,0.05)]')}>
          <p className='hidden border-b border-[#F3F3F3] px-4 py-3 text-[15px] font-bold text-[#101010] lg:block'>Categories</p>
          <div className='scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:max-h-[calc(100vh-7rem)] lg:flex-col lg:gap-0 lg:overflow-y-auto lg:px-0 lg:py-1.5'>
            {categories.map(c => {
              const on = c.id === category?.id
              return (
                <button
                  key={c.id}
                  type='button'
                  onClick={() => { setCategoryId(c.id); setGender('WOMEN') }}
                  aria-current={on ? 'true' : undefined}
                  className={cn(
                    'relative flex shrink-0 items-center gap-2.5 rounded-full border py-1.5 pr-4 pl-1.5 text-left text-sm font-semibold transition-colors',
                    'lg:rounded-none lg:border-0 lg:py-2 lg:pr-3 lg:pl-4 lg:text-[13px]',
                    on
                      ? 'border-brand bg-brand-tint text-brand lg:bg-[#FFF5F0] lg:before:absolute lg:before:inset-y-1.5 lg:before:left-0 lg:before:w-[3px] lg:before:rounded-r-full lg:before:bg-brand'
                      : 'border-[#EAEAEA] bg-white text-[#2C2D32] hover:bg-gray-50 lg:font-medium lg:text-[#5B5A5A] lg:hover:bg-[#FAFAFA]',
                  )}
                >
                  <span className='relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF3EE] lg:size-9 lg:rounded-xl'>
                    {c.image ? <Image src={c.image} alt='' fill className='object-cover' sizes='36px' /> : <span className='text-xs font-bold text-brand'>{c.title[0]?.toUpperCase()}</span>}
                  </span>
                  <span className='line-clamp-2 leading-tight'>{c.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* services */}
      <section className='min-w-0'>
        <div className='sticky top-0 z-20 -mt-6 flex flex-wrap items-center justify-between gap-3 bg-[#FAFAFA] pt-6 pb-4'>
          <h2 className='text-xl font-bold text-[#101010]'>{category?.title}</h2>
          {/* Women / Men — a segmented switch */}
          <div role='tablist' aria-label='Services for' className='flex rounded-full border border-[#EAEAEA] bg-white p-1'>
            {GENDERS.map(g => (
              <button
                key={g}
                type='button'
                role='tab'
                aria-selected={gender === g}
                onClick={() => setGender(g)}
                className={cn('rounded-full px-5 py-1.5 text-[13px] font-semibold transition-colors', gender === g ? 'bg-[#101010] text-white' : 'text-[#5B5A5A] hover:text-[#101010]')}
              >
                {g === 'MEN' ? 'Men' : 'Women'}
              </button>
            ))}
          </div>
        </div>

        {visibleItems.length === 0 ? (
          <p className={cn(CARD, 'px-4 py-12 text-center text-[13px] text-[#8A8A8E]')}>No {gender === 'MEN' ? 'men’s' : 'women’s'} services in this category.</p>
        ) : (
          <ul className='grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]'>
            {visibleItems.map(item => {
              const n = counts[item.id] ?? 0
              const duration = formatDuration(item.duration_minutes)
              return (
                <li key={item.id} className={cn(CARD, 'flex flex-col p-5 transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]', n > 0 && 'border-brand/40')}>
                  <p className='text-base font-bold text-[#101010]'>{item.title}</p>
                  {item.description && <p className='mt-1.5 line-clamp-2 text-[13px] leading-5 text-[#8A8A8E]'>{item.description}</p>}
                  <div className='mt-auto flex items-center justify-between gap-3 pt-4'>
                    <span className='flex flex-col'>
                      {Number(item.price) > 0 && <span className='text-base font-bold text-[#101010]'>{money(Number(item.price))}</span>}
                      {duration && <span className='flex items-center gap-1 text-xs text-[#8A8A8E]'><Clock className='size-3' /> {duration}</span>}
                    </span>
                    <Stepper n={n} onAdd={() => change(item.id, 1)} onRemove={() => change(item.id, -1)} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* summary — sticky on desktop */}
      <aside className='hidden lg:sticky lg:top-6 lg:block'>
        {summary(button(totalCount ? 'Pick date & time' : 'Add a service to continue', () => setStep('slot'), !totalCount), true)}
      </aside>
    </div>

    {/* phones and tablets — the selection as a bottom bar */}
    {totalCount > 0 && (
      <div className='fixed inset-x-0 bottom-0 z-30 border-t border-gray-100 bg-white px-4 pt-3 pb-4 shadow-lg lg:hidden'>
        <div className='mx-auto flex max-w-3xl items-center justify-between gap-4'>
          <div className='min-w-0'>
            <p className='truncate text-[14px] font-bold text-gray-900'>{selected[0]?.title}{selected.length > 1 ? ` +${selected.length - 1} more` : ''}</p>
            <p className='text-[12px] text-gray-500'>{totalCount} service{totalCount === 1 ? '' : 's'}{servicesTotal > 0 ? ` · ${money(servicesTotal)}` : ''}</p>
          </div>
          <button type='button' onClick={() => setStep('slot')} className='shrink-0 rounded-full bg-brand px-6 py-3 text-[14px] font-bold text-white hover:bg-brand-dark'>Pick date &amp; time</button>
        </div>
      </div>
    )}
  </>)
}

/** Add / − n + — the site's pill stepper. */
function Stepper({ n, onAdd, onRemove, small = false }: { n: number; onAdd: () => void; onRemove: () => void; small?: boolean }) {
  const h = small ? 'h-7 min-w-20' : 'h-9 min-w-22'
  if (n === 0) {
    return (
      <button type='button' onClick={onAdd} className={cn(h, 'shrink-0 rounded-full border-[1.5px] border-brand bg-white px-5 text-sm font-bold text-brand transition-colors hover:bg-brand-tint')}>
        Add
      </button>
    )
  }
  return (
    <span className={cn(h, 'flex shrink-0 items-center justify-between overflow-hidden rounded-full bg-brand text-white')}>
      <button type='button' aria-label='Remove one' onClick={onRemove} className={cn('flex h-full items-center justify-center hover:bg-brand-dark', small ? 'w-7' : 'w-8')}><Minus className='size-3.5' /></button>
      <span className='min-w-5 text-center text-sm font-bold' aria-live='polite'>{n}</span>
      <button type='button' aria-label='Add one' onClick={onAdd} className={cn('flex h-full items-center justify-center hover:bg-brand-dark', small ? 'w-7' : 'w-8')}><Plus className='size-3.5' /></button>
    </span>
  )
}

/**
 * Time slots as the table-booking page draws them (DiningBookingFlow): rounded
 * pills with a 1.5px #D5D5D5 border, the picked one orange on #FFF1EB.
 */
function SlotPills({ slots, selected, onSelect }: { slots: Slot[]; selected: string | null; onSelect: (slot: Slot) => void }) {
  if (!slots.length) {
    return <p className='rounded-2xl bg-[#f6f6f6] px-6 py-7 text-center text-[15px] text-[#8e8e93]'>No slots on this day — pick another date</p>
  }
  return (
    <div className='grid grid-cols-[repeat(auto-fill,minmax(118px,1fr))] gap-3'>
      {slots.map(s => {
        const on = s.time24 === selected
        return (
          <button
            key={s.absoluteMinutes}
            type='button'
            onClick={() => onSelect(s)}
            aria-pressed={on}
            className={cn(
              'flex h-14 items-center justify-center rounded-full border-[1.5px] border-solid text-[15px] font-medium transition-colors',
              on ? 'border-[#ff4800] bg-[#fff1eb] text-[#ff4800]' : 'border-[#d5d5d5] text-[#2c2d32] hover:border-[#bdbdbd]',
            )}
          >
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
