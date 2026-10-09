'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, ChevronLeft, Clock, Loader2, Minus, Plus, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthPrompt } from '@/lib/context/AuthPromptContext'
import { buildDates, buildSlots, dayLabel, longDate, type HoursRow, type Slot } from '@/lib/booking/slots'
import type { BookingOption, SelectedService, ServiceBooking } from '@/lib/booking/payload'
import { confirmBooking, startBookingPayment } from '@/lib/booking/client'
import { DateStrip, SlotGrid, TermsBlock } from '@/components/sections/booking/BookingPickers'
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
  coverChargeEnabled: boolean
  coverChargeAmount: number | null
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
  const dates = useMemo(() => buildDates(DATE_COUNT), [])

  const [step, setStep] = useState<'services' | 'slot' | 'review' | 'done'>('services')
  const [categoryId, setCategoryId] = useState(
    categories.find(c => c.id === initialCategoryId)?.id ?? categories[0]?.id ?? null,
  )
  const [gender, setGender] = useState<Gender>('WOMEN')
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [dateId, setDateId] = useState(dates[0].id)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [offerIdx, setOfferIdx] = useState(0)
  const [notes, setNotes] = useState('')
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

  // app parity: ReviewStoreBooking `bookingSummaryAmount`
  const coverAmount = Number(store.coverChargeAmount)
  const payAmount = store.coverChargeEnabled && Number.isFinite(coverAmount) && coverAmount > 0 ? coverAmount : 0
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
      else setStep('review')
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
      notes: notes.trim(),
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

  if (!categories.length) {
    return (
      <div className='mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center'>
        <p className='font-semibold text-gray-800'>This store hasn’t listed bookable services yet.</p>
        <Link href={store.href} className='mt-3 inline-block text-sm font-semibold text-brand'>Back to {store.name}</Link>
      </div>
    )
  }

  /* ── Done (app parity: PaymentSuccess after BookingSaving) ─────────── */
  if (step === 'done' && slot) {
    return (
      <div className='mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-8 text-center'>
        <CheckCircle2 className='h-14 w-14 text-green-600' />
        <p className='text-xl font-extrabold text-gray-900'>Appointment booked</p>
        <p className='text-sm text-gray-500'>
          {store.name} · {dayLabel(dateId)}, {longDate(dateId)} at {slot.label}
        </p>
        <p className='text-sm text-gray-500'>{selected.map(s => (s.quantity > 1 ? `${s.title} ×${s.quantity}` : s.title)).join(', ')}</p>
        <Link href={store.href} className='mt-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-dark'>
          Done
        </Link>
      </div>
    )
  }

  /* ── Review (app parity: ReviewStoreBooking.jsx) ───────────────────── */
  if (step === 'review' && slot) {
    return (
      <div className='mx-auto flex max-w-2xl flex-col gap-4'>
        <button type='button' onClick={() => setStep('slot')} className='flex w-fit items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900'>
          <ChevronLeft className='h-4 w-4' /> Change slot
        </button>

        {offer && (
          <div className='flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-[13px] font-semibold text-green-800'>
            <Ticket className='h-4 w-4' /> {offer.title} applied
          </div>
        )}

        <div className='rounded-2xl border border-gray-200 bg-white p-5'>
          <p className='text-[12px] font-semibold tracking-wide text-gray-400 uppercase'>Appointment</p>
          <div className='mt-3 grid grid-cols-2 divide-x divide-gray-100 text-center'>
            <div className='px-2'>
              <p className='text-[15px] font-bold text-gray-900'>{dayLabel(dateId)}</p>
              <p className='text-[12px] text-gray-500'>{longDate(dateId)}</p>
            </div>
            <div className='px-2'>
              <p className='text-[15px] font-bold text-gray-900'>{slot.label}</p>
              <p className='text-[12px] text-gray-500'>Best available stylist</p>
            </div>
          </div>
        </div>

        <div className='rounded-2xl border border-gray-200 bg-white p-5'>
          <p className='text-[12px] font-semibold tracking-wide text-gray-400 uppercase'>Services</p>
          <ul className='mt-3 space-y-2'>
            {selected.map(s => (
              <li key={s.id} className='flex justify-between gap-3 text-[14px]'>
                <span className='text-gray-800'>{s.title}{s.quantity > 1 && <span className='text-gray-400'> ×{s.quantity}</span>}</span>
                {s.price > 0 && <span className='font-semibold text-gray-900'>{money(s.price * s.quantity)}</span>}
              </li>
            ))}
          </ul>
          {servicesTotal > 0 && (
            <div className='mt-3 flex justify-between border-t border-gray-100 pt-3 text-[14px]'>
              <span className='text-gray-600'>Services total <span className='text-[12px] text-gray-400'>(pay at store)</span></span>
              <span className='font-bold text-gray-900'>{money(servicesTotal)}</span>
            </div>
          )}
          <div className='mt-2 flex justify-between text-[14px]'>
            <span className='text-gray-600'>Pay now</span>
            <span className='font-bold text-gray-900'>{isFree ? 'Free' : money(payAmount)}</span>
          </div>
        </div>

        <div className='rounded-2xl border border-gray-200 bg-white p-5'>
          <label className='text-[14px] font-semibold text-gray-900' htmlFor='svc-notes'>Notes for the store</label>
          <textarea
            id='svc-notes'
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder='Preferences, allergies…'
            className='mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none'
          />
        </div>

        <TermsBlock terms={store.bookingTerms.length ? store.bookingTerms : DEFAULT_TERMS} />

        {error && <p className='rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600'>{error}</p>}

        <button
          type='button'
          disabled={busy}
          onClick={confirm}
          className='flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-60'
        >
          {busy && <Loader2 className='h-4 w-4 animate-spin' />}
          {!isLoggedIn ? 'Log in to book' : isFree ? 'Book Appointment' : `Pay Now · ${money(payAmount)}`}
        </button>
      </div>
    )
  }

  /* ── Slot (app parity: ServiceBookSlotScreen.jsx) ──────────────────── */
  if (step === 'slot') {
    return (
      <div className='mx-auto flex max-w-2xl flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-5 md:p-6'>
        <button type='button' onClick={() => setStep('services')} className='flex w-fit items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900'>
          <ChevronLeft className='h-4 w-4' /> {totalCount} service{totalCount === 1 ? '' : 's'} selected
        </button>

        <section>
          <p className='mb-3 text-[14px] font-bold text-gray-900'>Select date</p>
          <DateStrip dates={dates} selectedId={dateId} onSelect={id => { setDateId(id); setSlot(null) }} />
        </section>

        <section>
          <p className='mb-3 text-[14px] font-bold text-gray-900'>Select time slot</p>
          <SlotGrid slots={slots} selected={slot?.time24 ?? null} onSelect={setSlot} emptyText='No slots available on this day' />
        </section>

        {offers.length > 0 && (
          <section>
            <p className='mb-3 text-[14px] font-bold text-gray-900'>Offers</p>
            <div className='flex flex-col gap-2'>
              {offers.map((o, i) => (
                <button
                  key={o.id}
                  type='button'
                  onClick={() => setOfferIdx(i)}
                  className={cn(
                    'flex items-start justify-between gap-3 rounded-2xl border p-4 text-left',
                    i === offerIdx ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-400',
                  )}
                >
                  <div>
                    <p className='text-[14px] font-bold text-gray-900'>{o.title}</p>
                    {o.description && <p className='mt-0.5 text-[12px] text-gray-500'>{o.description}</p>}
                  </div>
                  <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', i === offerIdx ? 'border-brand' : 'border-gray-300')}>
                    {i === offerIdx && <span className='h-2.5 w-2.5 rounded-full bg-brand' />}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {error && <p className='rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600'>{error}</p>}

        <button
          type='button'
          disabled={!slot || busy}
          onClick={proceedFromSlot}
          className='flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-40'
        >
          {busy && <Loader2 className='h-4 w-4 animate-spin' />}
          {isLoggedIn ? 'Proceed' : 'Log in to continue'}
        </button>

        {conflict && (
          <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center' onClick={() => !busy && setConflict(null)}>
            <div className='w-full max-w-sm rounded-2xl bg-white p-6' onClick={e => e.stopPropagation()}>
              <p className='text-[17px] font-bold text-gray-900'>{conflict.sameSlot ? 'Booking already exists' : 'Active booking found'}</p>
              <p className='mt-1 text-[13px] text-gray-500'>
                {conflict.sameSlot ? 'A booking already exists for the same slot.' : 'Cancel existing booking or continue booking.'}
              </p>
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
                <button
                  type='button'
                  disabled={busy}
                  onClick={() => { const same = conflict.sameSlot; setConflict(null); if (!same) setStep('review') }}
                  className='rounded-full bg-brand py-3 text-sm font-bold text-white hover:bg-brand-dark'
                >
                  {conflict.sameSlot ? 'Okay' : 'Continue booking'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ── Services (app parity: ServiceSelectionScreen.jsx) ─────────────── */
  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-5 pb-24'>
      <div className='scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-1'>
        {categories.map(c => (
          <button
            key={c.id}
            type='button'
            onClick={() => { setCategoryId(c.id); setGender('WOMEN') }}
            className='flex w-20 shrink-0 flex-col items-center gap-1.5 text-center'
          >
            <span className={cn('relative flex h-18 w-18 items-center justify-center overflow-hidden rounded-2xl border-2 bg-orange-50', c.id === category?.id ? 'border-brand' : 'border-transparent')}>
              {c.image ? <Image src={c.image} alt={c.title} fill className='object-cover' sizes='72px' /> : <span className='text-[20px] font-bold text-gray-700'>{c.title[0]?.toUpperCase()}</span>}
            </span>
            <span className={cn('line-clamp-2 text-[12px] leading-tight', c.id === category?.id ? 'font-semibold text-gray-900' : 'text-gray-600')}>{c.title}</span>
          </button>
        ))}
      </div>

      <div className='flex gap-2'>
        {GENDERS.map(g => (
          <button
            key={g}
            type='button'
            onClick={() => setGender(g)}
            className={cn('rounded-full border px-5 py-1.5 text-[13px] font-semibold', gender === g ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400')}
          >
            {g === 'MEN' ? 'Men' : 'Women'}
          </button>
        ))}
      </div>

      <div className='rounded-2xl border border-gray-200 bg-white'>
        {visibleItems.length === 0 ? (
          <p className='px-4 py-8 text-center text-[13px] text-gray-400'>No {gender === 'MEN' ? 'men’s' : 'women’s'} services in this category.</p>
        ) : (
          <ul className='divide-y divide-gray-100'>
            {visibleItems.map(item => {
              const n = counts[item.id] ?? 0
              const duration = formatDuration(item.duration_minutes)
              return (
                <li key={item.id} className='flex items-center justify-between gap-4 px-4 py-3.5'>
                  <div className='min-w-0'>
                    <p className='text-[14px] font-semibold text-gray-900'>{item.title}</p>
                    {item.description && <p className='mt-0.5 line-clamp-2 text-[12px] text-gray-500'>{item.description}</p>}
                    <p className='mt-1 flex items-center gap-2 text-[12px] text-gray-500'>
                      {Number(item.price) > 0 && <span className='font-bold text-gray-900'>{money(Number(item.price))}</span>}
                      {duration && <span className='flex items-center gap-1'><Clock className='h-3 w-3' /> {duration}</span>}
                    </p>
                  </div>
                  {n === 0 ? (
                    <button type='button' onClick={() => change(item.id, 1)} className='shrink-0 rounded-lg border border-brand px-4 py-1.5 text-[13px] font-bold text-brand hover:bg-brand/5'>
                      Add
                    </button>
                  ) : (
                    <div className='flex shrink-0 items-center gap-3 rounded-lg bg-brand px-2 py-1.5 text-white'>
                      <button type='button' aria-label='Remove one' onClick={() => change(item.id, -1)}><Minus className='h-4 w-4' /></button>
                      <span className='w-4 text-center text-[13px] font-bold'>{n}</span>
                      <button type='button' aria-label='Add one' onClick={() => change(item.id, 1)}><Plus className='h-4 w-4' /></button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {totalCount > 0 && (
        <div className='fixed inset-x-0 bottom-0 z-30 border-t border-gray-100 bg-white p-4 shadow-lg'>
          <div className='mx-auto flex max-w-2xl items-center justify-between gap-4'>
            <div className='min-w-0'>
              <p className='truncate text-[14px] font-bold text-gray-900'>
                {selected[0]?.title}{selected.length > 1 ? ` +${selected.length - 1} more` : ''}
              </p>
              <p className='text-[12px] text-gray-500'>
                {totalCount} service{totalCount === 1 ? '' : 's'}{servicesTotal > 0 ? ` · ${money(servicesTotal)}` : ''}
              </p>
            </div>
            <button type='button' onClick={() => setStep('slot')} className='shrink-0 rounded-full bg-brand px-6 py-3 text-[14px] font-bold text-white hover:bg-brand-dark'>
              Select slot
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
